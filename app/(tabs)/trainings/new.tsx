import { useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Screen, Text, Button, toast } from '@/components/ui';
import { ExerciseSelector } from '@/components/ExerciseSelector';
import { PlayerSelector } from '@/components/PlayerSelector';
import { useCreateTraining } from '@/lib/queries/useTrainings';

export default function NewTrainingScreen() {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [exerciseIds, setExerciseIds] = useState<string[]>([]);
  const [playerIds, setPlayerIds] = useState<string[]>([]);
  const createTraining = useCreateTraining();

  const canCreate = name.trim() && exerciseIds.length > 0 && playerIds.length > 0;

  const handleCreate = () => {
    createTraining.mutate(
      { name, date, exerciseIds, playerIds },
      {
        onSuccess: (newTraining) => {
          toast.success('Training erstellt');
          router.replace({
            pathname: '/trainings',
            params: { scrollToId: newTraining.documentId },
          });
        },
        onError: () => toast.error('Training konnte nicht erstellt werden'),
      }
    );
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-5">
            <Text variant="subhead" weight="semibold" className="mb-2">Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="z.B. Jugendtraining"
              placeholderTextColor="#666"
              className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </View>

          <View className="mb-5">
            <Text variant="subhead" weight="semibold" className="mb-2">Datum</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
              className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </View>

          <View className="mb-5">
            <Text variant="subhead" weight="semibold" className="mb-2">
              Übungen ({exerciseIds.length})
            </Text>
            <ExerciseSelector
              selectedIds={exerciseIds}
              onSelectionChange={setExerciseIds}
            />
          </View>

          <View className="mb-2">
            <Text variant="subhead" weight="semibold" className="mb-2">
              Spieler ({playerIds.length})
            </Text>
            <PlayerSelector
              selectedIds={playerIds}
              onSelectionChange={setPlayerIds}
            />
          </View>
        </ScrollView>

        <View className="px-5 pt-3 pb-4 border-t border-border bg-background">
          <Button
            size="lg"
            loading={createTraining.isPending}
            disabled={!canCreate}
            onPress={handleCreate}
          >
            Training erstellen
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
