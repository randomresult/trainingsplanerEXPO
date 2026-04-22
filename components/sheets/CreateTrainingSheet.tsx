import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, TextInput } from 'react-native';
import {
  BottomSheet,
  BottomSheetRef,
  Button,
  Text,
  toast,
} from '@/components/ui';
import { ExerciseSelector } from '@/components/ExerciseSelector';
import { PlayerSelector } from '@/components/PlayerSelector';
import { useCreateTraining } from '@/lib/queries/useTrainings';

export interface CreateTrainingSheetRef {
  present: () => void;
}

export const CreateTrainingSheet = forwardRef<CreateTrainingSheetRef>(
  function CreateTrainingSheet(_, ref) {
    const sheetRef = useRef<BottomSheetRef>(null);
    const [name, setName] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [exerciseIds, setExerciseIds] = useState<string[]>([]);
    const [playerIds, setPlayerIds] = useState<string[]>([]);
    const createTraining = useCreateTraining();

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
    }));

    const reset = () => {
      setName('');
      setDate(new Date().toISOString().split('T')[0]);
      setExerciseIds([]);
      setPlayerIds([]);
    };

    const handleCreate = () => {
      createTraining.mutate(
        { name, date, exerciseIds, playerIds },
        {
          onSuccess: () => {
            toast.success('Training erstellt');
            sheetRef.current?.dismiss();
            reset();
          },
          onError: () => toast.error('Training konnte nicht erstellt werden'),
        }
      );
    };

    const canCreate = name.trim() && exerciseIds.length > 0 && playerIds.length > 0;

    return (
      <BottomSheet ref={sheetRef} snapPoints={['90%']} title="Training erstellen">
        <View className="flex-1">
          <View className="mb-4">
            <Text variant="subhead" weight="semibold" className="mb-2">Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="z.B. Jugendtraining"
              placeholderTextColor="#666"
              className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </View>

          <View className="mb-4">
            <Text variant="subhead" weight="semibold" className="mb-2">Datum</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
              className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </View>

          <View className="mb-4">
            <Text variant="subhead" weight="semibold" className="mb-2">
              Übungen ({exerciseIds.length})
            </Text>
            <ExerciseSelector
              selectedIds={exerciseIds}
              onSelectionChange={setExerciseIds}
            />
          </View>

          <View className="mb-6">
            <Text variant="subhead" weight="semibold" className="mb-2">
              Spieler ({playerIds.length})
            </Text>
            <PlayerSelector
              selectedIds={playerIds}
              onSelectionChange={setPlayerIds}
            />
          </View>

          <Button
            size="lg"
            loading={createTraining.isPending}
            disabled={!canCreate}
            onPress={handleCreate}
            className="mb-8"
          >
            Training erstellen
          </Button>
        </View>
      </BottomSheet>
    );
  }
);
