import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

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
  foreground: '#ffffff',
  muted: '#999999',
  primary: '#8b5cf6',
  destructive: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
  info: '#0ea5e9',
  inverse: '#0a0a0f',
};

export interface IconProps {
  name: IoniconsName;
  size?: number;
  color?: IconColor;
}

export function Icon({ name, size = 20, color = 'foreground' }: IconProps) {
  return <Ionicons name={name} size={size} color={COLOR_HEX[color]} />;
}
