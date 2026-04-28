import { useState, useMemo, useEffect } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import {
  Screen,
  Text,
  Button,
  Card,
  toast,
  Icon,
  MethodicalSeriesBlock,
} from '@/components/ui';
import { useDraftPickStore } from '@/lib/store/draftPickStore';
import { useCreateTraining } from '@/lib/queries/useTrainings';
import { useExercises } from '@/lib/queries/useExercises';
import { useMethodicalSeries } from '@/lib/queries/useMethodicalSeries';
import { usePlayers } from '@/lib/queries/usePlayers';
import { usePickModeStore } from '@/lib/store/pickModeStore';

export default function NewTrainingScreen() {
  const params = useLocalSearchParams<{
    preselect?: string;
    preselectSeries?: string;
    seriesName?: string;
    exerciseIds?: string;
  }>();

  const initialExerciseIds = useMemo(() => {
    const ids: string[] = [];
    if (params.preselect) ids.push(params.preselect);
    if (params.exerciseIds) {
      params.exerciseIds.split(',').filter(Boolean).forEach((id) => {
        if (!ids.includes(id)) ids.push(id);
      });
    }
    return ids;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- URL params are read once at mount

  const initialSeriesIds = useMemo(() => {
    return params.preselectSeries ? [params.preselectSeries] : [];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [exerciseIds, setExerciseIds] = useState<string[]>(initialExerciseIds);
  const [seriesIds, setSeriesIds] = useState<string[]>(initialSeriesIds);
  const [playerIds, setPlayerIds] = useState<string[]>([]);
  const createTraining = useCreateTraining();

  const { data: allExercises } = useExercises('');
  const { data: allSeries } = useMethodicalSeries();
  const { data: allPlayers } = usePlayers();

  // Cleanup the draft pick store when the screen unmounts (e.g., user submits or aborts).
  useEffect(() => {
    return () => useDraftPickStore.getState().cancel();
  }, []);

  const exercisesById = useMemo(
    () => new Map((allExercises ?? []).map((ex: any) => [ex.documentId, ex])),
    [allExercises],
  );
  const seriesById = useMemo(
    () => new Map((allSeries ?? []).map((s: any) => [s.documentId, s])),
    [allSeries],
  );

  const selectedSeries = useMemo(
    () => seriesIds.map((id) => seriesById.get(id)).filter(Boolean) as any[],
    [seriesById, seriesIds],
  );

  const selectedExercises = useMemo(
    () => exerciseIds.map((id) => exercisesById.get(id)).filter(Boolean) as any[],
    [exercisesById, exerciseIds],
  );

  const seriesIdSet = useMemo(() => new Set(seriesIds), [seriesIds]);

  const exercisesBySeries = useMemo(() => {
    const map = new Map<string, any[]>();
    selectedExercises.forEach((ex) => {
      const seriesRef = ex.methodicalSeries?.find((s: any) => seriesIdSet.has(s.documentId));
      if (seriesRef) {
        const list = map.get(seriesRef.documentId) ?? [];
        list.push(ex);
        map.set(seriesRef.documentId, list);
      }
    });
    return map;
  }, [selectedExercises, seriesIdSet]);

  const standaloneExercises = useMemo(
    () => selectedExercises.filter(
      (ex) => !ex.methodicalSeries?.some((s: any) => seriesIdSet.has(s.documentId)),
    ),
    [selectedExercises, seriesIdSet],
  );

  const removeSeries = (seriesDocumentId: string) => {
    const seriesExercises = exercisesBySeries.get(seriesDocumentId) ?? [];
    const seriesExerciseIds = new Set(seriesExercises.map((ex) => ex.documentId));
    setSeriesIds((prev) => prev.filter((id) => id !== seriesDocumentId));
    setExerciseIds((prev) => prev.filter((id) => !seriesExerciseIds.has(id)));
  };

  const removeExercise = (exerciseDocumentId: string) =>
    setExerciseIds((prev) => prev.filter((x) => x !== exerciseDocumentId));

  const confirmRemoveStandalone = (exerciseId: string, exerciseName: string) => {
    const msg = `"${exerciseName}" entfernen?`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(msg)) removeExercise(exerciseId);
      return;
    }
    Alert.alert('Übung entfernen', msg, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Entfernen', style: 'destructive', onPress: () => removeExercise(exerciseId) },
    ]);
  };

  const selectedPlayers = useMemo(() => {
    const byId = new Map((allPlayers ?? []).map((p: any) => [p.documentId, p]));
    return playerIds.map((id) => byId.get(id)).filter(Boolean) as any[];
  }, [allPlayers, playerIds]);

  const removePlayer = (id: string) =>
    setPlayerIds((prev) => prev.filter((x) => x !== id));

  const canCreate = name.trim().length > 0 && exerciseIds.length > 0;

  const handleOpenPicker = () => {
    useDraftPickStore.getState().startDraftPick({
      initialExerciseIds: exerciseIds,
      initialSeriesIds: seriesIds,
      onAddExercise: (id) =>
        setExerciseIds((prev) => (prev.includes(id) ? prev : [...prev, id])),
      onAddSeries: (sid, exIds) => {
        setSeriesIds((prev) => (prev.includes(sid) ? prev : [...prev, sid]));
        setExerciseIds((prev) => {
          const next = [...prev];
          exIds.forEach((id) => {
            if (!next.includes(id)) next.push(id);
          });
          return next;
        });
      },
    });
    router.push('/library-pick-draft');
  };

  const handleOpenPlayerPicker = () => {
    usePickModeStore.getState().start(playerIds, setPlayerIds);
    router.push('/player-picker');
  };

  const handleCreate = () => {
    createTraining.mutate(
      { name, date, exerciseIds, methodicalSeriesIds: seriesIds, playerIds },
      {
        onSuccess: (newTraining) => {
          router.dismissAll();
          router.push(`/trainings?scrollToId=${encodeURIComponent(newTraining.documentId)}`);
          toast.success('Training erstellt');
        },
        onError: () => toast.error('Training konnte nicht erstellt werden'),
      }
    );
  };

  const totalContentCount = exerciseIds.length;

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Training erstellen',
          headerBackTitle: 'Abbrechen',
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-5">
            <Text variant="subhead" weight="semibold" className="mb-2">Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="z.B. Jugendtraining"
              placeholderTextColor="#666"
              className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </View>

          <View className="mb-5">
            <Text variant="subhead" weight="semibold" className="mb-2">Datum</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
              className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </View>

          <View className="mb-5">
            <View className="flex-row justify-between items-center mb-3">
              <Text variant="subhead" weight="semibold">
                Übungen ({totalContentCount})
              </Text>
              <Button
                variant="ghost"
                size="sm"
                leftIcon="search-outline"
                onPress={handleOpenPicker}
              >
                Auswählen
              </Button>
            </View>

            {totalContentCount === 0 && (
              <Text variant="footnote" color="muted">Noch keine Übungen gewählt</Text>
            )}

            {selectedSeries.map((s) => {
              const blockExercises = exercisesBySeries.get(s.documentId) ?? [];
              return (
                <MethodicalSeriesBlock
                  key={s.documentId}
                  series={s}
                  blockExercises={blockExercises}
                  totalInSeries={blockExercises.length}
                  mode="edit"
                  onNavigateToDetail={() => router.push({ pathname: '/series-detail/[id]', params: { id: s.documentId } })}
                  onNavigateToExercise={(exId) => router.push({ pathname: '/exercise-detail/[id]', params: { id: exId, readOnly: '1' } })}
                  onRemoveSeries={() => removeSeries(s.documentId)}
                  onRemoveExercise={(exerciseId) => removeExercise(exerciseId)}
                />
              );
            })}

            {standaloneExercises.map((exercise) => (
              <Card key={exercise.documentId} className="mb-3 flex-row items-center">
                <Pressable
                  onPress={() => router.push({ pathname: '/exercise-detail/[id]', params: { id: exercise.documentId, readOnly: '1' } })}
                  className="flex-1 flex-row justify-between items-start"
                >
                  <Text variant="subhead" weight="semibold" className="flex-1 mr-2">
                    {exercise.Name}
                  </Text>
                  <Text variant="caption1" color="muted">{exercise.Minutes} Min</Text>
                </Pressable>
                <Pressable
                  onPress={() => confirmRemoveStandalone(exercise.documentId, exercise.Name)}
                  hitSlop={8}
                  className="ml-3 w-11 h-11 rounded-full bg-destructive/10 items-center justify-center active:opacity-70"
                >
                  <Icon name="close" size={20} color="destructive" />
                </Pressable>
              </Card>
            ))}
          </View>

          <View className="mb-2">
            <View className="flex-row justify-between items-center mb-2">
              <Text variant="subhead" weight="semibold">
                Spieler ({playerIds.length})
              </Text>
              <Button
                variant="ghost"
                size="sm"
                leftIcon="search-outline"
                onPress={handleOpenPlayerPicker}
              >
                Auswählen
              </Button>
            </View>

            {playerIds.length === 0 && (
              <Text variant="footnote" color="muted">Noch keine Spieler gewählt (optional)</Text>
            )}

            {selectedPlayers.map((p) => {
              const label = [p.firstname, p.Name].filter(Boolean).join(' ') || 'Spieler';
              return (
                <View
                  key={p.documentId}
                  className="flex-row items-center py-2 border-b border-border"
                >
                  <Text variant="footnote" className="flex-1" numberOfLines={1}>
                    {label}
                  </Text>
                  <Pressable
                    onPress={() => removePlayer(p.documentId)}
                    hitSlop={8}
                    className="w-10 h-10 items-center justify-center"
                  >
                    <Icon name="close" size={20} color="muted" />
                  </Pressable>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View className="px-5 pt-3 pb-4 border-t border-border bg-background">
          <Button
            size="lg"
            className="w-full"
            loading={createTraining.isPending}
            disabled={!canCreate}
            onPress={handleCreate}
          >
            Training erstellen
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
