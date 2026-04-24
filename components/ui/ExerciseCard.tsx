import React from 'react';
import { View } from 'react-native';
import { Text } from './Text';
import { Card } from './Card';
import { ExercisePills } from './ExercisePills';
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
  return (
    <Card onPress={onPress} className={cn('gap-2.5', className)}>
      <View className="flex-row items-start gap-3">
        <Text variant="headline" numberOfLines={2} className="flex-1">
          {exercise.Name}
        </Text>
        {trailing}
      </View>

      {!compact && <ExercisePills exercise={exercise} />}
    </Card>
  );
}
