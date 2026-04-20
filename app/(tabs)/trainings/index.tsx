import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTrainings } from '@/lib/queries/useTrainings';
import { cn } from '@/lib/utils/cn';
import type { Training } from '@/lib/types/models';

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

export default function TrainingsScreen() {
  const { data: trainings, isLoading } = useTrainings();

  const renderTraining = ({ item }: { item: Training }) => (
    <Pressable
      onPress={() => router.push(`/trainings/${item.documentId}`)}
      className="bg-card rounded-xl p-4 mb-3 border border-border active:opacity-70"
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-base font-semibold text-foreground flex-1 mr-2">
          {item.Name}
        </Text>
        <View className={cn('px-2 py-1 rounded border', STATUS_COLORS[item.training_status])}>
          <Text className="text-xs font-semibold">
            {STATUS_LABELS[item.training_status]}
          </Text>
        </View>
      </View>

      <Text className="text-sm text-muted-foreground mb-3">
        {new Date(item.Date).toLocaleDateString('de-DE', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </Text>

      <View className="flex-row items-center gap-4">
        <View className="flex-row items-center">
          <Text className="text-xs text-muted-foreground">
            🏓 {item.exercises?.length || 0} Übungen
          </Text>
        </View>

        <View className="flex-row items-center">
          <Text className="text-xs text-muted-foreground">
            👥 {item.players?.length || 0} Spieler
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-background">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6c47ff" />
        </View>
      ) : (
        <FlatList
          data={trainings}
          renderItem={renderTraining}
          keyExtractor={(item) => item.documentId}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-muted-foreground text-center mb-2">
                Noch keine Trainings erstellt
              </Text>
              <Text className="text-sm text-muted-foreground text-center">
                Erstelle dein erstes Training!
              </Text>
            </View>
          }
        />
      )}

      {/* Create Button */}
      <View className="absolute bottom-0 left-0 right-0 p-5 bg-background border-t border-border">
        <Pressable
          onPress={() => router.push('/trainings/create')}
          className="bg-primary rounded-xl p-4 active:opacity-80"
        >
          <Text className="text-center text-sm font-semibold text-primary-foreground">
            + Training erstellen
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
