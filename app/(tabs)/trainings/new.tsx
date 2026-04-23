import { useRef, useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, Text, Button, toast } from '@/components/ui';
import {
  ExercisePickerSheet,
  ExercisePickerSheetRef,
} from '@/components/sheets/ExercisePickerSheet';
import {
  PlayerPickerSheet,
  PlayerPickerSheetRef,
} from '@/components/sheets/PlayerPickerSheet';
import { useCreateTraining } from '@/lib/queries/useTrainings';

export default function NewTrainingScreen() {
  const { preselect, returnTo } = useLocalSearchParams<{
    preselect?: string;
    returnTo?: string;
  }>();

  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [exerciseIds, setExerciseIds] = useState<string[]>(
    preselect ? [preselect] : []
  );
  const [playerIds, setPlayerIds] = useState<string[]>([]);
  const createTraining = useCreateTraining();
  const exerciseSheetRef = useRef<ExercisePickerSheetRef>(null);
  const playerSheetRef = useRef<PlayerPickerSheetRef>(null);

  const canCreate = name.trim() && exerciseIds.length > 0 && playerIds.length > 0;

  const handleCreate = () => {
    createTraining.mutate(
      { name, date, exerciseIds, playerIds },
      {
        onSuccess: (newTraining) => {
          toast.success('Training erstellt');
          if (returnTo === 'library') {
            router.replace('/library');
          } else {
            router.replace({
              pathname: '/trainings',
              params: { scrollToId: newTraining.documentId },
            });
          }
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
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 32,
          }}
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
            <View className="flex-row justify-between items-center mb-2">
              <Text variant="subhead" weight="semibold">
                Übungen ({exerciseIds.length})
              </Text>
              <Button
                variant="ghost"
                size="sm"
                leftIcon="search-outline"
                onPress={() => exerciseSheetRef.current?.present()}
              >
                Auswählen
              </Button>
            </View>
            <Text variant="footnote" color="muted">
              {exerciseIds.length === 0
                ? 'Noch keine Übungen gewählt'
                : `${exerciseIds.length} ausgewählt`}
            </Text>
          </View>

          <View className="mb-2">
            <View className="flex-row justify-between items-center mb-2">
              <Text variant="subhead" weight="semibold">
                Spieler ({playerIds.length})
              </Text>
              <Button
                variant="ghost"
                size="sm"
                leftIcon="search-outline"
                onPress={() => playerSheetRef.current?.present()}
              >
                Auswählen
              </Button>
            </View>
            <Text variant="footnote" color="muted">
              {playerIds.length === 0
                ? 'Noch keine Spieler gewählt'
                : `${playerIds.length} ausgewählt`}
            </Text>
          </View>
        </ScrollView>

        <View className="px-5 pt-3 pb-4 border-t border-border bg-background">
          <Button
            size="lg"
            className="w-full"
            loading={createTraining.isPending}
            disabled={!canCreate}
            onPress={handleCreate}
          >
            Training erstellen
          </Button>
        </View>
      </KeyboardAvoidingView>

      <ExercisePickerSheet
        ref={exerciseSheetRef}
        selectedIds={exerciseIds}
        onChange={setExerciseIds}
      />
      <PlayerPickerSheet
        ref={playerSheetRef}
        selectedIds={playerIds}
        onChange={setPlayerIds}
      />
    </Screen>
  );
}
