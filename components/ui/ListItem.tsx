import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Text } from './Text';
import { Icon } from './Icon';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils/cn';

export interface ListItemProps {
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  className?: string;
}

export function ListItem({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
  showChevron,
  className,
}: ListItemProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const content = (
    <View className={cn('flex-row items-center py-3 px-4 gap-3', className)}>
      {leading && <View>{leading}</View>}
      <View className="flex-1">
        <Text variant="body" numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="footnote" color="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing}
      {showChevron && !trailing && <Icon name="chevron-forward" color="muted" size={18} />}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => (scale.value = withSpring(0.98, { damping: 20, stiffness: 400 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 20, stiffness: 400 }))}
        onPress={() => {
          triggerHaptic('light');
          onPress();
        }}
      >
        {content}
      </Pressable>
    </Animated.View>
  );
}
