import { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTrainings } from '@/lib/queries/useTrainings';
import { cn } from '@/lib/utils/cn';
import type { Training } from '@/lib/types/models';

type FilterKey = 'upcoming' | 'completed';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'upcoming', label: 'Anstehend' },
  { key: 'completed', label: 'Abgeschlossen' },
];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const isSameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (isSameDay) return 'Heute';
  return d.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

export default function TrainingsScreen() {
  const { data: trainings, isLoading } = useTrainings();
  const [filter, setFilter] = useState<FilterKey>('upcoming');

  const filtered = useMemo(() => {
    if (!trainings) return [];
    if (filter === 'completed') {
      return trainings.filter((t) => t.training_status === 'completed');
    }
    return trainings.filter(
      (t) => t.training_status === 'draft' || t.training_status === 'in_progress'
    );
  }, [trainings, filter]);

  const renderTraining = ({ item }: { item: Training }) => {
    const isActive = item.training_status === 'in_progress';
    const isCompleted = item.training_status === 'completed';
    const borderColor = isActive
      ? 'border-l-warning'
      : isCompleted
      ? 'border-l-success'
      : 'border-l-primary';

    return (
      <Pressable
        onPress={() => router.push(`/trainings/${item.documentId}`)}
        className={cn(
          'bg-card rounded-2xl p-5 mb-4 border border-border border-l-4 active:opacity-70',
          borderColor
        )}
      >
        {isActive && (
          <View className="absolute top-4 right-4 bg-warning/20 px-3 py-1 rounded-lg">
            <Text className="text-xs font-bold uppercase text-warning">Läuft</Text>
          </View>
        )}

        <Text className="text-lg font-bold text-foreground mb-2 pr-20">
          {item.Name}
        </Text>

        <View className="self-start bg-primary/20 px-2.5 py-1 rounded-md mb-3">
          <Text className="text-xs font-semibold text-primary">Du bist Trainer</Text>
        </View>

        <View className="flex-row flex-wrap gap-3 mb-3">
          <Text className="text-sm text-muted-foreground">📅 {formatDate(item.Date)}</Text>
        </View>

        <View className="flex-row items-center gap-1.5 mb-4">
          <Text className="text-xs text-muted-foreground">
            👥 {item.players?.length || 0} Teilnehmer
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-muted-foreground">
            {item.exercises?.length || 0} Übungen
            {item.actualDuration ? ` • ${Math.round(item.actualDuration / 60)} Min` : ''}
          </Text>
          <View className="bg-primary rounded-lg px-5 py-2.5">
            <Text className="text-sm font-semibold text-primary-foreground">
              {isActive ? 'Fortsetzen' : isCompleted ? 'Ansehen' : 'Öffnen'}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pt-5 pb-4 border-b border-border">
        <Text className="text-2xl font-bold text-foreground mb-4">Training</Text>
        <Pressable
          onPress={() => router.push('/trainings/create')}
          className="bg-primary rounded-xl py-3.5 flex-row items-center justify-center gap-2 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-primary-foreground">
            + Neues Training erstellen
          </Text>
        </Pressable>
      </View>

      <View className="flex-row px-5 py-3.5 gap-2.5 border-b border-border bg-background">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              className={cn(
                'px-4 py-2.5 rounded-full border',
                active ? 'bg-primary/20 border-primary' : 'bg-card border-border'
              )}
            >
              <Text
                className={cn(
                  'text-sm font-medium',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderTraining}
          keyExtractor={(item) => item.documentId}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-muted-foreground text-center mb-2">
                {filter === 'completed'
                  ? 'Noch keine abgeschlossenen Trainings'
                  : 'Noch keine Trainings geplant'}
              </Text>
              <Text className="text-sm text-muted-foreground text-center">
                {filter === 'upcoming' ? 'Erstelle dein erstes Training!' : ''}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
