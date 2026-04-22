import React from 'react';
import { View } from 'react-native';
import { Text } from './Text';
import { cn } from '@/lib/utils/cn';

type Variant =
  | 'primary-soft'
  | 'success-soft'
  | 'warning-soft'
  | 'destructive-soft'
  | 'info-soft'
  | 'muted';

const VARIANT_BG: Record<Variant, string> = {
  'primary-soft': 'bg-primary/20',
  'success-soft': 'bg-success/20',
  'warning-soft': 'bg-warning/20',
  'destructive-soft': 'bg-destructive/20',
  'info-soft': 'bg-info/20',
  muted: 'bg-muted',
};

const VARIANT_COLOR = {
  'primary-soft': 'primary',
  'success-soft': 'success',
  'warning-soft': 'warning',
  'destructive-soft': 'destructive',
  'info-soft': 'info',
  muted: 'muted',
} as const;

export interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'muted', children, className }: BadgeProps) {
  return (
    <View className={cn('self-start rounded-md px-2.5 py-1', VARIANT_BG[variant], className)}>
      <Text variant="caption1" weight="semibold" color={VARIANT_COLOR[variant]}>
        {children}
      </Text>
    </View>
  );
}
