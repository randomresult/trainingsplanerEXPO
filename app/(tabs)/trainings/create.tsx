import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { useCreateTraining } from '@/lib/queries/useTrainings';
import { ExerciseSelector } from '@/components/ExerciseSelector';
import { PlayerSelector } from '@/components/PlayerSelector';

export default function CreateTrainingScreen() {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  const createTraining = useCreateTraining();

  const handleCreate = () => {
    createTraining.mutate({
      name,
      date,
      exerciseIds: selectedExerciseIds,
      playerIds: selectedPlayerIds,
    });
  };

  const canCreate = name.trim() && selectedExerciseIds.length > 0 && selectedPlayerIds.length > 0;

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-5">
        {/* Name */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">
            Trainingsname *
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="z.B. Jugendtraining"
            placeholderTextColor="#666"
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>

        {/* Date */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">
            Datum *
          </Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#666"
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
          <Text className="text-xs text-muted-foreground mt-1">
            Format: JJJJ-MM-TT (z.B. 2026-04-20)
          </Text>
        </View>

        {/* Exercise Selector */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">
            Übungen * ({selectedExerciseIds.length} ausgewählt)
          </Text>
          <ExerciseSelector
            selectedIds={selectedExerciseIds}
            onSelectionChange={setSelectedExerciseIds}
          />
        </View>

        {/* Player Selector */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-2">
            Spieler * ({selectedPlayerIds.length} ausgewählt)
          </Text>
          <PlayerSelector
            selectedIds={selectedPlayerIds}
            onSelectionChange={setSelectedPlayerIds}
          />
        </View>

        {/* Create Button */}
        <Pressable
          onPress={handleCreate}
          disabled={!canCreate || createTraining.isPending}
          className="bg-primary rounded-xl p-4 disabled:opacity-50"
        >
          {createTraining.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-sm font-semibold text-primary-foreground">
              Training erstellen
            </Text>
          )}
        </Pressable>

        {createTraining.isError && (
          <View className="mt-4 bg-destructive/10 border border-destructive rounded-lg p-3">
            <Text className="text-destructive text-sm text-center">
              Fehler beim Erstellen. Bitte versuche es erneut.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
