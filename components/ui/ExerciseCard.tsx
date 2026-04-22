import React from 'react';
import { View } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { Card } from './Card';
import { Badge } from './Badge';
import { focusColorFromName } from '@/lib/utils/focusColor';
import { cn } from '@/lib/utils/cn';
import type { Exercise } from '@/lib/types/models';

export interface ExerciseCardProps {
  exercise: Exercise;
  onPress?: () => void;
  trailing?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export function ExerciseCard({
  exercise,
  onPress,
  trailing,
  compact,
  className,
}: ExerciseCardProps) {
  const focusName = exercise.focus?.[0]?.Name;
  const focusColor = focusColorFromName(focusName);
  const initial = exercise.Name?.[0]?.toUpperCase() ?? '?';

  return (
    <Card onPress={onPress} className={cn('flex-row items-center gap-3', className)}>
      <View
        className={cn(
          'w-10 h-10 rounded-full items-center justify-center',
          focusColor === 'primary' && 'bg-primary/20',
          focusColor === 'info' && 'bg-info/20',
          focusColor === 'success' && 'bg-success/20',
          focusColor === 'warning' && 'bg-warning/20',
          focusColor === 'destructive' && 'bg-destructive/20',
          focusColor === 'muted' && 'bg-muted'
        )}
      >
        <Text variant="subhead" weight="bold" color={focusColor === 'muted' ? 'foreground' : focusColor}>
          {initial}
        </Text>
      </View>

      <View className="flex-1">
        <Text variant="headline" numberOfLines={1}>
          {exercise.Name}
        </Text>
        {!compact && exercise.Description && (
          <Text variant="footnote" color="muted" numberOfLines={2} className="mt-0.5">
            {exercise.Description}
          </Text>
        )}
        <View className="flex-row items-center gap-3 mt-1.5">
          <View className="flex-row items-center gap-1">
            <Icon name="time-outline" size={12} color="muted" />
            <Text variant="caption1" color="muted">
              {exercise.Minutes} Min
            </Text>
          </View>
          {exercise.Difficulty && (
            <Text variant="caption1" color="muted">
              · {exercise.Difficulty}
            </Text>
          )}
          {focusName && (
            <Badge variant={`${focusColor}-soft` as any} className="ml-auto">
              {focusName}
            </Badge>
          )}
        </View>
      </View>

      {trailing}
    </Card>
  );
}
