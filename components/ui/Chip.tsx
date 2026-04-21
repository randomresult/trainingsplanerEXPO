import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import { Text } from './Text';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils/cn';

export interface ChipProps extends Omit<PressableProps, 'children'> {
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Chip({ active, onPress, children, className, ...rest }: ChipProps) {
  return (
    <Pressable
      onPress={(e) => {
        triggerHaptic('selection');
        onPress?.(e);
      }}
      className={cn(
        'px-4 py-2.5 rounded-full border',
        active ? 'bg-primary/20 border-primary' : 'bg-card border-border',
        className
      )}
      {...rest}
    >
      <Text
        variant="subhead"
        weight="medium"
        color={active ? 'primary' : 'muted'}
      >
        {children}
      </Text>
    </Pressable>
  );
}
