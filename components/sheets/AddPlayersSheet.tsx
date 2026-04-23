import { forwardRef, useImperativeHandle, useRef, useState, useMemo } from 'react';
import { View, TextInput, FlatList } from 'react-native';
import {
  BottomSheet,
  BottomSheetRef,
  Button,
  PlayerCard,
  Text,
  toast,
} from '@/components/ui';
import {
  useTrainingDetail,
  useAddPlayerToTraining,
} from '@/lib/queries/useTrainings';
import { usePlayers } from '@/lib/queries/usePlayers';

export interface AddPlayersSheetRef {
  present: () => void;
}

interface Props {
  trainingId: string;
}

export const AddPlayersSheet = forwardRef<AddPlayersSheetRef, Props>(
  function AddPlayersSheet({ trainingId }, ref) {
    const sheetRef = useRef<BottomSheetRef>(null);
    const [search, setSearch] = useState('');
    const [addingId, setAddingId] = useState<string | null>(null);
    const { data: training } = useTrainingDetail(trainingId);
    const { data: allPlayers } = usePlayers();
    const addPlayer = useAddPlayerToTraining();

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
    }));

    const alreadyAddedIds = useMemo(
      () => new Set(training?.players?.map((p) => p.documentId) ?? []),
      [training]
    );

    const available = useMemo(() => {
      const base = (allPlayers ?? []).filter((p: any) => !alreadyAddedIds.has(p.documentId));
      if (!search.trim()) return base;
      const q = search.toLowerCase();
      return base.filter(
        (p: any) =>
          (p.firstname ?? '').toLowerCase().includes(q) ||
          (p.Name ?? '').toLowerCase().includes(q)
      );
    }, [allPlayers, alreadyAddedIds, search]);

    const handleAdd = async (playerId: string) => {
      setAddingId(playerId);
      try {
        await addPlayer.mutateAsync({ trainingId, playerId });
        toast.success('Spieler hinzugefügt');
      } catch {
        toast.error('Spieler konnte nicht hinzugefügt werden');
      } finally {
        setAddingId(null);
      }
    };

    return (
      <BottomSheet ref={sheetRef} snapPoints={['90%']} title="Spieler hinzufügen">
        <View className="flex-1">
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Suchen..."
            placeholderTextColor="#666"
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground mb-4"
          />
          <FlatList
            data={available}
            keyExtractor={(item: any) => item.documentId}
            contentContainerStyle={{ paddingBottom: 40, gap: 12 }}
            ListEmptyComponent={
              <Text variant="footnote" color="muted" className="text-center py-8">
                {search
                  ? 'Keine Spieler gefunden'
                  : 'Alle Spieler sind bereits im Training'}
              </Text>
            }
            renderItem={({ item }: { item: any }) => (
              <PlayerCard
                player={item}
                trailing={
                  <Button
                    variant="primary"
                    size="sm"
                    loading={addingId === item.documentId}
                    disabled={addingId !== null && addingId !== item.documentId}
                    onPress={() => handleAdd(item.documentId)}
                    className="min-w-[110px]"
                  >
                    Hinzufügen
                  </Button>
                }
              />
            )}
          />
        </View>
      </BottomSheet>
    );
  }
);
