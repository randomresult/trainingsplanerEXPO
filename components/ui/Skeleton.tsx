// components/ui/Skeleton.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { shimmerConfig } from '@/lib/animations';
import { cn } from '@/lib/utils/cn';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  className?: string;
  delay?: number;
}

export function Skeleton({ width = '100%', height = 16, className, delay = 0 }: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    setTimeout(() => {
      opacity.value = withRepeat(
        withTiming(1, { duration: shimmerConfig.duration, easing: shimmerConfig.easing }),
        -1,
        true
      );
    }, delay);
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={{ width: width as any, height }}>
      <Animated.View
        style={[StyleSheet.absoluteFill, animatedStyle]}
        className={cn('bg-muted rounded-md', className)}
      />
    </View>
  );
}

interface SkeletonLineProps {
  width?: number | string;
  height?: number;
  className?: string;
  delay?: number;
}

export function SkeletonLine({ width = '100%', height = 16, className, delay }: SkeletonLineProps) {
  return <Skeleton width={width} height={height} className={className} delay={delay} />;
}

interface SkeletonPillProps {
  width?: number;
  className?: string;
  delay?: number;
}

export function SkeletonPill({ width = 60, className, delay }: SkeletonPillProps) {
  return <Skeleton width={width} height={24} className={cn('rounded-full', className)} delay={delay} />;
}
