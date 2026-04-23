import React from 'react';
import { View } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { Card } from './Card';
import { Badge } from './Badge';
import { focusColorFromName, type FocusColor } from '@/lib/utils/focusColor';
import { cn } from '@/lib/utils/cn';
import type { Exercise } from '@/lib/types/models';

export interface ExerciseCardProps {
  exercise: Exercise;
  onPress?: () => void;
  trailing?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

function badgeVariant(color: FocusColor) {
  return (color === 'muted' ? 'muted' : `${color}-soft`) as
    | 'muted'
    | 'primary-soft'
    | 'info-soft'
    | 'success-soft'
    | 'warning-soft'
    | 'destructive-soft';
}

export function ExerciseCard({
  exercise,
  onPress,
  trailing,
  compact,
  className,
}: ExerciseCardProps) {
  const focusareas = exercise.focusareas ?? [];
  const playerlevels = exercise.playerlevels ?? [];
  const categories = exercise.categories ?? [];

  return (
    <Card onPress={onPress} className={cn('flex-row items-start gap-3', className)}>
      <View className="flex-1">
        <Text variant="headline" numberOfLines={1}>
          {exercise.Name}
        </Text>
        {!compact && exercise.Description && (
          <Text variant="footnote" color="muted" numberOfLines={2} className="mt-0.5">
            {exercise.Description}
          </Text>
        )}

        <View className="flex-row flex-wrap items-center gap-1.5 mt-2">
          <View className="self-start rounded-md px-2.5 py-1 bg-muted flex-row items-center gap-1">
            <Icon name="time-outline" size={11} color="muted" />
            <Text variant="caption1" weight="semibold" color="muted">
              {exercise.Minutes} Min
            </Text>
          </View>

          {playerlevels.map((lvl) => (
            <Badge key={lvl.documentId} variant={badgeVariant(focusColorFromName(lvl.Name))}>
              {lvl.Name}
            </Badge>
          ))}
          {focusareas.map((f) => (
            <Badge key={f.documentId} variant={badgeVariant(focusColorFromName(f.Name))}>
              {f.Name}
            </Badge>
          ))}
          {categories.map((c) => (
            <Badge key={c.documentId} variant={badgeVariant(focusColorFromName(c.Name))}>
              {c.Name}
            </Badge>
          ))}
        </View>
      </View>

      {trailing && <View className="ml-1">{trailing}</View>}
    </Card>
  );
}
