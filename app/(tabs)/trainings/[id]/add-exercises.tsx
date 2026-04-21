import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  useTrainingDetail,
  useAddExerciseToTraining,
} from '@/lib/queries/useTrainings';
import { useExercises } from '@/lib/queries/useExercises';

export default function AddExercisesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [search, setSearch] = useState('');

  const { data: training } = useTrainingDetail(id);
  const { data: allExercises, isLoading } = useExercises(search);
  const addExercise = useAddExerciseToTraining();

  const alreadyAddedIds = useMemo(
    () => new Set(training?.exercises?.map((e) => e.documentId) ?? []),
    [training]
  );

  const available = useMemo(
    () => (allExercises ?? []).filter((e: any) => !alreadyAddedIds.has(e.documentId)),
    [allExercises, alreadyAddedIds]
  );

  const handleAdd = async (exerciseId: string) => {
    await addExercise.mutateAsync({ trainingId: id, exerciseId });
  };

  return (
    <View className="flex-1 bg-background">
      <View className="p-5 pb-3 border-b border-border">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Übung suchen..."
          placeholderTextColor="#666"
          className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : (
        <FlatList
          data={available}
          keyExtractor={(item: any) => item.documentId}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-muted-foreground text-center">
                {search
                  ? 'Keine passenden Übungen gefunden'
                  : 'Alle Übungen sind bereits im Training'}
              </Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => (
            <View className="bg-card rounded-xl p-4 border border-border flex-row items-center">
              <View className="flex-1 mr-3">
                <Text className="text-sm font-semibold text-foreground mb-1">
                  {item.Name}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {item.Minutes} Min
                  {item.Difficulty ? ` • ${item.Difficulty}` : ''}
                </Text>
              </View>
              <Pressable
                onPress={() => handleAdd(item.documentId)}
                disabled={addExercise.isPending}
                className="bg-primary rounded-lg px-4 py-2.5 active:opacity-80 disabled:opacity-50"
              >
                <Text className="text-sm font-semibold text-primary-foreground">
                  Hinzufügen
                </Text>
              </Pressable>
            </View>
          )}
        />
      )}

      <View className="p-5 border-t border-border">
        <Pressable
          onPress={() => router.back()}
          className="bg-card border border-border rounded-xl p-4 active:opacity-70"
        >
          <Text className="text-center text-sm font-semibold text-foreground">
            Fertig
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
