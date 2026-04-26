import { useRef } from 'react';
import { Platform, View, Pressable } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import {
  Screen,
  Text,
  Icon,
  SkeletonDetail,
  SkeletonList,
} from '@/components/ui';
import {
  TrainingPickerSheet,
  TrainingPickerSheetRef,
} from '@/components/sheets/TrainingPickerSheet';
import { useMethodicalSeriesDetail } from '@/lib/queries/useMethodicalSeries';


const headerOptions = {
  headerShown: true as const,
  title: 'Lernpfad',
  headerLeft: () => (
    <Pressable onPress={() => router.back()} className="px-2 py-1" hitSlop={8}>
      <Icon
        name={Platform.OS === 'web' ? 'close' : 'chevron-back'}
        size={22}
        color="foreground"
      />
    </Pressable>
  ),
};

export default function MethodicalSeriesDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: series, isLoading } = useMethodicalSeriesDetail(id);
  const trainingPickerRef = useRef<TrainingPickerSheetRef>(null);

  if (isLoading) {
    return (
      <Screen scroll padding="base" edges={['bottom']}>
        <Stack.Screen options={headerOptions} />
        <View className="pt-14">
          <SkeletonDetail />
          <View className="mt-6">
            <SkeletonList count={4} />
          </View>
        </View>
      </Screen>
    );
  }

  if (!series) {
    return (
      <Screen edges={['bottom']}>
        <Stack.Screen options={headerOptions} />
        <View className="flex-1 items-center justify-center">
          <Icon name="list-outline" size={40} color="muted" />
          <Text variant="footnote" color="muted" className="mt-3">
            Lernpfad nicht gefunden
          </Text>
        </View>
      </Screen>
    );
  }

  const exerciseIds = (series.exercises ?? []).map((ex) => ex.documentId);

  return (
    <Screen scroll edges={['bottom']}>
      <Stack.Screen options={headerOptions} />

      {/* Hero */}
      <View className="bg-card px-5 pt-5 pb-6 border-b border-border">
        <View className="w-12 h-12 rounded-full bg-primary/15 items-center justify-center mb-4">
          <Icon name="school-outline" size={26} color="primary" />
        </View>

        {series.category ? (
          <View className="self-start bg-amber-500/25 border border-amber-400/50 rounded-md px-2 py-1 mb-2">
            <Text variant="caption2" className="text-amber-300 font-bold uppercase tracking-widest">
              {series.category}
            </Text>
          </View>
        ) : null}

        <Text variant="largeTitle" weight="bold" className="mb-1">
          {series.name}
        </Text>

        {series.goal ? (
          <View className="bg-surface-1 rounded-lg px-3 py-2 mt-2">
            <Text variant="caption1" weight="semibold" color="muted" className="mb-1">
              Ziel
            </Text>
            <Text variant="footnote">{series.goal}</Text>
          </View>
        ) : null}

        {series.description ? (
          <Text variant="footnote" className="mt-3" color="muted">
            {series.description}
          </Text>
        ) : null}
      </View>

      {/* Exercise list */}
      <View className="px-5 pt-4 pb-4">
        <Text variant="headline" weight="semibold" className="mb-3">
          {series.exercises?.length ?? 0} Übungen
        </Text>

        {(series.exercises ?? []).map((ex, idx) => (
          <Pressable
            key={ex.documentId}
            onPress={() =>
              router.push({
                pathname: '/exercise-detail/[id]',
                params: { id: ex.documentId },
              })
            }
            className="flex-row items-center gap-3 mb-3 bg-card border border-border rounded-xl px-3 py-3 active:opacity-80"
          >
            <View className="w-7 h-7 rounded-full bg-primary/15 items-center justify-center shrink-0">
              <Text variant="caption2" weight="bold" color="primary">
                {idx + 1}
              </Text>
            </View>
            <Text variant="subhead" className="flex-1" numberOfLines={2}>
              {ex.Name}
            </Text>
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                trainingPickerRef.current?.present(ex.documentId, ex.Name);
              }}
              hitSlop={10}
              className="w-9 h-9 rounded-full bg-primary/15 items-center justify-center shrink-0"
            >
              <Icon name="add" size={18} color="primary" />
            </Pressable>
          </Pressable>
        ))}
      </View>

      {/* Add whole series CTA */}
      <View className="px-5 pb-8">
        <Pressable
          onPress={() =>
            trainingPickerRef.current?.presentSeries(
              series.documentId,
              series.name,
              exerciseIds,
            )
          }
          className="flex-row items-center justify-center gap-2 bg-primary rounded-xl py-4 active:opacity-80"
        >
          <Icon name="add" size={20} color="inverse" />
          <Text variant="subhead" weight="semibold" color="inverse">
            Ganze Reihe hinzufügen
          </Text>
        </Pressable>
      </View>

      <TrainingPickerSheet ref={trainingPickerRef} />
    </Screen>
  );
}
