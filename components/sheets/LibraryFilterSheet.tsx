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
  focus: string[];          // multi-select focus names
  difficulty: string | null; // single-select difficulty string, or null = alle
  duration: DurationBucket | null; // single-select bucket, or null = alle
}

export const EMPTY_FILTERS: LibraryFilterState = {
  focus: [],
  difficulty: null,
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
  availableFocus: string[];
  availableDifficulty: string[];
}

export const LibraryFilterSheet = forwardRef<LibraryFilterSheetRef, Props>(
  function LibraryFilterSheet(
    { filters, onChange, availableFocus, availableDifficulty },
    ref
  ) {
    const sheetRef = useRef<BottomSheetRef>(null);

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
    }));

    const toggleFocus = (name: string) => {
      const next = filters.focus.includes(name)
        ? filters.focus.filter((f) => f !== name)
        : [...filters.focus, name];
      onChange({ ...filters, focus: next });
    };

    const setDifficulty = (value: string) => {
      onChange({
        ...filters,
        difficulty: filters.difficulty === value ? null : value,
      });
    };

    const setDuration = (value: DurationBucket) => {
      onChange({
        ...filters,
        duration: filters.duration === value ? null : value,
      });
    };

    const reset = () => onChange(EMPTY_FILTERS);

    return (
      <BottomSheet ref={sheetRef} snapPoints={['70%']} title="Filter">
        <View className="flex-1">
          <View className="flex-row justify-end mb-2">
            <Pressable onPress={reset}>
              <Text variant="footnote" color="warning" weight="semibold">
                Zurücksetzen
              </Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            {availableFocus.length > 0 && (
              <View className="mb-5">
                <Text variant="caption1" color="muted" className="uppercase tracking-wide mb-2">
                  Fokus
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {availableFocus.map((name) => (
                    <FilterChip
                      key={name}
                      label={name}
                      active={filters.focus.includes(name)}
                      onPress={() => toggleFocus(name)}
                    />
                  ))}
                </View>
              </View>
            )}

            {availableDifficulty.length > 0 && (
              <View className="mb-5">
                <Text variant="caption1" color="muted" className="uppercase tracking-wide mb-2">
                  Schwierigkeit
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {availableDifficulty.map((d) => (
                    <FilterChip
                      key={d}
                      label={d}
                      active={filters.difficulty === d}
                      onPress={() => setDifficulty(d)}
                    />
                  ))}
                </View>
              </View>
            )}

            <View className="mb-5">
              <Text variant="caption1" color="muted" className="uppercase tracking-wide mb-2">
                Dauer
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {(Object.keys(DURATION_LABEL) as DurationBucket[]).map((b) => (
                  <FilterChip
                    key={b}
                    label={DURATION_LABEL[b]}
                    active={filters.duration === b}
                    onPress={() => setDuration(b)}
                  />
                ))}
              </View>
            </View>
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
