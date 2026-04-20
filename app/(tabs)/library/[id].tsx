import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useExerciseDetail } from '@/lib/queries/useExercises';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: exercise, isLoading } = useExerciseDetail(id);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6c47ff" />
      </View>
    );
  }

  if (!exercise) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-5">
        <Text className="text-muted-foreground text-center">Übung nicht gefunden</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-semibold">Zurück</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Title */}
      <View className="p-5 pb-3">
        <Text className="text-2xl font-bold text-foreground mb-3">
          {exercise.Name}
        </Text>

        {/* Meta Tags */}
        <View className="flex-row flex-wrap gap-2">
          {exercise.Difficulty && (
            <View className="bg-primary/10 px-3 py-1.5 rounded-lg">
              <Text className="text-xs font-semibold text-primary">
                {exercise.Difficulty}
              </Text>
            </View>
          )}

          {exercise.focus?.map((f) => (
            <View key={f.documentId} className="bg-muted px-3 py-1.5 rounded-lg">
              <Text className="text-xs font-semibold text-muted-foreground">
                {f.Name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Info Grid */}
      <View className="flex-row gap-3 px-5 pb-4">
        <View className="flex-1 bg-card rounded-xl p-4 border border-border">
          <Text className="text-xs text-muted-foreground mb-1">Dauer</Text>
          <Text className="text-xl font-bold text-foreground">
            {exercise.Minutes} Min
          </Text>
        </View>

        <View className="flex-1 bg-card rounded-xl p-4 border border-border">
          <Text className="text-xs text-muted-foreground mb-1">Fokuspunkte</Text>
          <Text className="text-xl font-bold text-foreground">
            {exercise.focus?.length || 0}
          </Text>
        </View>
      </View>

      {/* Video Placeholder */}
      {exercise.Videos && exercise.Videos.length > 0 && (
        <View className="mx-5 mb-4 bg-muted rounded-xl h-48 items-center justify-center">
          <Text className="text-muted-foreground text-sm">📹 Video Player</Text>
          <Text className="text-muted-foreground text-xs mt-1">
            (Implementierung in SP2)
          </Text>
        </View>
      )}

      {/* Description */}
      <View className="px-5 pb-4">
        <Text className="text-base font-semibold text-foreground mb-2">
          Beschreibung
        </Text>
        <Text className="text-sm text-muted-foreground leading-relaxed">
          {exercise.Description}
        </Text>
      </View>

      {/* Steps */}
      {exercise.Steps && exercise.Steps.length > 0 && (
        <View className="px-5 pb-4">
          <Text className="text-base font-semibold text-foreground mb-3">
            📋 Anleitung
          </Text>
          <View className="bg-card rounded-xl border-l-4 border-primary p-4">
            {exercise.Steps.map((step: any, idx: number) => {
              const title = typeof step === 'string' ? step : step?.Name;
              const body = typeof step === 'string' ? null : step?.Description;
              return (
                <View key={step?.id ?? idx} className="flex-row mb-3 last:mb-0">
                  <View className="w-6 h-6 rounded-full bg-primary items-center justify-center mr-3 mt-0.5">
                    <Text className="text-xs font-bold text-primary-foreground">
                      {idx + 1}
                    </Text>
                  </View>
                  <View className="flex-1">
                    {title ? (
                      <Text className="text-sm font-semibold text-foreground leading-relaxed">
                        {title}
                      </Text>
                    ) : null}
                    {body ? (
                      <Text className="text-sm text-muted-foreground leading-relaxed mt-0.5">
                        {body}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Trainer Hint */}
      {exercise.Hint && (
        <View className="px-5 pb-6">
          <Text className="text-base font-semibold text-foreground mb-3">
            💡 Trainer-Hinweis
          </Text>
          <View className="bg-warning/10 border border-warning rounded-xl p-4">
            <Text className="text-sm text-foreground leading-relaxed">
              {exercise.Hint}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
