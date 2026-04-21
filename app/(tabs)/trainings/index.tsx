import { useMemo, useState } from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Screen, Text, Button, Chip, Card, Badge, Icon } from '@/components/ui';
import { useTrainings } from '@/lib/queries/useTrainings';
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

    return (
      <Card
        accent="left"
        accentColor={isActive ? 'warning' : isCompleted ? 'success' : 'primary'}
        onPress={() => router.push(`/trainings/${item.documentId}`)}
        className="mb-4"
      >
        {isActive && (
          <View className="absolute top-4 right-4">
            <Badge variant="warning-soft">Läuft</Badge>
          </View>
        )}
        <Text variant="headline" className="mb-2 pr-20">{item.Name}</Text>
        <Badge variant="primary-soft" className="mb-3">Du bist Trainer</Badge>

        <View className="flex-row items-center gap-1.5 mb-2">
          <Icon name="calendar-outline" size={14} color="muted" />
          <Text variant="footnote" color="muted">{formatDate(item.Date)}</Text>
        </View>

        <View className="flex-row items-center gap-1.5 mb-4">
          <Icon name="people-outline" size={14} color="muted" />
          <Text variant="caption1" color="muted">
            {item.players?.length || 0} Teilnehmer
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <Text variant="footnote" color="muted">
            {item.exercises?.length || 0} Übungen
            {item.actualDuration ? ` • ${Math.round(item.actualDuration / 60)} Min` : ''}
          </Text>
          <View className="bg-primary rounded-lg px-4 py-2">
            <Text variant="subhead" weight="semibold" color="inverse">
              {isActive ? 'Fortsetzen' : isCompleted ? 'Ansehen' : 'Öffnen'}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <Screen>
      <View className="px-5 pt-5 pb-4 border-b border-border">
        <Text variant="largeTitle" weight="bold" className="mb-4">Training</Text>
        <Button leftIcon="add" size="md" onPress={() => router.push('/trainings/create')}>
          Neues Training erstellen
        </Button>
      </View>

      <View className="flex-row px-5 py-3.5 gap-2.5 border-b border-border bg-background">
        {FILTERS.map((f) => (
          <Chip
            key={f.key}
            active={filter === f.key}
            onPress={() => setFilter(f.key)}
          >
            {f.label}
          </Chip>
        ))}
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
            <View className="items-center justify-center py-12 gap-3">
              <Icon name="calendar-outline" size={40} color="muted" />
              <Text variant="body" color="muted" className="text-center">
                {filter === 'completed'
                  ? 'Noch keine abgeschlossenen Trainings'
                  : 'Noch keine Trainings geplant'}
              </Text>
              {filter === 'upcoming' && (
                <Text variant="footnote" color="muted" className="text-center">
                  Erstelle dein erstes Training!
                </Text>
              )}
            </View>
          }
        />
      )}
    </Screen>
  );
}
