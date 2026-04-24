import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  BottomSheet,
  BottomSheetRef,
  Text,
  Icon,
  toast,
} from '@/components/ui';
import {
  useTrainings,
  useAddExerciseToTraining,
} from '@/lib/queries/useTrainings';
import type { Training } from '@/lib/types/models';

export interface TrainingPickerSheetRef {
  present: (exerciseId: string, exerciseName: string) => void;
}

type Props = object;

export const TrainingPickerSheet = forwardRef<TrainingPickerSheetRef, Props>(
  function TrainingPickerSheet(_, ref) {
    const sheetRef = useRef<BottomSheetRef>(null);
    const [exerciseId, setExerciseId] = useState<string | null>(null);
    const [exerciseName, setExerciseName] = useState<string>('');
    const { data: trainings } = useTrainings();
    const addExercise = useAddExerciseToTraining();
    const queryClient = useQueryClient();

    useImperativeHandle(ref, () => ({
      present: (id: string, name: string) => {
        setExerciseId(id);
        setExerciseName(name);
        // Trainings can be started / deleted / completed between sheet opens.
        // Force a fresh fetch so the list of "open" trainings is accurate.
        queryClient.invalidateQueries({ queryKey: ['trainings'] });
        sheetRef.current?.present();
      },
    }));

    const openTrainings = useMemo(
      () =>
        (trainings ?? [])
          .filter(
            (t) => t.training_status === 'draft' || t.training_status === 'in_progress'
          )
          .sort(
            (a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime()
          ),
      [trainings]
    );

    const handleAddToExisting = async (trainingId: string, trainingName: string) => {
      if (!exerciseId) return;
      try {
        await addExercise.mutateAsync({ trainingId, exerciseId });
        sheetRef.current?.dismiss();
        // Dismiss first, then toast — otherwise the sheet's closing animation
        // can visually swallow the toast on web / slow devices.
        toast.success(`Zu "${trainingName}" hinzugefügt`);
      } catch {
        toast.error('Hinzufügen fehlgeschlagen');
      }
    };

    const handleCreateNew = () => {
      if (!exerciseId) return;
      sheetRef.current?.dismiss();
      router.push(`/training-new?preselect=${encodeURIComponent(exerciseId)}`);
    };

    return (
      <BottomSheet
        ref={sheetRef}
        snapPoints={['55%']}
        title={exerciseName ? `"${exerciseName}" hinzufügen` : 'Zum Training hinzufügen'}
      >
        <View className="flex-1">
          {openTrainings.length > 0 ? (
            <View>
              <Text variant="caption1" color="muted" className="mb-2 uppercase tracking-wide">
                Heute &amp; kommend
              </Text>
              <View className="gap-1.5">
                {openTrainings.map((item: Training) => {
                  const isActive = item.training_status === 'in_progress';
                  return (
                    <Pressable
                      key={item.documentId}
                      onPress={() => handleAddToExisting(item.documentId, item.Name)}
                      disabled={addExercise.isPending}
                      className="bg-card rounded-lg p-3 flex-row items-center gap-3"
                    >
                      <View className="w-9 h-9 rounded-md bg-info/10 items-center justify-center">
                        <Icon name="calendar-outline" size={18} color="info" />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text variant="subhead" weight="semibold" numberOfLines={1}>
                            {item.Name}
                          </Text>
                          {isActive && (
                            <Text variant="caption2" weight="bold" color="warning">
                              LÄUFT
                            </Text>
                          )}
                        </View>
                        <Text variant="caption1" color="muted">
                          {new Date(item.Date).toLocaleDateString('de-DE', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                          {' · '}
                          {item.exercises?.length ?? 0} Übungen
                        </Text>
                      </View>
                      <Icon name="chevron-forward" size={16} color="muted" />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : (
            <Text variant="footnote" color="muted" className="text-center py-4">
              Du hast noch kein anstehendes Training.
            </Text>
          )}

          <Text variant="caption1" color="muted" className="mt-3 mb-2 uppercase tracking-wide">
            Oder
          </Text>
          <Pressable
            onPress={handleCreateNew}
            className="border border-dashed border-primary/40 bg-primary/5 rounded-lg p-3 flex-row items-center gap-3"
          >
            <View className="w-9 h-9 rounded-md bg-primary/15 items-center justify-center">
              <Icon name="add" size={20} color="primary" />
            </View>
            <View className="flex-1">
              <Text variant="subhead" weight="semibold" color="primary">
                Neues Training erstellen
              </Text>
              <Text variant="caption1" color="muted">
                Mit dieser Übung als Start
              </Text>
            </View>
            <Icon name="chevron-forward" size={16} color="primary" />
          </Pressable>
        </View>
      </BottomSheet>
    );
  }
);
