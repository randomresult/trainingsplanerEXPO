import { useState, useRef } from 'react';
import { View, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTrainingDetail, useCompleteTraining } from '@/lib/queries/useTrainings';
import { useTrainingExecution } from '@/lib/hooks/useTrainingExecution';
import { formatTime } from '@/lib/utils/formatTime';
import { cn } from '@/lib/utils/cn';
import { Text, Icon, Button, Card } from '@/components/ui';
import { AddExercisesSheet, AddExercisesSheetRef } from '@/components/sheets/AddExercisesSheet';

export default function ExecuteTrainingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: training, isLoading } = useTrainingDetail(id);
  const [expanded, setExpanded] = useState(false);
  const completeTraining = useCompleteTraining();
  const addSheetRef = useRef<AddExercisesSheetRef>(null);

  const {
    sessionElapsed,
    exerciseElapsed,
    exerciseStates,
    currentExercise,
    completedCount,
    handleExercisePress,
    handleCompleteExercise,
    togglePause,
  } = useTrainingExecution(training?.exercises || []);

  const progressPercent = training?.exercises?.length
    ? (completedCount / training.exercises.length) * 100
    : 0;

  const confirmFinish = (onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Möchtest du das Training wirklich beenden?')) {
        onConfirm();
      }
      return;
    }
    Alert.alert('Training beenden', 'Möchtest du das Training wirklich beenden?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Beenden', style: 'destructive', onPress: onConfirm },
    ]);
  };

  const handleFinishTraining = () => {
    confirmFinish(() => {
      const completedExercises = exerciseStates.filter((ex) => ex.completed);
      const pointsPerExercise = 10;
      const pointsEarned = completedExercises.length * pointsPerExercise;

      const playerProgressData =
        training?.players?.map((player) => ({
          playerId: player.documentId,
          completedExerciseIds: completedExercises.map((ex) => ex.documentId),
          pointsEarned,
        })) || [];

      completeTraining.mutate({
        trainingId: id,
        sessionDuration: sessionElapsed,
        playerProgressData,
      });
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background items-center justify-center">
        <Icon name="reload-outline" size={32} color="primary" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      {/* Header (Sticky) */}
      <View className="bg-background border-b border-border px-5 py-4">
        {/* Back + Session Timer + Stop */}
        <View className="flex-row justify-between items-center mb-3">
          <Pressable onPress={() => router.back()} className="p-2">
            <Icon name="chevron-back" size={24} color="muted" />
          </Pressable>

          <View className="flex-1 items-center">
            <Text variant="subhead" weight="semibold" className="mb-0.5">
              {training?.Name}
            </Text>
            <Text variant="title1" weight="bold" color="warning">
              {formatTime(sessionElapsed)}
            </Text>
          </View>

          <Pressable
            onPress={handleFinishTraining}
            className="bg-destructive/10 px-3 py-1.5 rounded-lg"
          >
            <Icon name="stop" size={14} color="destructive" />
          </Pressable>
        </View>

        {/* Progress */}
        <Text variant="caption1" color="success" weight="bold" className="mb-2">
          {completedCount}/{exerciseStates.length} Übungen
        </Text>

        {/* Progress Bar */}
        <View className="bg-muted rounded h-1.5">
          <View
            className="bg-success h-full rounded"
            style={{ width: `${progressPercent}%` }}
          />
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Current Exercise Card (Accordion) */}
        {!currentExercise ? (
          <Card variant="elevated" className="mx-5 mt-5">
            <Text variant="subhead" color="muted" className="text-center">
              Wähle eine Übung aus der Liste, um zu starten
            </Text>
          </Card>
        ) : (
          <Card variant="elevated" className="mx-5 mt-5 !border-primary">
            <View className="flex-row justify-between items-center mb-2.5">
              <Text variant="caption2" weight="bold" color="primary" className="uppercase">
                Aktuelle Übung
              </Text>
              <View className="flex-row items-center gap-1">
                <Icon name="time-outline" size={12} color="warning" />
                <Text variant="caption1" weight="bold" color="warning">
                  {formatTime(exerciseElapsed)}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setExpanded(!expanded)}
              className="flex-row justify-between items-start mb-2"
            >
              <Text variant="callout" weight="semibold" className="flex-1">
                {currentExercise.Name}
              </Text>
              <View className="bg-muted rounded px-2 py-1">
                {expanded
                  ? <Icon name="chevron-up" size={20} color="muted" />
                  : <Icon name="chevron-down" size={20} color="muted" />
                }
              </View>
            </Pressable>

            <Text variant="caption1" color="muted" className="leading-relaxed">
              {currentExercise.Description}
            </Text>

            {expanded && (
              <View className="border-t border-border pt-3 mt-3">
                <View className="flex-row items-center gap-1 mb-2">
                  <Icon name="list-outline" size={12} color="foreground" />
                  <Text variant="caption1" weight="bold">Anleitung:</Text>
                </View>
                {currentExercise.Steps?.map((step: any, idx: number) => {
                  const text =
                    typeof step === 'string'
                      ? step
                      : [step?.Name, step?.Description].filter(Boolean).join(' — ');
                  return (
                    <View key={step?.id ?? idx} className="flex-row mb-1.5">
                      <Text variant="caption1" color="muted" className="mr-2">
                        {idx + 1}.
                      </Text>
                      <Text variant="caption1" color="muted" className="flex-1">
                        {text}
                      </Text>
                    </View>
                  );
                })}

                {currentExercise.Hint && (
                  <>
                    <View className="flex-row items-center gap-1 mt-3 mb-1.5">
                      <Icon name="bulb-outline" size={12} color="foreground" />
                      <Text variant="caption1" weight="bold">Trainer-Hinweis:</Text>
                    </View>
                    <View className="bg-warning/10 rounded px-2 py-2">
                      <Text variant="caption1">
                        {currentExercise.Hint}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            )}
          </Card>
        )}

        {/* Exercise List */}
        <View className="bg-muted/40 rounded-xl p-3 mx-5 mt-3 mb-20 border-l-[3px] border-primary">
          <View className="flex-row justify-between items-center mb-2 px-1">
            <Text variant="caption2" weight="bold" color="primary" className="uppercase">
              Übungen
            </Text>
            <Text variant="caption2" weight="bold" color="primary">
              {completedCount}/{exerciseStates.length}
            </Text>
          </View>

          <Button
            variant="secondary"
            leftIcon="add"
            size="sm"
            onPress={() => addSheetRef.current?.present()}
            className="mb-1.5 !border-dashed !border-primary"
          >
            Übung hinzufügen
          </Button>

          {exerciseStates.map((ex, idx) => (
            <Pressable
              key={ex.documentId}
              onPress={() => handleExercisePress(idx)}
              className={cn(
                'rounded-lg p-3 mb-1.5 flex-row items-center gap-2.5',
                ex.isActive && 'bg-warning/10 border border-warning',
                ex.completed && 'bg-background',
                !ex.completed && !ex.isActive && 'bg-background opacity-60'
              )}
            >
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  handleCompleteExercise(idx);
                }}
                className={cn(
                  'w-6 h-6 rounded border-2 items-center justify-center flex-shrink-0',
                  ex.completed && 'bg-success border-success',
                  ex.isActive && 'border-warning',
                  !ex.completed && !ex.isActive && 'border-muted-foreground'
                )}
              >
                {ex.completed && (
                  <Icon name="checkmark" size={12} color="inverse" />
                )}
              </Pressable>

              <View className="flex-1">
                <Text
                  variant="subhead"
                  weight="semibold"
                  color={ex.completed ? 'muted' : 'foreground'}
                  className={cn(ex.completed && 'line-through')}
                >
                  {ex.Name}
                </Text>

                {ex.isActive && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      togglePause();
                    }}
                    className="mt-1 self-start flex-row items-center gap-1"
                  >
                    {ex.isPaused
                      ? <Icon name="play" size={12} color="primary" />
                      : <Icon name="pause" size={12} color="primary" />
                    }
                    <Text variant="caption2" color="primary" weight="semibold">
                      {ex.isPaused ? 'Fortsetzen' : 'Pause'}
                    </Text>
                  </Pressable>
                )}
              </View>

              <View className="bg-background/80 border border-border rounded px-2.5 py-1">
                <Text
                  variant="caption2"
                  color={ex.isActive ? 'warning' : 'foreground'}
                >
                  {ex.Minutes}:00
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View className="absolute bottom-0 left-0 right-0 p-5 bg-card border-t border-border">
        <Button
          variant="destructive"
          size="lg"
          loading={completeTraining.isPending}
          onPress={handleFinishTraining}
          className="w-full"
        >
          Training beenden
        </Button>
      </View>

      <AddExercisesSheet ref={addSheetRef} trainingId={id} />
    </SafeAreaView>
  );
}
