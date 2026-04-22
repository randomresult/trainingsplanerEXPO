import { useMemo, useRef } from 'react';
import { View, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { router } from 'expo-router';
import {
  Screen,
  Text,
  Icon,
  TrainingCard,
} from '@/components/ui';
import { useTrainings } from '@/lib/queries/useTrainings';
import { CreateTrainingSheet, CreateTrainingSheetRef } from '@/components/sheets/CreateTrainingSheet';
import type { Training } from '@/lib/types/models';

export default function TrainingsScreen() {
  const { data: trainings, isLoading } = useTrainings();
  const createSheetRef = useRef<CreateTrainingSheetRef>(null);
  const listRef = useRef<FlatList>(null);

  const upcoming = useMemo(() => {
    if (!trainings) return [];
    return trainings
      .filter((t) => t.training_status === 'draft' || t.training_status === 'in_progress')
      .sort((a: any, b: any) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
  }, [trainings]);

  const renderHeader = () => (
    <View className="px-5 pt-4 pb-4 flex-row justify-between items-center">
      <Text variant="largeTitle" weight="bold">Training</Text>
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => router.push('/trainings/history')}
          className="w-10 h-10 rounded-full bg-surface-1 items-center justify-center"
        >
          <Icon name="time-outline" size={20} color="foreground" />
        </Pressable>
        <Pressable
          onPress={() => createSheetRef.current?.present()}
          className="w-10 h-10 rounded-full bg-primary items-center justify-center"
        >
          <Icon name="add" size={22} color="inverse" />
        </Pressable>
      </View>
    </View>
  );

  const renderItem = ({ item, index }: { item: Training; index: number }) => (
    <TrainingCard
      training={item}
      variant={index === 0 ? 'hero' : 'compact'}
      onPress={() => router.push(`/trainings/${item.documentId}`)}
      className="mb-4"
    />
  );

  return (
    <Screen>
      {renderHeader()}

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : upcoming.length === 0 ? (
        <View className="flex-1 items-center justify-center px-5">
          <Pressable
            onPress={() => createSheetRef.current?.present()}
            className="w-full rounded-2xl border-2 border-dashed border-primary/40 p-10 items-center"
          >
            <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center mb-4">
              <Icon name="add" size={28} color="primary" />
            </View>
            <Text variant="headline" color="primary">Dein erstes Training erstellen</Text>
            <Text variant="footnote" color="muted" className="mt-1 text-center">
              Tippe hier um loszulegen
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={upcoming}
          keyExtractor={(item) => item.documentId}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          onScrollToIndexFailed={({ index }) => {
            setTimeout(() => {
              listRef.current?.scrollToIndex({ index, animated: true });
            }, 300);
          }}
        />
      )}

      <CreateTrainingSheet
        ref={createSheetRef}
        onCreated={(newId) => {
          // Wait one frame for refetch to update list, then scroll
          setTimeout(() => {
            const idx = upcoming.findIndex((t) => t.documentId === newId);
            if (idx >= 0 && listRef.current) {
              listRef.current.scrollToIndex({ index: idx, animated: true });
            }
          }, 300);
        }}
      />
    </Screen>
  );
}
