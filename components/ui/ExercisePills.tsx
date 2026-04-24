import React from 'react';
import { View } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { Badge } from './Badge';
import type { Exercise } from '@/lib/types/models';

// Playerlevels are the one dimension with real semantic meaning — Beginner/
// Intermediate/Advanced/Expert map to a severity gradient. Falling back
// through the English and German variants the Strapi content uses.
function levelVariant(name: string) {
  const lower = name.toLowerCase();
  if (/(beginner|anfänger)/.test(lower)) return 'success-soft' as const;
  if (/(intermediate|mittel|fortgeschritten)/.test(lower)) return 'warning-soft' as const;
  if (/(advanced|expert|experte|profi)/.test(lower)) return 'destructive-soft' as const;
  return 'muted' as const;
}

export interface ExercisePillsProps {
  exercise: Pick<Exercise, 'Minutes' | 'focusareas' | 'playerlevels' | 'categories'>;
}

export function ExercisePills({ exercise }: ExercisePillsProps) {
  const focusareas = exercise.focusareas ?? [];
  const playerlevels = exercise.playerlevels ?? [];
  const categories = exercise.categories ?? [];

  return (
    <View className="flex-row items-center flex-wrap gap-1.5">
      <View className="flex-row items-center gap-1 pr-2.5 border-r border-border">
        <Icon name="time-outline" size={12} color="muted" />
        <Text variant="caption1" weight="semibold" color="muted">
          {exercise.Minutes} Min
        </Text>
      </View>

      {playerlevels.map((lvl) => (
        <Badge key={lvl.documentId} variant={levelVariant(lvl.Name)}>
          {lvl.Name}
        </Badge>
      ))}
      {categories.map((c) => (
        <Badge key={c.documentId} variant="primary-soft">
          {c.Name}
        </Badge>
      ))}
      {focusareas.map((f) => (
        <Badge key={f.documentId} variant="muted">
          {f.Name}
        </Badge>
      ))}
    </View>
  );
}
