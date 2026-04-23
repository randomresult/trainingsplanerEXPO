import { useEffect, useMemo } from 'react';
import { View, SectionList, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Screen, Text, TrainingCard } from '@/components/ui';
import { useTrainingsHistory } from '@/lib/queries/useTrainings';
import { COLORS } from '@/lib/theme';
import type { Training } from '@/lib/types/models';

interface Section {
  title: string;
  data: Training[];
}

function monthLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { year: 'numeric', month: 'long' });
}

const MAX_AUTO_FETCH_PAGES = 5;

export default function HistoryScreen() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useTrainingsHistory();

  const sections = useMemo<Section[]>(() => {
    if (!data) return [];
    const all = data.pages.flatMap((p) => p.items);
    const grouped = new Map<string, Training[]>();
    for (const t of all) {
      const key = monthLabel(t.Date);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(t);
    }
    return Array.from(grouped.entries()).map(([title, data]) => ({ title, data }));
  }, [data]);

  // If the current fetched pages all get filtered out client-side (e.g. draft/active
  // trainings filling the first page), keep paging until we find completed ones or
  // exhaust a safety cap.
  useEffect(() => {
    if (!data) return;
    if (sections.length > 0) return;
    if (!hasNextPage || isFetchingNextPage) return;
    if (data.pages.length >= MAX_AUTO_FETCH_PAGES) return;
    fetchNextPage();
  }, [data, sections, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.documentId}
        stickySectionHeadersEnabled
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
        renderSectionHeader={({ section }) => (
          <View className="bg-background py-2">
            <Text variant="subhead" weight="semibold" color="muted">
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TrainingCard
            training={item}
            variant="compact"
            onPress={() => router.push(`/trainings/${item.documentId}`)}
            className="mb-3"
          />
        )}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4 items-center">
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text variant="footnote" color="muted">
              Noch keine abgeschlossenen Trainings.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}
