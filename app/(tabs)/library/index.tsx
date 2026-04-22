import { useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Screen, Text, ExerciseCard, Icon } from '@/components/ui';
import { useExercises } from '@/lib/queries/useExercises';

export default function LibraryListScreen() {
  const [search, setSearch] = useState('');
  const { data: exercises, isLoading } = useExercises(search);

  return (
    <Screen>
      <View className="px-5 pt-3 pb-2">
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
        <Pressable onPress={Keyboard.dismiss} className="flex-1">
          <FlatList
            data={exercises ?? []}
            keyExtractor={(item: any) => item.documentId}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Icon name="search-outline" size={40} color="muted" />
                <Text variant="footnote" color="muted" className="mt-3">
                  {search ? 'Keine Übungen gefunden' : 'Keine Übungen vorhanden'}
                </Text>
              </View>
            }
            renderItem={({ item }: { item: any }) => (
              <ExerciseCard
                exercise={item}
                onPress={() => router.push(`/library/${item.documentId}`)}
              />
            )}
          />
        </Pressable>
      )}
    </Screen>
  );
}
