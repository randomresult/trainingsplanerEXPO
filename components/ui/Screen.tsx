import React from 'react';
import { ScrollView, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils/cn';

type Edge = 'top' | 'bottom' | 'left' | 'right';

export interface ScreenProps extends ViewProps {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  padding?: 'base' | 'none';
}

export function Screen({
  children,
  scroll = false,
  edges = ['top', 'bottom'],
  padding = 'none',
  className,
  style,
  ...rest
}: ScreenProps) {
  const paddingClass = padding === 'base' ? 'px-5' : '';

  if (scroll) {
    return (
      <SafeAreaView edges={edges} className="flex-1 bg-background">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className={cn('flex-1', paddingClass, className)}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={edges} className="flex-1 bg-background">
      <View className={cn('flex-1', paddingClass, className)} style={style} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}
