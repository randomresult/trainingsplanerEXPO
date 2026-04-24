// components/ui/Swipeable.tsx
import React, { useRef } from 'react';
import { Animated, View, Pressable } from 'react-native';
import { Swipeable as RNSwipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Icon } from './Icon';
import { Text } from './Text';
import { cn } from '@/lib/utils/cn';

export interface SwipeableProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onRemove?: () => void;
  deleteLabel?: string;
  removeLabel?: string;
}

export function Swipeable({
  children,
  onDelete,
  onRemove,
  deleteLabel = 'Löschen',
  removeLabel = 'Entfernen',
}: SwipeableProps) {
  const swipeableRef = useRef<RNSwipeable>(null);

  const action = onDelete || onRemove;
  const label = onDelete ? deleteLabel : removeLabel;
  const isDestructive = !!onDelete;

  if (!action) {
    return <>{children}</>;
  }

  const renderRightAction = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    const opacity = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Animated.View
        style={{ transform: [{ translateX: trans }], opacity }}
        className="flex-row"
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            swipeableRef.current?.close();
            action();
          }}
          className={cn(
            'justify-center items-center px-6',
            isDestructive ? 'bg-destructive' : 'bg-muted'
          )}
        >
          <Icon
            name={isDestructive ? 'trash-outline' : 'close-outline'}
            size={24}
            color={isDestructive ? 'inverse' : 'foreground'}
          />
          <Text
            variant="footnote"
            className={cn(
              'mt-1',
              isDestructive ? 'text-destructive-foreground' : 'text-foreground'
            )}
          >
            {label}
          </Text>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <RNSwipeable
      ref={swipeableRef}
      renderRightActions={renderRightAction}
      overshootRight={false}
      friction={2}
      onSwipeableWillOpen={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      {children}
    </RNSwipeable>
  );
}
