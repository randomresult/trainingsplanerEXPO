import { useState } from 'react';
import { View, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Screen, Text, Card, Icon } from '@/components/ui';
import { useExercises } from '@/lib/queries/useExercises';

export default function LibraryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: exercises, isLoading } = useExercises(searchQuery);

  const renderExercise = ({ item }: { item: any }) => (
    <Card onPress={() => router.push(`/library/${item.documentId}`)} className="mb-3">
      <Text variant="headline" className="mb-1" numberOfLines={1}>
        {item.Name}
      </Text>
      <Text variant="footnote" color="muted" numberOfLines={2} className="mb-2">
        {item.Description}
      </Text>
      <View className="flex-row items-center gap-4">
        <View className="flex-row items-center gap-1">
          <Icon name="time-outline" size={14} color="muted" />
          <Text variant="caption1" color="muted">{item.Minutes} Min</Text>
        </View>
        {item.Difficulty && (
          <View className="flex-row items-center gap-1">
            <Icon name="trending-up-outline" size={14} color="muted" />
            <Text variant="caption1" color="muted">{item.Difficulty}</Text>
          </View>
        )}
      </View>
    </Card>
  );

  return (
    <Screen>
      <View className="px-5 pt-4 pb-2">
        <Text variant="largeTitle" weight="bold" className="mb-2 mt-2">Bibliothek</Text>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Übungen durchsuchen..."
          placeholderTextColor="#666"
          className="bg-card border border-border rounded-lg px-4 py-3 text-foreground mb-4"
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6c47ff" />
        </View>
      ) : (
        <FlatList
          data={exercises}
          renderItem={renderExercise}
          keyExtractor={(item) => item.documentId}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-12 gap-3">
              <Icon name="search-outline" size={40} color="muted" />
              <Text variant="footnote" color="muted">Keine Übungen gefunden</Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}
