import { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTrainingDetail, useCompleteTraining } from '@/lib/queries/useTrainings';
import { useTrainingExecution } from '@/lib/hooks/useTrainingExecution';
import { formatTime } from '@/lib/utils/formatTime';
import { cn } from '@/lib/utils/cn';

export default function ExecuteTrainingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: training, isLoading } = useTrainingDetail(id);
  const [expanded, setExpanded] = useState(false);
  const completeTraining = useCompleteTraining();

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

  const handleFinishTraining = () => {
    Alert.alert(
      'Training beenden',
      'Möchtest du das Training wirklich beenden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Beenden',
          style: 'destructive',
          onPress: () => {
            // Create player-progress data (points based on completion)
            const playerProgressData = training?.players?.flatMap((player) =>
              exerciseStates
                .filter((ex) => ex.completed)
                .map((ex) => ({
                  playerId: player.documentId,
                  exerciseId: ex.documentId,
                  points: 10, // Base points for completion
                }))
            ) || [];

            completeTraining.mutate({
              trainingId: id,
              sessionDuration: sessionElapsed,
              playerProgressData,
            });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6c47ff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header (Sticky) */}
      <View className="bg-background border-b border-border px-5 py-4">
        {/* Back + Session Timer + Stop */}
        <View className="flex-row justify-between items-center mb-3">
          <Pressable onPress={() => router.back()}>
            <Text className="text-xl text-muted-foreground">←</Text>
          </Pressable>

          <View className="flex-1 items-center">
            <Text className="text-sm font-semibold mb-0.5">{training?.Name}</Text>
            <Text className="text-2xl font-bold text-warning">
              {formatTime(sessionElapsed)}
            </Text>
          </View>

          <Pressable
            onPress={handleFinishTraining}
            className="bg-destructive/10 px-3 py-1.5 rounded-lg"
          >
            <Text className="text-destructive font-bold text-xs">■</Text>
          </Pressable>
        </View>

        {/* Progress */}
        <Text className="text-xs font-bold text-success mb-2">
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
          <View className="bg-card rounded-xl p-3.5 mx-5 mt-5 border border-border">
            <Text className="text-center text-sm text-muted-foreground">
              Wähle eine Übung aus der Liste, um zu starten
            </Text>
          </View>
        ) : (
          <View className="bg-card rounded-xl p-3.5 mx-5 mt-5 border border-primary">
            <View className="flex-row justify-between items-center mb-2.5">
              <Text className="text-[11px] font-bold text-primary uppercase">
                Aktuelle Übung
              </Text>
              <Text className="text-xs font-bold text-warning">
                ⏱ {formatTime(exerciseElapsed)}
              </Text>
            </View>

            <Pressable
              onPress={() => setExpanded(!expanded)}
              className="flex-row justify-between items-start mb-2"
            >
              <Text className="text-base font-semibold flex-1">
                {currentExercise.Name}
              </Text>
              <View className="bg-muted rounded px-2 py-1">
                <Text className="text-lg text-muted-foreground">
                  {expanded ? '⌃' : '⌄'}
                </Text>
              </View>
            </Pressable>

            <Text className="text-xs text-muted-foreground leading-relaxed">
              {currentExercise.Description}
            </Text>

            {expanded && (
              <View className="border-t border-border pt-3 mt-3">
                <Text className="text-xs font-bold mb-2">📋 Anleitung:</Text>
                {currentExercise.Steps?.map((step, idx) => (
                  <View key={idx} className="flex-row mb-1.5">
                    <Text className="text-xs text-muted-foreground mr-2">
                      {idx + 1}.
                    </Text>
                    <Text className="text-xs text-muted-foreground flex-1">
                      {step}
                    </Text>
                  </View>
                ))}

                {currentExercise.Hint && (
                  <>
                    <Text className="text-xs font-bold mt-3 mb-1.5">
                      💡 Trainer-Hinweis:
                    </Text>
                    <View className="bg-warning/10 rounded px-2 py-2">
                      <Text className="text-xs text-foreground">
                        {currentExercise.Hint}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        )}

        {/* Exercise List */}
        <View className="bg-muted/40 rounded-xl p-3 mx-5 mt-3 mb-20 border-l-[3px] border-primary">
          <View className="flex-row justify-between items-center mb-2 px-1">
            <Text className="text-[11px] font-bold text-primary uppercase">
              Übungen
            </Text>
            <Text className="text-[11px] font-bold text-primary">
              {completedCount}/{exerciseStates.length}
            </Text>
          </View>

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
                  <Text className="text-xs font-bold text-background">✓</Text>
                )}
              </Pressable>

              <View className="flex-1">
                <Text
                  className={cn(
                    'text-sm font-semibold',
                    ex.completed && 'line-through text-muted-foreground'
                  )}
                >
                  {ex.Name}
                </Text>

                {ex.isActive && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      togglePause();
                    }}
                    className="mt-1 self-start"
                  >
                    <Text className="text-[11px] text-primary font-semibold">
                      {ex.isPaused ? '▶ Fortsetzen' : '⏸ Pause'}
                    </Text>
                  </Pressable>
                )}
              </View>

              <View className="bg-background/80 border border-border rounded px-2.5 py-1">
                <Text
                  className={cn(
                    'text-[11px]',
                    ex.isActive && 'text-warning'
                  )}
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
        <Pressable
          onPress={handleFinishTraining}
          disabled={completeTraining.isPending}
          className="w-full p-3.5 bg-destructive rounded-xl disabled:opacity-50"
        >
          {completeTraining.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-sm font-semibold text-destructive-foreground">
              Training beenden
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
