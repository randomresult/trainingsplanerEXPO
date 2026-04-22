import { useState } from 'react';
import { View, TextInput, ScrollView, Pressable } from 'react-native';
import { PlayerCard, Icon } from '@/components/ui';
import { usePlayers } from '@/lib/queries/usePlayers';
import { triggerHaptic } from '@/lib/haptics';

interface Props {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function PlayerSelector({ selectedIds, onSelectionChange }: Props) {
  const [search, setSearch] = useState('');
  const { data: players } = usePlayers();

  const filtered = (players ?? []).filter((p: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.firstname ?? '').toLowerCase().includes(q) ||
      (p.Name ?? '').toLowerCase().includes(q)
    );
  });

  const toggle = (id: string) => {
    triggerHaptic('selection');
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <View>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Spieler suchen..."
        placeholderTextColor="#666"
        className="bg-card border border-border rounded-lg px-4 py-3 text-foreground mb-3"
      />
      <ScrollView style={{ maxHeight: 280 }}>
        <View className="gap-2">
          {filtered.map((p: any) => {
            const selected = selectedIds.includes(p.documentId);
            return (
              <PlayerCard
                key={p.documentId}
                player={p}
                compact
                onPress={() => toggle(p.documentId)}
                trailing={
                  <Pressable onPress={() => toggle(p.documentId)}>
                    <Icon
                      name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                      color={selected ? 'primary' : 'muted'}
                      size={24}
                    />
                  </Pressable>
                }
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
