import { Platform, View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  useTrainingDetail,
  useDeleteTraining,
  useStartTraining,
  useRemoveExerciseFromTraining,
} from '@/lib/queries/useTrainings';
import { cn } from '@/lib/utils/cn';

const STATUS_LABELS = {
  draft: 'Entwurf',
  in_progress: 'Läuft',
  completed: 'Abgeschlossen',
};

const STATUS_COLORS = {
  draft: 'bg-muted text-muted-foreground',
  in_progress: 'bg-warning/10 text-warning border-warning',
  completed: 'bg-success/10 text-success border-success',
};

export default function TrainingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: training, isLoading } = useTrainingDetail(id);
  const deleteTraining = useDeleteTraining();
  const startTraining = useStartTraining();
  const removeExercise = useRemoveExerciseFromTraining();

  const canEditExercises =
    training?.training_status === 'draft' || training?.training_status === 'in_progress';

  const confirmRemoveExercise = (exerciseId: string, exerciseName: string) => {
    const msg = `Übung "${exerciseName}" aus dem Training entfernen?`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(msg)) {
        removeExercise.mutate({ trainingId: id, exerciseId });
      }
      return;
    }
    Alert.alert('Übung entfernen', msg, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Entfernen',
        style: 'destructive',
        onPress: () => removeExercise.mutate({ trainingId: id, exerciseId }),
      },
    ]);
  };

  const handleDelete = () => {
    const msg = `"${training?.Name}" wirklich löschen?`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(msg)) {
        deleteTraining.mutate(id);
      }
      return;
    }
    Alert.alert('Training löschen', msg, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: () => deleteTraining.mutate(id),
      },
    ]);
  };

  const handleStart = async () => {
    await startTraining.mutateAsync(id);
    router.push(`/trainings/${id}/execute`);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6c47ff" />
      </View>
    );
  }

  if (!training) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-5">
        <Text className="text-muted-foreground text-center">Training nicht gefunden</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header */}
      <View className="p-5 pb-4">
        <View className="flex-row justify-between items-start mb-3">
          <Text className="text-2xl font-bold text-foreground flex-1 mr-3">
            {training.Name}
          </Text>
          <View className={cn('px-3 py-1.5 rounded border', STATUS_COLORS[training.training_status])}>
            <Text className="text-xs font-semibold">
              {STATUS_LABELS[training.training_status]}
            </Text>
          </View>
        </View>

        <Text className="text-base text-muted-foreground">
          {new Date(training.Date).toLocaleDateString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Players */}
      <View className="px-5 pb-4">
        <Text className="text-base font-semibold text-foreground mb-3">
          Spieler ({training.players?.length || 0})
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3">
          {training.players?.map((player) => (
            <View key={player.documentId} className="items-center">
              <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center mb-2">
                <Text className="text-lg font-bold text-primary">
                  {player.firstname[0]}{player.Name[0]}
                </Text>
              </View>
              <Text className="text-xs text-foreground text-center max-w-[60px]" numberOfLines={1}>
                {player.firstname}
              </Text>
              {player.requiresInviteAcceptance && (
                <Text className="text-[10px] text-warning mt-0.5">🔒</Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Exercises */}
      <View className="px-5 pb-4">
        <Text className="text-base font-semibold text-foreground mb-3">
          Übungen ({training.exercises?.length || 0})
        </Text>
        {training.exercises?.map((exercise, idx) => (
          <View
            key={exercise.documentId}
            className="bg-card rounded-xl p-4 mb-3 border border-border flex-row items-center"
          >
            <View className="flex-1">
              <View className="flex-row justify-between items-start">
                <Text className="text-sm font-semibold text-foreground flex-1 mr-2">
                  {idx + 1}. {exercise.Name}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {exercise.Minutes} Min
                </Text>
              </View>
            </View>
            {canEditExercises && (
              <Pressable
                onPress={() => confirmRemoveExercise(exercise.documentId, exercise.Name)}
                disabled={removeExercise.isPending}
                className="ml-3 w-8 h-8 rounded-full bg-destructive/10 items-center justify-center active:opacity-70 disabled:opacity-40"
              >
                <Text className="text-destructive text-base font-bold">×</Text>
              </Pressable>
            )}
          </View>
        ))}

        {canEditExercises && (
          <Pressable
            onPress={() => router.push(`/trainings/${id}/add-exercises`)}
            className="border border-dashed border-primary rounded-xl p-4 mt-1 active:opacity-70"
          >
            <Text className="text-center text-sm font-semibold text-primary">
              + Übung hinzufügen
            </Text>
          </Pressable>
        )}
      </View>

      {/* Actions */}
      <View className="p-5 gap-3">
        {training.training_status === 'draft' && (
          <Pressable
            onPress={handleStart}
            disabled={startTraining.isPending}
            className="bg-primary rounded-xl p-4 disabled:opacity-50"
          >
            {startTraining.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center text-sm font-semibold text-primary-foreground">
                Training starten
              </Text>
            )}
          </Pressable>
        )}

        {training.training_status === 'in_progress' && (
          <Pressable
            onPress={() => router.push(`/trainings/${id}/execute`)}
            className="bg-warning rounded-xl p-4"
          >
            <Text className="text-center text-sm font-semibold text-background">
              Fortsetzen
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleDelete}
          disabled={deleteTraining.isPending}
          className="border border-destructive rounded-xl p-4 disabled:opacity-50"
        >
          {deleteTraining.isPending ? (
            <ActivityIndicator color="#ef4444" />
          ) : (
            <Text className="text-center text-sm font-semibold text-destructive">
              Training löschen
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
