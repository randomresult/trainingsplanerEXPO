import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, TextInput, FlatList, Pressable } from 'react-native';
import {
  BottomSheet,
  BottomSheetRef,
  ExerciseCard,
  Icon,
  Text,
} from '@/components/ui';
import { useExercises } from '@/lib/queries/useExercises';
import { triggerHaptic } from '@/lib/haptics';

export interface ExercisePickerSheetRef {
  present: () => void;
}

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export const ExercisePickerSheet = forwardRef<ExercisePickerSheetRef, Props>(
  function ExercisePickerSheet({ selectedIds, onChange }, ref) {
    const sheetRef = useRef<BottomSheetRef>(null);
    const [search, setSearch] = useState('');
    const { data: exercises } = useExercises(search);

    useImperativeHandle(ref, () => ({
      present: () => {
        setSearch('');
        sheetRef.current?.present();
      },
    }));

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
        title={`Übungen auswählen (${selectedIds.length})`}
      >
        <View className="flex-1">
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Übung suchen..."
            placeholderTextColor="#666"
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground mb-3"
          />
          <FlatList
            data={exercises ?? []}
            keyExtractor={(item: any) => item.documentId}
            contentContainerStyle={{ paddingBottom: 24, gap: 8 }}
            ListEmptyComponent={
              <Text variant="footnote" color="muted" className="text-center py-8">
                {search ? 'Keine Übungen gefunden' : 'Keine Übungen vorhanden'}
              </Text>
            }
            renderItem={({ item }: { item: any }) => {
              const selected = selectedIds.includes(item.documentId);
              return (
                <ExerciseCard
                  exercise={item}
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
