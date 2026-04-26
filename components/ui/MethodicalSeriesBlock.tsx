import React, { useState } from 'react';
import { View, Pressable, Platform, Alert } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { TimePickerModal } from './TimePickerModal';
import { triggerHaptic } from '@/lib/haptics';
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
  onNavigateToDetail?: () => void;
  onNavigateToExercise?: (exerciseDocumentId: string) => void;
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
  onNavigateToDetail,
  onNavigateToExercise,
  exerciseStates,
  indexByDocId,
  onToggleComplete,
  onSetMinutes,
  expandedId,
  onSetExpanded,
}: MethodicalSeriesBlockProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [timerPickerDocId, setTimerPickerDocId] = useState<string | null>(null);

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
        className={`px-4 pt-4 bg-primary/10 ${collapsed ? 'pb-4' : 'pb-3'}`}
      >
        {/* Row 1: chevron + school icon + name */}
        <View className={`flex-row items-center gap-2 ${collapsed ? '' : 'mb-3'}`}>
          <Icon name={collapsed ? 'chevron-forward' : 'chevron-down'} size={18} color="primary" />
          <Icon name="school-outline" size={16} color="primary" />
          <Text variant="subhead" weight="semibold" color="primary" numberOfLines={1} className="flex-1">
            {series.name}
          </Text>
        </View>

        {/* Row 2: counter + actions — hidden when collapsed */}
        {!collapsed && (
          <View className="flex-row items-center justify-between">
            <Text variant="caption1" color="muted">
              {inBlock}/{totalInSeries} Übungen
            </Text>
            <View className="flex-row items-center gap-2">
              {onNavigateToDetail && (
                <Pressable
                  onPress={(e) => { e.stopPropagation?.(); onNavigateToDetail(); }}
                  hitSlop={8}
                  className="w-11 h-11 rounded-full bg-primary/20 items-center justify-center"
                >
                  <Icon name="open-outline" size={20} color="primary" />
                </Pressable>
              )}
              {(mode === 'edit' || mode === 'execute') && onRemoveSeries && (
                <Pressable
                  onPress={(e) => { e.stopPropagation?.(); confirmRemoveSeries(); }}
                  hitSlop={8}
                  className="w-11 h-11 rounded-full bg-destructive/10 items-center justify-center"
                >
                  <Icon name="close" size={20} color="destructive" />
                </Pressable>
              )}
            </View>
          </View>
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
            className="border-t border-primary/10 px-4 py-4"
          >
            {mode === 'execute' ? (
              <>
                <Pressable
                  onPress={() => onSetExpanded?.(expanded ? null : ex.documentId)}
                  className="flex-row items-center gap-2"
                >
                  <Icon name={expanded ? 'chevron-down' : 'chevron-forward'} size={16} color="muted" />
                  <Text
                    variant="subhead"
                    numberOfLines={2}
                    className={`flex-1 ${state?.completed ? 'line-through opacity-60' : ''}`}
                  >
                    {ex.Name}
                  </Text>
                </Pressable>
                <View className="flex-row items-center gap-4 mt-4">
                  <Pressable
                    onPress={() => {
                      triggerHaptic('light');
                      if (idx >= 0) onToggleComplete?.(idx);
                    }}
                    hitSlop={8}
                  >
                    <View
                      className={`w-14 h-14 rounded-full border-2 items-center justify-center ${
                        state?.completed ? 'bg-success border-success' : 'border-muted'
                      }`}
                    >
                      {state?.completed && <Icon name="checkmark" size={28} color="inverse" />}
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => setTimerPickerDocId(ex.documentId)}
                    className="flex-row items-center bg-surface-1 rounded-lg px-4 py-3 active:opacity-70"
                    hitSlop={4}
                  >
                    <Text variant="body" weight="semibold">
                      {state?.editedMinutes ?? ex.Minutes ?? 0}
                    </Text>
                    <Text variant="caption1" color="muted" className="ml-1">min</Text>
                  </Pressable>
                  <View className="flex-1" />
                  {onRemoveExercise && (
                    <Pressable
                      onPress={() => confirmRemoveExercise(ex)}
                      hitSlop={8}
                      className="w-12 h-12 rounded-full bg-destructive/10 items-center justify-center active:opacity-70"
                    >
                      <Icon name="close" size={22} color="destructive" />
                    </Pressable>
                  )}
                </View>
                {expanded && (
                  <View className="mt-4">
                    <ExercisePills exercise={ex} showMinutes={false} />
                  </View>
                )}
                {expanded && (
                  <ExerciseExpandedDetail exercise={ex} />
                )}
                <TimePickerModal
                  visible={timerPickerDocId === ex.documentId}
                  value={state?.editedMinutes ?? ex.Minutes ?? 0}
                  onClose={() => setTimerPickerDocId(null)}
                  onConfirm={(m) => {
                    if (idx >= 0) onSetMinutes?.(idx, m);
                    setTimerPickerDocId(null);
                  }}
                />
              </>
            ) : (
              <View className="flex-row items-center">
                <Pressable
                  onPress={() => onNavigateToExercise?.(ex.documentId)}
                  disabled={!onNavigateToExercise}
                  className="flex-1 flex-row justify-between items-start"
                >
                  <Text variant="subhead" numberOfLines={2} className="flex-1 mr-2">{ex.Name}</Text>
                  <Text variant="caption1" color="muted">{ex.Minutes} Min</Text>
                </Pressable>
                {mode === 'edit' && onRemoveExercise && (
                  <Pressable
                    onPress={() => confirmRemoveExercise(ex)}
                    hitSlop={8}
                    className="ml-3 w-12 h-12 rounded-full bg-destructive/10 items-center justify-center"
                  >
                    <Icon name="close" size={22} color="destructive" />
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
