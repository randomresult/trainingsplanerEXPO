import { useState } from 'react';
import { View, Text, Modal, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { usePlayers } from '@/lib/queries/usePlayers';
import type { Player } from '@/lib/types/models';

interface PlayerSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function PlayerSelector({ selectedIds, onSelectionChange }: PlayerSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { data: players, isLoading } = usePlayers();

  const togglePlayer = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        className="bg-card border border-border rounded-lg px-4 py-3"
      >
        <Text className="text-foreground">
          {selectedIds.length > 0
            ? `${selectedIds.length} Spieler ausgewählt`
            : 'Spieler auswählen'}
        </Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-background">
          <View className="p-5 border-b border-border">
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-bold text-foreground">Spieler auswählen</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text className="text-primary font-semibold">Fertig</Text>
              </Pressable>
            </View>
            <Text className="text-sm text-muted-foreground mt-1">
              {selectedIds.length} ausgewählt
            </Text>
          </View>

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#6c47ff" />
            </View>
          ) : (
            <FlatList
              data={players}
              keyExtractor={(item) => item.documentId}
              contentContainerStyle={{ padding: 20 }}
              renderItem={({ item }) => {
                const isSelected = selectedIds.includes(item.documentId);
                return (
                  <Pressable
                    onPress={() => togglePlayer(item.documentId)}
                    className="flex-row items-center bg-card rounded-lg p-4 mb-3 border border-border"
                  >
                    <View className={`w-6 h-6 rounded border-2 items-center justify-center mr-3 ${
                      isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`}>
                      {isSelected && (
                        <Text className="text-xs font-bold text-primary-foreground">✓</Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground mb-1">
                        {item.firstname} {item.Name}
                      </Text>
                      {item.requiresInviteAcceptance && (
                        <Text className="text-xs text-warning">
                          🔒 Einladung wird gesendet
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </>
  );
}
