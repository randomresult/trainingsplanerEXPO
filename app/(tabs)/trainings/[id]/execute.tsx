import React, { useState } from 'react';
import {
  Platform,
  View,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Text,
  Button,
  Card,
  Icon,
  Avatar,
  MediaThumbnail,
  MediaViewer,
  ExercisePills,
  toast,
} from '@/components/ui';
import {
  useTrainingDetail,
  useCompleteTraining,
  useRemoveExerciseFromTraining,
  useAddExerciseToTraining,
  useAddPlayersToTraining,
} from '@/lib/queries/useTrainings';
import { useTrainingExecution } from '@/lib/hooks/useTrainingExecution';
import { formatTime } from '@/lib/utils/formatTime';
import { triggerHaptic } from '@/lib/haptics';
import { COLORS } from '@/lib/theme';
import { usePickModeStore } from '@/lib/store/pickModeStore';

export default function ExecuteTrainingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: training, isLoading } = useTrainingDetail(id);
  const completeTraining = useCompleteTraining();
  const removeExercise = useRemoveExerciseFromTraining();
  const addExercise = useAddExerciseToTraining();
  const addPlayers = useAddPlayersToTraining();
  const insets = useSafeAreaInsets();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const handleAddExercises = () => {
    if (!training) return;
    const existingIds = training.exercises?.map((e) => e.documentId) ?? [];
    usePickModeStore.getState().startAdd(async (exerciseId) => {
      try {
        await addExercise.mutateAsync({ trainingId: id, exerciseId });
        toast.success('Übung hinzugefügt');
      } catch {
        toast.error('Übung konnte nicht hinzugefügt werden');
      }
    });
    router.push({
      pathname: '/exercise-picker',
      params: { excludeIds: existingIds.join(',') },
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

  const {
    sessionElapsed,
    exerciseStates,
    completedCount,
    toggleComplete,
    setMinutes,
  } = useTrainingExecution(training?.exercises || []);

  const confirmFinish = () => {
    const msg = 'Training beenden? Das Training wird abgeschlossen.';
    const proceed = () => {
      const completedExerciseIds = exerciseStates
        .filter((ex) => ex.completed)
        .map((ex) => ex.documentId);
      const pointsPerExercise = 10;
      const pointsEarned = completedExerciseIds.length * pointsPerExercise;
      const playerProgressData =
        training?.players?.map((player) => ({
          playerId: player.documentId,
          completedExerciseIds,
          pointsEarned,
        })) || [];
      completeTraining.mutate({
        trainingId: id,
        sessionDuration: sessionElapsed,
        playerProgressData,
      });
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(msg)) proceed();
      return;
    }
    Alert.alert('Training beenden', msg, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Beenden', style: 'destructive', onPress: proceed },
    ]);
  };

  if (isLoading || !training) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 py-3 border-b border-border flex-row justify-between items-center">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <Icon name="chevron-back" size={24} color="muted" />
        </Pressable>
        <View className="items-center flex-1">
          <Text variant="subhead" weight="semibold" numberOfLines={1}>
            {training.Name}
          </Text>
          <Text variant="title1" weight="bold" color="warning">
            {formatTime(sessionElapsed)}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            triggerHaptic('medium');
            confirmFinish();
          }}
          className="p-2 -mr-2"
          disabled={completeTraining.isPending}
        >
          {completeTraining.isPending ? (
            <ActivityIndicator color="#ef4444" />
          ) : (
            <Icon name="stop-circle" size={28} color="destructive" />
          )}
        </Pressable>
      </View>

      <View className="px-5 py-2 flex-row justify-between items-center">
        <Text variant="caption1" color="success" weight="bold">
          {completedCount}/{exerciseStates.length} Übungen abgehakt
        </Text>
        {(training.players?.length ?? 0) > 0 && (
          <View className="flex-row items-center">
            {training.players!.slice(0, 4).map((p, idx) => (
              <View
                key={p.documentId}
                className={idx > 0 ? '-ml-1.5' : ''}
                style={{ zIndex: 4 - idx }}
              >
                <Avatar
                  initials={(p.firstname?.[0] ?? '') + (p.Name?.[0] ?? '')}
                  size="sm"
                  className="border-2 border-background"
                />
              </View>
            ))}
            {(training.players!.length - 4) > 0 && (
              <View className="-ml-1.5 w-8 h-8 rounded-full bg-muted items-center justify-center border-2 border-background">
                <Text variant="caption2" weight="bold" color="foreground">
                  +{training.players!.length - 4}
                </Text>
              </View>
            )}
            <Text variant="caption1" color="muted" className="ml-2">
              {training.players!.length} Teilnehmer
            </Text>
          </View>
        )}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 80 }}>
        {exerciseStates.map((ex, idx) => {
          const expanded = expandedId === ex.documentId;
          return (
            <Card key={ex.documentId} className="mb-3">
              <View className="flex-row items-start gap-3">
                <Pressable
                  onPress={() => {
                    triggerHaptic('light');
                    toggleComplete(idx);
                  }}
                  hitSlop={8}
                  className="w-12 h-12 -ml-2 -mt-2 items-center justify-center"
                >
                  <View
                    className={`w-10 h-10 rounded-full border-2 items-center justify-center ${
                      ex.completed ? 'bg-success border-success' : 'border-muted'
                    }`}
                  >
                    {ex.completed && <Icon name="checkmark" size={22} color="inverse" />}
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setExpandedId(expanded ? null : ex.documentId)}
                  className="flex-1"
                >
                  <Text
                    variant="headline"
                    numberOfLines={2}
                    className={ex.completed ? 'line-through opacity-60' : ''}
                  >
                    {ex.Name}
                  </Text>
                </Pressable>

                <View className="flex-row items-center bg-surface-1 rounded-md px-2 py-1">
                  <TextInput
                    value={String(ex.editedMinutes)}
                    onChangeText={(t) => {
                      const n = parseInt(t, 10);
                      setMinutes(idx, Number.isFinite(n) ? n : 0);
                    }}
                    keyboardType="number-pad"
                    className="text-foreground text-right"
                    // Fixed width — on RN Web a TextInput otherwise expands to fill
                    // the remaining row space and swallows the name column.
                    style={{ padding: 0, width: 28 }}
                  />
                  <Text variant="caption1" color="muted" className="ml-1">
                    min
                  </Text>
                </View>

                <Pressable
                  onPress={() => confirmRemoveExercise(ex.documentId, ex.Name)}
                  disabled={removeExercise.isPending}
                  hitSlop={6}
                  className="w-8 h-8 rounded-full bg-destructive/10 items-center justify-center active:opacity-70 disabled:opacity-40"
                >
                  <Icon name="close" size={14} color="destructive" />
                </Pressable>
              </View>

              {expanded && (
                <View className="mt-3 pt-3 border-t border-border">
                  <View className="mb-3">
                    <ExercisePills exercise={ex} />
                  </View>
                  {ex.Description && (
                    <Text variant="footnote" color="muted" className="mb-3">
                      {ex.Description}
                    </Text>
                  )}
                  {(ex.Steps as any)?.length > 0 && (
                    <View className="mb-3">
                      <Text variant="subhead" weight="semibold" className="mb-2">
                        Anleitung
                      </Text>
                      {(ex.Steps as any).map((step: any, sidx: number) => {
                        const title = typeof step === 'string' ? step : step?.Name;
                        const body = typeof step === 'string' ? null : step?.Description;
                        return (
                          <View key={step?.id ?? sidx} className="flex-row gap-2 mb-2">
                            <Text variant="caption1" color="muted" weight="bold">
                              {sidx + 1}.
                            </Text>
                            <View className="flex-1">
                              <Text variant="footnote">{title}</Text>
                              {body && (
                                <Text variant="caption1" color="muted">
                                  {body}
                                </Text>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                  {ex.Hint && (
                    <View className="bg-warning/10 rounded-md p-3 flex-row gap-2">
                      <Icon name="bulb-outline" size={14} color="warning" />
                      <Text variant="caption1" className="flex-1">
                        {ex.Hint}
                      </Text>
                    </View>
                  )}
                  {(ex.Videos?.length ?? 0) > 0 && (
                    <View className="flex-row flex-wrap gap-2 mt-3">
                      {ex.Videos!.map((v, vidx) => (
                        <MediaThumbnail
                          key={vidx}
                          uri={v}
                          kind="video"
                          onPress={() =>
                            toast.info('Video-Wiedergabe bald verfügbar')
                          }
                        />
                      ))}
                    </View>
                  )}
                </View>
              )}
            </Card>
          );
        })}

        <View className="gap-2 mt-3">
          <Button
            variant="secondary"
            leftIcon="add"
            onPress={handleAddExercises}
          >
            Übung hinzufügen
          </Button>
          <Button
            variant="secondary"
            leftIcon="person-add-outline"
            onPress={handleAddPlayers}
          >
            Spieler hinzufügen
          </Button>
        </View>
      </ScrollView>

      <View
        style={{
          paddingTop: Math.max(12, insets.bottom),
          paddingBottom: Math.max(12, insets.bottom),
        }}
        className="px-5 border-t border-border"
      >
        <Button
          size="lg"
          variant="destructive"
          leftIcon="stop-circle"
          className="w-full"
          loading={completeTraining.isPending}
          onPress={() => {
            triggerHaptic('medium');
            confirmFinish();
          }}
        >
          Training beenden
        </Button>
      </View>

      <MediaViewer uri={viewerUri} onClose={() => setViewerUri(null)} />
    </SafeAreaView>
  );
}
