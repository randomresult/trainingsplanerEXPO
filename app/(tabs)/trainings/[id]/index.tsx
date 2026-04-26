import { Platform, View, ActivityIndicator, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen, Text, Button, Card, Badge, Icon, PlayerCard, toast, SkeletonDetail, SkeletonList, MethodicalSeriesBlock } from '@/components/ui';
import {
  useTrainingDetail,
  useDeleteTraining,
  useStartTraining,
  useRemoveExerciseFromTraining,
  useRemovePlayerFromTraining,
  useAddPlayersToTraining,
  useRemoveMethodicalSeriesFromTraining,
} from '@/lib/queries/useTrainings';
import { usePickModeStore } from '@/lib/store/pickModeStore';
import { COLORS } from '@/lib/theme';

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
  const removePlayer = useRemovePlayerFromTraining();
  const addPlayers = useAddPlayersToTraining();
  const removeSeries = useRemoveMethodicalSeriesFromTraining();

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

  const confirmRemovePlayer = (playerId: string, playerName: string) => {
    const msg = `Spieler "${playerName}" aus dem Training entfernen?`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(msg)) {
        removePlayer.mutate({ trainingId: id, playerId });
      }
      return;
    }
    Alert.alert('Spieler entfernen', msg, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Entfernen',
        style: 'destructive',
        onPress: () => removePlayer.mutate({ trainingId: id, playerId }),
      },
    ]);
  };

  const handleDelete = () => {
    const msg = `"${training?.Name}" wirklich löschen?`;
    const proceed = () => {
      deleteTraining.mutate(id, {
        onSuccess: () => {
          if (router.canGoBack()) router.back();
          else router.replace('/trainings');
        },
      });
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(msg)) proceed();
      return;
    }
    Alert.alert('Training löschen', msg, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: proceed },
    ]);
  };

  const handleStart = async () => {
    await startTraining.mutateAsync(id);
    router.push(`/trainings/${id}/execute`);
  };

  const handleAddExercises = () => {
    if (!training) return;
    router.push({
      pathname: '/library-pick',
      params: { trainingId: id, trainingName: training.Name },
    });
  };

  const handleAddPlayers = () => {
    if (!training) return;
    const existingIds = training.players?.map((p) => p.documentId) ?? [];
    usePickModeStore.getState().start([], async (newIds) => {
      if (newIds.length === 0) return;
      try {
        await addPlayers.mutateAsync({ trainingId: id, playerIds: newIds });
        toast.success(
          newIds.length === 1
            ? 'Spieler hinzugefügt'
            : `${newIds.length} Spieler hinzugefügt`
        );
      } catch {
        toast.error('Spieler konnten nicht hinzugefügt werden');
      }
    });
    router.push(`/player-picker?excludeIds=${existingIds.join(',')}`);
  };

  if (isLoading) {
    return (
      <Screen scroll padding="base">
        <SkeletonDetail />
        <View className="mt-6">
          <SkeletonList count={3} />
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

      {/* Exercises — MÜR blocks first, then standalone */}
      <View className="px-5 pb-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text variant="headline">Übungen ({training.exercises?.length || 0})</Text>
          {canEditExercises && (
            <Button variant="ghost" size="sm" leftIcon="add" onPress={handleAddExercises}>
              Hinzufügen
            </Button>
          )}
        </View>

        {/* MÜR blocks */}
        {(training.methodicalSeries ?? []).map((series) => {
          const seriesDocId = series.documentId;
          const blockExercises = (training.exercises ?? []).filter(
            (e) => e.methodicalSeries?.some((s) => s.documentId === seriesDocId)
          );
          return (
            <MethodicalSeriesBlock
              key={seriesDocId}
              series={series}
              blockExercises={blockExercises}
              totalInSeries={blockExercises.length}
              mode={canEditExercises ? 'edit' : 'view'}
              onRemoveSeries={
                canEditExercises
                  ? () =>
                      removeSeries.mutate({
                        trainingId: id,
                        seriesDocumentId: seriesDocId,
                        exerciseDocumentIds: blockExercises.map((e) => e.documentId),
                      })
                  : undefined
              }
              onRemoveExercise={
                canEditExercises
                  ? (exerciseId) => removeExercise.mutate({ trainingId: id, exerciseId })
                  : undefined
              }
            />
          );
        })}

        {/* Standalone exercises — not belonging to any MÜR in this training */}
        {(() => {
          const seriesIds = new Set((training.methodicalSeries ?? []).map((s) => s.documentId));
          const standalone = (training.exercises ?? []).filter(
            (e) => !e.methodicalSeries?.some((s) => seriesIds.has(s.documentId))
          );
          return standalone.map((exercise, idx) => (
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
                  hitSlop={8}
                  className="ml-3 w-11 h-11 rounded-full bg-destructive/10 items-center justify-center active:opacity-70 disabled:opacity-40"
                >
                  <Icon name="close" size={20} color="destructive" />
                </Pressable>
              )}
            </Card>
          ));
        })()}
      </View>

      {/* Players */}
      <View className="px-5 pb-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text variant="headline">Spieler ({training.players?.length || 0})</Text>
          {canEditExercises && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon="add"
              onPress={handleAddPlayers}
            >
              Hinzufügen
            </Button>
          )}
        </View>
        {training.players?.map((p) => (
          <PlayerCard
            key={p.documentId}
            player={p}
            compact
            className="mb-2"
            showRemove={canEditExercises}
            onRemove={() =>
              confirmRemovePlayer(
                p.documentId,
                [p.firstname, p.Name].filter(Boolean).join(' ') || 'Spieler'
              )
            }
          />
        ))}
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
    </Screen>
  );
}
