import { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Screen, Text, Button, toast, ExerciseCard, Icon } from '@/components/ui';
import { usePickModeStore } from '@/lib/store/pickModeStore';
import { useCreateTraining } from '@/lib/queries/useTrainings';
import { useExercises } from '@/lib/queries/useExercises';
import { usePlayers } from '@/lib/queries/usePlayers';

export default function NewTrainingScreen() {
  const { preselect } = useLocalSearchParams<{ preselect?: string }>();

  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [exerciseIds, setExerciseIds] = useState<string[]>(
    preselect ? [preselect] : []
  );
  const [playerIds, setPlayerIds] = useState<string[]>([]);
  const createTraining = useCreateTraining();

  const { data: allExercises } = useExercises('');

  const selectedExercises = useMemo(() => {
    const byId = new Map((allExercises ?? []).map((ex: any) => [ex.documentId, ex]));
    return exerciseIds
      .map((id) => byId.get(id))
      .filter(Boolean) as any[];
  }, [allExercises, exerciseIds]);

  const removeExercise = (id: string) =>
    setExerciseIds((prev) => prev.filter((x) => x !== id));

  const { data: allPlayers } = usePlayers();

  const selectedPlayers = useMemo(() => {
    const byId = new Map((allPlayers ?? []).map((p: any) => [p.documentId, p]));
    return playerIds
      .map((id) => byId.get(id))
      .filter(Boolean) as any[];
  }, [allPlayers, playerIds]);

  const removePlayer = (id: string) =>
    setPlayerIds((prev) => prev.filter((x) => x !== id));

  const canCreate = name.trim() && exerciseIds.length > 0 && playerIds.length > 0;

  const handleOpenExercisePicker = () => {
    usePickModeStore.getState().startAdd((id) => {
      setExerciseIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    });
    router.push({
      pathname: '/exercise-picker',
      params: { excludeIds: exerciseIds.join(',') },
    });
  };

  const handleOpenPlayerPicker = () => {
    usePickModeStore.getState().start(playerIds, setPlayerIds);
    router.push('/player-picker');
  };

  const handleCreate = () => {
    createTraining.mutate(
      { name, date, exerciseIds, playerIds },
      {
        onSuccess: () => {
          // The modal closes and the caller (library-detail or trainings-index)
          // is restored — no cross-tab dance needed.
          router.back();
          toast.success('Training erstellt');
        },
        onError: () => toast.error('Training konnte nicht erstellt werden'),
      }
    );
  };

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
            <View className="flex-row justify-between items-center mb-2">
              <Text variant="subhead" weight="semibold">
                Übungen ({exerciseIds.length})
              </Text>
              <Button
                variant="ghost"
                size="sm"
                leftIcon="search-outline"
                onPress={handleOpenExercisePicker}
              >
                Auswählen
              </Button>
            </View>

            {exerciseIds.length === 0 && (
              <Text variant="footnote" color="muted">Noch keine Übungen gewählt</Text>
            )}

            {selectedExercises.map((ex) => (
              <ExerciseCard
                key={ex.documentId}
                exercise={ex}
                compact
                className="mb-1.5"
                trailing={
                  <Pressable
                    onPress={() => removeExercise(ex.documentId)}
                    hitSlop={6}
                    className="w-7 h-7 rounded-full bg-destructive/10 items-center justify-center"
                  >
                    <Icon name="close" size={14} color="destructive" />
                  </Pressable>
                }
              />
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
              <Text variant="footnote" color="muted">Noch keine Spieler gewählt</Text>
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
                    hitSlop={6}
                    className="w-6 h-6 items-center justify-center"
                  >
                    <Icon name="close" size={14} color="muted" />
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
