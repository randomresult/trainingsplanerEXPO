import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { COLORS } from '@/lib/theme';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

type IconColor =
  | 'foreground'
  | 'muted'
  | 'primary'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'info'
  | 'inverse';

const COLOR_HEX: Record<IconColor, string> = {
  foreground: COLORS.foreground,
  muted:      COLORS.muted,
  primary:    COLORS.primary,
  destructive: COLORS.destructive,
  success:    COLORS.success,
  warning:    COLORS.warning,
  info:       COLORS.info,
  inverse:    COLORS.inverse,
};

export interface IconProps {
  name: IoniconsName;
  size?: number;
  color?: IconColor;
}

export function Icon({ name, size = 20, color = 'foreground' }: IconProps) {
  return <Ionicons name={name} size={size} color={COLOR_HEX[color]} />;
}
