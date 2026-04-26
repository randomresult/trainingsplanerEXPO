import React, { useState } from 'react';
import { View, Pressable, TextInput, Platform, Alert } from 'react-native';
import { Text, Icon } from '@/components/ui';
import { ExercisePills } from '@/components/ui/ExercisePills';
import type { MethodicalSeriesRef, Exercise } from '@/lib/types/models';

interface ExerciseState {
  documentId: string;
  completed: boolean;
  editedMinutes: number;
}

interface MethodicalSeriesBlockProps {
  series: MethodicalSeriesRef;
  blockExercises: Exercise[];
  totalInSeries: number;
  mode: 'view' | 'edit' | 'execute';
  onRemoveSeries?: () => void;
  onRemoveExercise?: (exerciseDocumentId: string) => void;
  exerciseStates?: Map<string, ExerciseState>;
  indexByDocId?: Map<string, number>;
  onToggleComplete?: (idx: number) => void;
  onSetMinutes?: (idx: number, minutes: number) => void;
  expandedId?: string | null;
  onSetExpanded?: (id: string | null) => void;
}

export function MethodicalSeriesBlock({
  series,
  blockExercises,
  totalInSeries,
  mode,
  onRemoveSeries,
  onRemoveExercise,
  exerciseStates,
  indexByDocId,
  onToggleComplete,
  onSetMinutes,
  expandedId,
  onSetExpanded,
}: MethodicalSeriesBlockProps) {
  const [collapsed, setCollapsed] = useState(false);

  const inBlock = blockExercises.length;

  const confirmRemoveExercise = (ex: Exercise) => {
    if (!onRemoveExercise) return;
    const msg = `"${ex.Name}" aus dem Training entfernen?`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(msg)) {
        onRemoveExercise(ex.documentId);
      }
      return;
    }
    Alert.alert('Übung entfernen', msg, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Entfernen', style: 'destructive', onPress: () => onRemoveExercise(ex.documentId) },
    ]);
  };

  const confirmRemoveSeries = () => {
    if (!onRemoveSeries) return;
    const msg = `Lernpfad "${series.name}" aus dem Training entfernen?`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(msg)) onRemoveSeries();
      return;
    }
    Alert.alert('Lernpfad entfernen', msg, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Entfernen', style: 'destructive', onPress: onRemoveSeries },
    ]);
  };

  return (
    <View className="mb-3 rounded-xl border border-primary/30 overflow-hidden">
      {/* Block header */}
      <Pressable
        onPress={() => setCollapsed(!collapsed)}
        className="flex-row items-center px-4 py-3 bg-primary/10"
      >
        <Icon
          name={collapsed ? 'chevron-forward' : 'chevron-down'}
          size={16}
          color="primary"
        />
        <View className="flex-1 ml-2">
          <Text variant="subhead" weight="semibold" color="primary" numberOfLines={1}>
            {series.name}
          </Text>
        </View>
        <Text variant="caption1" color="muted" className="mr-2">
          {inBlock}/{totalInSeries}
        </Text>
        {mode === 'edit' && onRemoveSeries && (
          <Pressable
            onPress={confirmRemoveSeries}
            hitSlop={8}
            className="w-8 h-8 rounded-full bg-destructive/10 items-center justify-center"
          >
            <Icon name="close" size={16} color="destructive" />
          </Pressable>
        )}
      </Pressable>

      {/* Exercises */}
      {!collapsed && blockExercises.map((ex) => {
        const state = exerciseStates?.get(ex.documentId);
        const idx = indexByDocId?.get(ex.documentId) ?? -1;
        const expanded = expandedId === ex.documentId;

        return (
          <View
            key={ex.documentId}
            className="border-t border-primary/10 px-4 py-3"
          >
            {mode === 'execute' ? (
              <>
                <Pressable
                  onPress={() => onSetExpanded?.(expanded ? null : ex.documentId)}
                  className="gap-2"
                >
                  <Text
                    variant="subhead"
                    numberOfLines={2}
                    className={state?.completed ? 'line-through opacity-60' : ''}
                  >
                    {ex.Name}
                  </Text>
                  <ExercisePills exercise={ex} />
                </Pressable>
                <View className="flex-row items-center gap-3 mt-2">
                  <Pressable
                    onPress={() => {
                      if (idx >= 0) onToggleComplete?.(idx);
                    }}
                    hitSlop={8}
                  >
                    <View
                      className={`w-9 h-9 rounded-full border-2 items-center justify-center ${
                        state?.completed ? 'bg-success border-success' : 'border-muted'
                      }`}
                    >
                      {state?.completed && <Icon name="checkmark" size={20} color="inverse" />}
                    </View>
                  </Pressable>
                  <View className="flex-row items-center bg-surface-1 rounded-md px-2 py-1">
                    <TextInput
                      value={String(state?.editedMinutes ?? ex.Minutes ?? 0)}
                      onChangeText={(t) => {
                        const n = parseInt(t, 10);
                        if (idx >= 0) onSetMinutes?.(idx, Number.isFinite(n) ? n : 0);
                      }}
                      keyboardType="number-pad"
                      className="text-foreground text-right"
                      style={{ padding: 0, width: 28 }}
                    />
                    <Text variant="caption1" color="muted" className="ml-1">min</Text>
                  </View>
                </View>
                {expanded && (
                  <ExerciseExpandedDetail exercise={ex} />
                )}
              </>
            ) : (
              <View className="flex-row items-center">
                <View className="flex-1">
                  <Text variant="subhead" numberOfLines={2}>{ex.Name}</Text>
                  <Text variant="caption1" color="muted">{ex.Minutes} Min</Text>
                </View>
                {mode === 'edit' && onRemoveExercise && (
                  <Pressable
                    onPress={() => confirmRemoveExercise(ex)}
                    hitSlop={8}
                    className="ml-3 w-11 h-11 rounded-full bg-destructive/10 items-center justify-center"
                  >
                    <Icon name="close" size={20} color="destructive" />
                  </Pressable>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function ExerciseExpandedDetail({ exercise }: { exercise: Exercise }) {
  return (
    <View className="pt-3 border-t border-border mt-2">
      {exercise.Description ? (
        <Text variant="footnote" color="muted" className="mb-3">{exercise.Description}</Text>
      ) : null}
      {(exercise.Steps as any)?.length > 0 && (
        <View className="mb-3">
          <Text variant="subhead" weight="semibold" className="mb-2">Anleitung</Text>
          {(exercise.Steps as any).map((step: any, sidx: number) => {
            const title = typeof step === 'string' ? step : step?.Name;
            const body = typeof step === 'string' ? null : step?.Description;
            return (
              <View key={step?.id ?? sidx} className="flex-row gap-2 mb-2">
                <Text variant="caption1" color="muted" weight="bold">{sidx + 1}.</Text>
                <View className="flex-1">
                  <Text variant="footnote">{title}</Text>
                  {body && <Text variant="caption1" color="muted">{body}</Text>}
                </View>
              </View>
            );
          })}
        </View>
      )}
      {exercise.Hint ? (
        <View className="bg-warning/10 rounded-md p-3 flex-row gap-2">
          <Icon name="bulb-outline" size={14} color="warning" />
          <Text variant="caption1" className="flex-1">{exercise.Hint}</Text>
        </View>
      ) : null}
    </View>
  );
}
