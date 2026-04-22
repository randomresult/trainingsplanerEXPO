import React from 'react';
import { Pressable, PressableProps, View, ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { triggerHaptic, HapticStrength } from '@/lib/haptics';
import { cn } from '@/lib/utils/cn';

type Variant = 'elevated' | 'flat' | 'outline';
type AccentColor = 'primary' | 'warning' | 'success' | 'destructive' | 'muted';

const VARIANT: Record<Variant, string> = {
  elevated: 'bg-card border border-border',
  flat: 'bg-surface-1',
  outline: 'bg-transparent border border-border',
};

const ACCENT: Record<AccentColor, string> = {
  primary: 'border-l-primary',
  warning: 'border-l-warning',
  success: 'border-l-success',
  destructive: 'border-l-destructive',
  muted: 'border-l-muted',
};

export interface CardProps extends Omit<ViewProps, 'children' | 'style'> {
  variant?: Variant;
  accent?: 'left';
  accentColor?: AccentColor;
  onPress?: PressableProps['onPress'];
  haptic?: HapticStrength;
  children: React.ReactNode;
  className?: string;
}

export function Card({
  variant = 'elevated',
  accent,
  accentColor = 'primary',
  onPress,
  haptic = 'light',
  children,
  className,
  ...rest
}: CardProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardClasses = cn(
    'rounded-2xl p-5',
    VARIANT[variant],
    accent === 'left' && 'border-l-4',
    accent === 'left' && ACCENT[accentColor],
    className
  );

  if (!onPress) {
    return (
      <View className={cardClasses} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 20, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 20, stiffness: 400 });
        }}
        onPress={(e) => {
          triggerHaptic(haptic);
          onPress(e);
        }}
        className={cardClasses}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
