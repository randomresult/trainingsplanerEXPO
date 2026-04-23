import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { View, TextInput, FlatList, Pressable } from 'react-native';
import {
  BottomSheet,
  BottomSheetRef,
  Icon,
  PlayerCard,
  Text,
} from '@/components/ui';
import { usePlayers } from '@/lib/queries/usePlayers';
import { triggerHaptic } from '@/lib/haptics';

export interface PlayerPickerSheetRef {
  present: () => void;
}

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export const PlayerPickerSheet = forwardRef<PlayerPickerSheetRef, Props>(
  function PlayerPickerSheet({ selectedIds, onChange }, ref) {
    const sheetRef = useRef<BottomSheetRef>(null);
    const [search, setSearch] = useState('');
    const { data: players } = usePlayers();

    useImperativeHandle(ref, () => ({
      present: () => {
        setSearch('');
        sheetRef.current?.present();
      },
    }));

    const filtered = useMemo(() => {
      const base = players ?? [];
      if (!search.trim()) return base;
      const q = search.toLowerCase();
      return base.filter(
        (p: any) =>
          (p.firstname ?? '').toLowerCase().includes(q) ||
          (p.Name ?? '').toLowerCase().includes(q)
      );
    }, [players, search]);

    const toggle = (id: string) => {
      triggerHaptic('selection');
      onChange(
        selectedIds.includes(id)
          ? selectedIds.filter((x) => x !== id)
          : [...selectedIds, id]
      );
    };

    return (
      <BottomSheet
        ref={sheetRef}
        snapPoints={['90%']}
        title={`Spieler auswählen (${selectedIds.length})`}
      >
        <View className="flex-1">
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Spieler suchen..."
            placeholderTextColor="#666"
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground mb-3"
          />
          <FlatList
            data={filtered}
            keyExtractor={(item: any) => item.documentId}
            contentContainerStyle={{ paddingBottom: 24, gap: 8 }}
            ListEmptyComponent={
              <Text variant="footnote" color="muted" className="text-center py-8">
                {search ? 'Keine Spieler gefunden' : 'Keine Spieler vorhanden'}
              </Text>
            }
            renderItem={({ item }: { item: any }) => {
              const selected = selectedIds.includes(item.documentId);
              return (
                <PlayerCard
                  player={item}
                  compact
                  onPress={() => toggle(item.documentId)}
                  trailing={
                    <Pressable onPress={() => toggle(item.documentId)} hitSlop={8}>
                      <Icon
                        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                        color={selected ? 'primary' : 'muted'}
                        size={24}
                      />
                    </Pressable>
                  }
                />
              );
            }}
          />
        </View>
      </BottomSheet>
    );
  }
);
