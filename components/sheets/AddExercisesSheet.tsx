import { forwardRef, useImperativeHandle, useRef, useState, useMemo } from 'react';
import { View, TextInput, FlatList } from 'react-native';
import {
  BottomSheet,
  BottomSheetRef,
  Button,
  Text,
  ExerciseCard,
  toast,
} from '@/components/ui';
import {
  useTrainingDetail,
  useAddExerciseToTraining,
} from '@/lib/queries/useTrainings';
import { useExercises } from '@/lib/queries/useExercises';

export interface AddExercisesSheetRef {
  present: () => void;
}

interface Props {
  trainingId: string;
}

export const AddExercisesSheet = forwardRef<AddExercisesSheetRef, Props>(
  function AddExercisesSheet({ trainingId }, ref) {
    const sheetRef = useRef<BottomSheetRef>(null);
    const [search, setSearch] = useState('');
    const { data: training } = useTrainingDetail(trainingId);
    const { data: allExercises } = useExercises(search);
    const addExercise = useAddExerciseToTraining();

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
    }));

    const alreadyAddedIds = useMemo(
      () => new Set(training?.exercises?.map((e) => e.documentId) ?? []),
      [training]
    );

    const available = useMemo(
      () => (allExercises ?? []).filter((e: any) => !alreadyAddedIds.has(e.documentId)),
      [allExercises, alreadyAddedIds]
    );

    const handleAdd = async (exerciseId: string) => {
      try {
        await addExercise.mutateAsync({ trainingId, exerciseId });
        toast.success('Übung hinzugefügt');
      } catch {
        toast.error('Übung konnte nicht hinzugefügt werden');
      }
    };

    return (
      <BottomSheet ref={sheetRef} snapPoints={['90%']} title="Übungen hinzufügen">
        <View className="flex-1">
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Suchen..."
            placeholderTextColor="#666"
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground mb-4"
          />
          <FlatList
            data={available}
            keyExtractor={(item: any) => item.documentId}
            contentContainerStyle={{ paddingBottom: 40, gap: 12 }}
            ListEmptyComponent={
              <Text variant="footnote" color="muted" className="text-center py-8">
                {search
                  ? 'Keine Übungen gefunden'
                  : 'Alle Übungen sind bereits im Training'}
              </Text>
            }
            renderItem={({ item }: { item: any }) => (
              <ExerciseCard
                exercise={item}
                trailing={
                  <Button
                    variant="primary"
                    size="sm"
                    loading={addExercise.isPending}
                    onPress={() => handleAdd(item.documentId)}
                  >
                    Hinzufügen
                  </Button>
                }
              />
            )}
          />
        </View>
      </BottomSheet>
    );
  }
);
