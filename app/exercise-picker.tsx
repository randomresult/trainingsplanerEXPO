import { useCallback, useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Pressable,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Text, ExerciseCard, Icon } from '@/components/ui';
import { useExercises } from '@/lib/queries/useExercises';
import { usePickModeStore } from '@/lib/store/pickModeStore';
import { COLORS } from '@/lib/theme';

export default function ExercisePickerScreen() {
  const [search, setSearch] = useState('');
  const { data: exercises, isLoading } = useExercises(search);

  const selectedIds = usePickModeStore((s) => s.selectedIds);
  const toggle = usePickModeStore((s) => s.toggle);
  const confirm = usePickModeStore((s) => s.confirm);

  // Cleanup runs on blur — cancels if the user backed out without confirming.
  // If confirm() already ran, active is false and cancel is a no-op.
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
          title: 'Übungen auswählen',
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
          placeholder="Übung suchen..."
          placeholderTextColor="#666"
          className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <Pressable onPress={Keyboard.dismiss} className="flex-1">
          <FlatList
            data={exercises ?? []}
            keyExtractor={(item: any) => item.documentId}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Icon name="search-outline" size={40} color="muted" />
                <Text variant="footnote" color="muted" className="mt-3">
                  {search ? 'Keine Übungen gefunden' : 'Keine Übungen vorhanden'}
                </Text>
              </View>
            }
            renderItem={({ item }: { item: any }) => {
              const selected = selectedIds.includes(item.documentId);
              return (
                <ExerciseCard
                  exercise={item}
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
