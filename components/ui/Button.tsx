import React from 'react';
import { ActivityIndicator, Pressable, PressableProps, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Text } from './Text';
import { Icon } from './Icon';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic, HapticStrength } from '@/lib/haptics';
import { cn } from '@/lib/utils/cn';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

const VARIANT: Record<Variant, { bg: string; text: 'inverse' | 'foreground' | 'destructive' | 'primary' }> = {
  primary: { bg: 'bg-primary', text: 'inverse' },
  secondary: { bg: 'bg-surface-1 border border-border', text: 'foreground' },
  ghost: { bg: 'bg-transparent', text: 'primary' },
  destructive: { bg: 'bg-destructive', text: 'inverse' },
};

const SIZE: Record<Size, string> = {
  sm: 'h-9 px-3 rounded-md',
  md: 'h-11 px-4 rounded-lg',
  lg: 'h-14 px-5 rounded-xl',
};

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  variant?: Variant;
  size?: Size;
  leftIcon?: IoniconsName;
  rightIcon?: IoniconsName;
  loading?: boolean;
  haptic?: HapticStrength;
  children: React.ReactNode;
  className?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  loading,
  haptic = 'light',
  disabled,
  onPress,
  children,
  className,
  ...rest
}: ButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
    opacity.value = withSpring(0.85, { damping: 20, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 400 });
    opacity.value = withSpring(1, { damping: 20, stiffness: 400 });
  };

  const handlePress = (e: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
    triggerHaptic(haptic);
    onPress?.(e);
  };

  const v = VARIANT[variant];
  const isDisabled = disabled || loading;

  return (
    <Animated.View style={animatedStyle} className={cn(isDisabled && 'opacity-50')}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={isDisabled}
        className={cn('flex-row items-center justify-center gap-2', v.bg, SIZE[size], className)}
        {...rest}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            {leftIcon && <Icon name={leftIcon} size={18} color={v.text} />}
            <Text variant={size === 'sm' ? 'subhead' : 'body'} weight="semibold" color={v.text}>
              {children}
            </Text>
            {rightIcon && <Icon name={rightIcon} size={18} color={v.text} />}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
