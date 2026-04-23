import { useCallback, useMemo, useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Pressable,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Text, PlayerCard, Icon, FilterChip } from '@/components/ui';
import { usePlayers } from '@/lib/queries/usePlayers';
import { usePickModeStore } from '@/lib/store/pickModeStore';
import { COLORS } from '@/lib/theme';

export default function PlayerPickerScreen() {
  const { excludeIds } = useLocalSearchParams<{ excludeIds?: string }>();
  const excluded = useMemo(
    () => new Set((excludeIds ?? '').split(',').filter(Boolean)),
    [excludeIds]
  );

  const [search, setSearch] = useState('');
  const [pendingOnly, setPendingOnly] = useState(false);
  const { data: players, isLoading } = usePlayers();

  const selectedIds = usePickModeStore((s) => s.selectedIds);
  const toggle = usePickModeStore((s) => s.toggle);
  const confirm = usePickModeStore((s) => s.confirm);

  const filtered = useMemo(() => {
    const base = (players ?? []).filter((p: any) => !excluded.has(p.documentId));
    const afterPending = pendingOnly
      ? base.filter((p: any) => p.requiresInviteAcceptance)
      : base;
    if (!search.trim()) return afterPending;
    const q = search.toLowerCase();
    return afterPending.filter(
      (p: any) =>
        (p.firstname ?? '').toLowerCase().includes(q) ||
        (p.Name ?? '').toLowerCase().includes(q)
    );
  }, [players, excluded, search, pendingOnly]);

  const activeFilterCount = pendingOnly ? 1 : 0;

  useFocusEffect(
    useCallback(() => {
      return () => {
        const store = usePickModeStore.getState();
        if (store.active) store.cancel();
      };
    }, [])
  );

  const handleConfirm = () => {
    confirm();
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Spieler auswählen',
          headerBackTitle: 'Abbrechen',
          headerRight: () => (
            <Pressable onPress={handleConfirm} className="px-2">
              <Text variant="body" weight="semibold" color="primary">
                Fertig ({selectedIds.length})
              </Text>
            </Pressable>
          ),
        }}
      />

      <View className="px-5 pt-4 pb-2">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Spieler suchen..."
          placeholderTextColor="#666"
          className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
        />
      </View>

      <View className="flex-row gap-2 px-5 pb-3 flex-wrap">
        <FilterChip
          label="Einladung ausstehend"
          leadingIcon="lock-closed-outline"
          active={pendingOnly}
          badge={activeFilterCount}
          onPress={() => setPendingOnly((s) => !s)}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <Pressable onPress={Keyboard.dismiss} className="flex-1">
          <FlatList
            data={filtered}
            keyExtractor={(item: any) => item.documentId}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Icon name="people-outline" size={40} color="muted" />
                <Text variant="footnote" color="muted" className="mt-3">
                  {search ? 'Keine Spieler gefunden' : 'Keine Spieler vorhanden'}
                </Text>
              </View>
            }
            renderItem={({ item }: { item: any }) => {
              const selected = selectedIds.includes(item.documentId);
              return (
                <PlayerCard
                  player={item}
                  onPress={() => toggle(item.documentId)}
                  trailing={
                    <Icon
                      name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                      color={selected ? 'primary' : 'muted'}
                      size={24}
                    />
                  }
                />
              );
            }}
          />
        </Pressable>
      )}
    </Screen>
  );
}
