import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/lib/utils/cn';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export interface FilterChipProps {
  label: string;
  active?: boolean;
  leadingIcon?: IoniconsName;
  badge?: number;
  onPress?: () => void;
  onRemove?: () => void;
  className?: string;
}

export function FilterChip({
  label,
  active,
  leadingIcon,
  badge,
  onPress,
  onRemove,
  className,
}: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-1.5 rounded-full px-3 py-1.5 border',
        active
          ? 'bg-primary/15 border-primary/40'
          : 'bg-surface-1 border-border',
        className
      )}
    >
      {leadingIcon && (
        <Icon name={leadingIcon} size={12} color={active ? 'primary' : 'muted'} />
      )}
      <Text variant="caption1" weight={active ? 'semibold' : 'regular'} color={active ? 'primary' : 'foreground'}>
        {label}
      </Text>
      {typeof badge === 'number' && badge > 0 && (
        <View className="bg-primary rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
          <Text variant="caption2" weight="bold" color="inverse">
            {badge}
          </Text>
        </View>
      )}
      {onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={6}
          className="ml-0.5"
        >
          <Icon name="close" size={12} color={active ? 'primary' : 'muted'} />
        </Pressable>
      )}
    </Pressable>
  );
}
