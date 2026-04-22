import React from 'react';
import { Image, View } from 'react-native';
import { Text } from './Text';
import { cn } from '@/lib/utils/cn';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASS: Record<Size, string> = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const SIZE_TEXT_VARIANT: Record<Size, 'caption1' | 'subhead' | 'body' | 'title2'> = {
  sm: 'caption1',
  md: 'subhead',
  lg: 'body',
  xl: 'title2',
};

export interface AvatarProps {
  src?: string;
  initials?: string;
  size?: Size;
  className?: string;
}

export function Avatar({ src, initials, size = 'md', className }: AvatarProps) {
  return (
    <View
      className={cn(
        'rounded-full bg-primary/10 items-center justify-center overflow-hidden',
        SIZE_CLASS[size],
        className
      )}
    >
      {src ? (
        <Image source={{ uri: src }} className="w-full h-full" resizeMode="cover" />
      ) : (
        <Text variant={SIZE_TEXT_VARIANT[size]} weight="bold" color="primary">
          {initials?.slice(0, 2).toUpperCase() ?? '?'}
        </Text>
      )}
    </View>
  );
}
