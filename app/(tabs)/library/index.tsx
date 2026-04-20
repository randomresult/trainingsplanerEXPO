import { useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useExercises } from '@/lib/queries/useExercises';

export default function LibraryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: exercises, isLoading } = useExercises(searchQuery);

  const renderExercise = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => router.push(`/library/${item.documentId}`)}
      className="bg-card rounded-xl p-4 mb-3 border border-border active:opacity-70"
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-base font-semibold text-foreground flex-1 mr-2">
          {item.Name}
        </Text>
        {item.Difficulty && (
          <View className="bg-primary/10 px-2 py-1 rounded">
            <Text className="text-xs font-semibold text-primary">
              {item.Difficulty}
            </Text>
          </View>
        )}
      </View>

      <Text className="text-sm text-muted-foreground mb-3" numberOfLines={2}>
        {item.Description}
      </Text>

      <View className="flex-row items-center gap-4">
        <View className="flex-row items-center">
          <Text className="text-xs text-muted-foreground">⏱ {item.Minutes} Min</Text>
        </View>

        {item.focus && item.focus.length > 0 && (
          <View className="flex-row items-center">
            <Text className="text-xs text-muted-foreground">
              🎯 {item.focus.length} Fokus
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-background">
      <View className="p-5 pb-3">
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Übungen durchsuchen..."
          placeholderTextColor="#666"
          className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
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
          contentContainerStyle={{ padding: 20, paddingTop: 8 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-muted-foreground text-center">
                Keine Übungen gefunden
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
