import { useState } from 'react';
import { View, Modal, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { usePlayers } from '@/lib/queries/usePlayers';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
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
        <Text variant="body">
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
              <Text variant="title3" weight="bold">Spieler auswählen</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text variant="body" weight="semibold" color="primary">Fertig</Text>
              </Pressable>
            </View>
            <Text variant="subhead" color="muted" className="mt-1">
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
                        <Icon name="checkmark" size={14} color="inverse" />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text variant="subhead" weight="semibold" className="mb-1">
                        {item.firstname} {item.Name}
                      </Text>
                      {item.requiresInviteAcceptance && (
                        <View className="flex-row items-center gap-1 mt-0.5">
                          <Icon name="lock-closed-outline" size={12} color="warning" />
                          <Text variant="caption1" color="warning">Einladung wird gesendet</Text>
                        </View>
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
