// components/ui/EmptyState.tsx
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Icon } from './Icon';
import { Text } from './Text';
import { Button } from './Button';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

interface EmptyStateProps {
  icon: IoniconsName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 120 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View className="flex-1 items-center justify-center p-6">
      <Animated.View style={animatedStyle}>
        <Icon name={icon} size={64} color="muted" />
      </Animated.View>
      <Text variant="headline" className="mt-6 text-center">
        {title}
      </Text>
      {description && (
        <Text variant="body" color="muted" className="mt-2 text-center">
          {description}
        </Text>
      )}
      {onAction && actionLabel && (
        <Button variant="secondary" onPress={onAction} className="mt-6">
          {actionLabel}
        </Button>
      )}
    </View>
  );
}
