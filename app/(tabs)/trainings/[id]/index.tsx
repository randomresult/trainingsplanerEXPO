import { useRef } from 'react';
import { Platform, View, ActivityIndicator, Alert, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen, Text, Button, Card, Badge, Avatar, Icon } from '@/components/ui';
import { AddExercisesSheet, AddExercisesSheetRef } from '@/components/sheets/AddExercisesSheet';
import {
  useTrainingDetail,
  useDeleteTraining,
  useStartTraining,
  useRemoveExerciseFromTraining,
} from '@/lib/queries/useTrainings';

const statusBadge = {
  draft: { variant: 'muted' as const, label: 'Entwurf' },
  in_progress: { variant: 'warning-soft' as const, label: 'Läuft' },
  completed: { variant: 'success-soft' as const, label: 'Abgeschlossen' },
};

export default function TrainingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: training, isLoading } = useTrainingDetail(id);
  const deleteTraining = useDeleteTraining();
  const startTraining = useStartTraining();
  const removeExercise = useRemoveExerciseFromTraining();

  const addSheetRef = useRef<AddExercisesSheetRef>(null);

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
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      </Screen>
    );
  }

  if (!training) {
    return (
      <Screen padding="base">
        <View className="flex-1 items-center justify-center">
          <Text variant="footnote" color="muted">Training nicht gefunden</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      {/* Header */}
      <View className="px-5 pt-2 pb-4">
        <View className="flex-row justify-between items-start mb-3">
          <Text variant="title1" weight="bold" className="flex-1 mr-3">
            {training.Name}
          </Text>
          <Badge variant={statusBadge[training.training_status].variant}>
            {statusBadge[training.training_status].label}
          </Badge>
        </View>
        <View className="flex-row items-center gap-2">
          <Icon name="calendar-outline" size={14} color="muted" />
          <Text variant="body" color="muted">
            {new Date(training.Date).toLocaleDateString('de-DE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
      </View>

      {/* Players */}
      <View className="px-5 pb-4">
        <Text variant="headline" className="mb-3">
          Spieler ({training.players?.length || 0})
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-3">
            {training.players?.map((player) => (
              <View key={player.documentId} className="items-center">
                <Avatar
                  initials={(player.firstname?.[0] ?? '') + (player.Name?.[0] ?? '')}
                  size="md"
                  className="mb-2"
                />
                <Text variant="caption1" numberOfLines={1} className="max-w-[60px] text-center">
                  {player.firstname}
                </Text>
                {player.requiresInviteAcceptance && (
                  <Icon name="lock-closed-outline" size={10} color="warning" />
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Exercises */}
      <View className="px-5 pb-4">
        <Text variant="headline" className="mb-3">
          Übungen ({training.exercises?.length || 0})
        </Text>
        {training.exercises?.map((exercise, idx) => (
          <Card key={exercise.documentId} className="mb-3 flex-row items-center">
            <View className="flex-1">
              <View className="flex-row justify-between items-start">
                <Text variant="subhead" weight="semibold" className="flex-1 mr-2">
                  {idx + 1}. {exercise.Name}
                </Text>
                <Text variant="caption1" color="muted">{exercise.Minutes} Min</Text>
              </View>
            </View>
            {canEditExercises && (
              <Pressable
                onPress={() => confirmRemoveExercise(exercise.documentId, exercise.Name)}
                disabled={removeExercise.isPending}
                className="ml-3 w-8 h-8 rounded-full bg-destructive/10 items-center justify-center active:opacity-70 disabled:opacity-40"
              >
                <Icon name="close" size={16} color="destructive" />
              </Pressable>
            )}
          </Card>
        ))}

        {canEditExercises && (
          <Button
            variant="secondary"
            leftIcon="add"
            onPress={() => addSheetRef.current?.present()}
          >
            Übung hinzufügen
          </Button>
        )}
      </View>

      {/* Actions */}
      <View className="p-5 gap-3">
        {training.training_status === 'draft' && (
          <Button size="lg" loading={startTraining.isPending} onPress={handleStart}>
            Training starten
          </Button>
        )}
        {training.training_status === 'in_progress' && (
          <Button
            size="lg"
            variant="primary"
            onPress={() => router.push(`/trainings/${id}/execute`)}
          >
            Fortsetzen
          </Button>
        )}
        <Button
          size="lg"
          variant="destructive"
          leftIcon="trash-outline"
          loading={deleteTraining.isPending}
          onPress={handleDelete}
        >
          Training löschen
        </Button>
      </View>

      <AddExercisesSheet ref={addSheetRef} trainingId={id} />
    </Screen>
  );
}
