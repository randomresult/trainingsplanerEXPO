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
import { COLORS } from '@/lib/theme';

export default function LibraryListScreen() {
  const [search, setSearch] = useState('');
  const { data: exercises, isLoading } = useExercises(search);

  return (
    <Screen>
      <View className="px-5 pt-4 pb-4 flex-row justify-between items-center">
        <Text variant="largeTitle" weight="bold">Bibliothek</Text>
      </View>

      <View className="px-5 pb-2">
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
          <ActivityIndicator size="large" color={COLORS.primary} />
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
