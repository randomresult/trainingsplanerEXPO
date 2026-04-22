import { useState } from 'react';
import { View, TextInput, ScrollView } from 'react-native';
import { ExerciseCard, Text, Icon } from '@/components/ui';
import { useExercises } from '@/lib/queries/useExercises';
import { Pressable } from 'react-native';
import { triggerHaptic } from '@/lib/haptics';

interface Props {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function ExerciseSelector({ selectedIds, onSelectionChange }: Props) {
  const [search, setSearch] = useState('');
  const { data: exercises } = useExercises(search);

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
        placeholder="Übung suchen..."
        placeholderTextColor="#666"
        className="bg-card border border-border rounded-lg px-4 py-3 text-foreground mb-3"
      />
      <ScrollView style={{ maxHeight: 280 }}>
        <View className="gap-2">
          {(exercises ?? []).map((ex: any) => {
            const selected = selectedIds.includes(ex.documentId);
            return (
              <ExerciseCard
                key={ex.documentId}
                exercise={ex}
                compact
                onPress={() => toggle(ex.documentId)}
                trailing={
                  <Pressable onPress={() => toggle(ex.documentId)}>
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
