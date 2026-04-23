import { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import {
  BottomSheet,
  BottomSheetRef,
  Button,
  FilterChip,
  Text,
} from '@/components/ui';

export type DurationBucket = 'short' | 'medium' | 'long';

export interface LibraryFilterState {
  focusareas: string[];
  playerlevels: string[];
  categories: string[];
  duration: DurationBucket | null;
}

export const EMPTY_FILTERS: LibraryFilterState = {
  focusareas: [],
  playerlevels: [],
  categories: [],
  duration: null,
};

export const DURATION_LABEL: Record<DurationBucket, string> = {
  short: 'bis 10 Min',
  medium: '10–20 Min',
  long: '20+ Min',
};

export interface LibraryFilterSheetRef {
  present: () => void;
}

interface Props {
  filters: LibraryFilterState;
  onChange: (next: LibraryFilterState) => void;
  availableFocusareas: string[];
  availablePlayerlevels: string[];
  availableCategories: string[];
}

export const LibraryFilterSheet = forwardRef<LibraryFilterSheetRef, Props>(
  function LibraryFilterSheet(
    {
      filters,
      onChange,
      availableFocusareas,
      availablePlayerlevels,
      availableCategories,
    },
    ref
  ) {
    const sheetRef = useRef<BottomSheetRef>(null);

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
    }));

    const toggleMulti = (
      key: 'focusareas' | 'playerlevels' | 'categories',
      name: string
    ) => {
      const current = filters[key];
      const next = current.includes(name)
        ? current.filter((v) => v !== name)
        : [...current, name];
      onChange({ ...filters, [key]: next });
    };

    const setDuration = (value: DurationBucket) => {
      onChange({
        ...filters,
        duration: filters.duration === value ? null : value,
      });
    };

    const reset = () => onChange(EMPTY_FILTERS);

    return (
      <BottomSheet ref={sheetRef} snapPoints={['80%']} title="Filter">
        <View className="flex-1">
          <View className="flex-row justify-end mb-2">
            <Pressable onPress={reset}>
              <Text variant="footnote" color="warning" weight="semibold">
                Zurücksetzen
              </Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            {availableCategories.length > 0 && (
              <FilterSection label="Kategorie">
                {availableCategories.map((name) => (
                  <FilterChip
                    key={name}
                    label={name}
                    active={filters.categories.includes(name)}
                    onPress={() => toggleMulti('categories', name)}
                  />
                ))}
              </FilterSection>
            )}

            {availablePlayerlevels.length > 0 && (
              <FilterSection label="Schwierigkeit">
                {availablePlayerlevels.map((name) => (
                  <FilterChip
                    key={name}
                    label={name}
                    active={filters.playerlevels.includes(name)}
                    onPress={() => toggleMulti('playerlevels', name)}
                  />
                ))}
              </FilterSection>
            )}

            {availableFocusareas.length > 0 && (
              <FilterSection label="Fokus">
                {availableFocusareas.map((name) => (
                  <FilterChip
                    key={name}
                    label={name}
                    active={filters.focusareas.includes(name)}
                    onPress={() => toggleMulti('focusareas', name)}
                  />
                ))}
              </FilterSection>
            )}

            <FilterSection label="Dauer">
              {(Object.keys(DURATION_LABEL) as DurationBucket[]).map((b) => (
                <FilterChip
                  key={b}
                  label={DURATION_LABEL[b]}
                  active={filters.duration === b}
                  onPress={() => setDuration(b)}
                />
              ))}
            </FilterSection>
          </ScrollView>

          <View className="pt-3 pb-4 border-t border-border">
            <Button
              size="lg"
              className="w-full"
              onPress={() => sheetRef.current?.dismiss()}
            >
              Übernehmen
            </Button>
          </View>
        </View>
      </BottomSheet>
    );
  }
);

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-5">
      <Text variant="caption1" color="muted" className="uppercase tracking-wide mb-2">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}
