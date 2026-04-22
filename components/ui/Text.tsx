import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { cn } from '@/lib/utils/cn';

export type TextVariant =
  | 'largeTitle'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'body'
  | 'callout'
  | 'subhead'
  | 'footnote'
  | 'caption1'
  | 'caption2';

export type TextColor =
  | 'foreground'
  | 'muted'
  | 'primary'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'info'
  | 'inverse';

export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  weight?: TextWeight;
}

const VARIANT_CLASS: Record<TextVariant, string> = {
  largeTitle: 'text-largeTitle',
  title1: 'text-title1',
  title2: 'text-title2',
  title3: 'text-title3',
  headline: 'text-headline',
  body: 'text-body',
  callout: 'text-callout',
  subhead: 'text-subhead',
  footnote: 'text-footnote',
  caption1: 'text-caption1',
  caption2: 'text-caption2',
};

const COLOR_CLASS: Record<TextColor, string> = {
  foreground: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  destructive: 'text-destructive',
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info',
  inverse: 'text-background',
};

const WEIGHT_CLASS: Record<TextWeight, string> = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export function Text({
  variant = 'body',
  color = 'foreground',
  weight,
  className,
  ...rest
}: TextProps) {
  return (
    <RNText
      className={cn(
        VARIANT_CLASS[variant],
        COLOR_CLASS[color],
        weight && WEIGHT_CLASS[weight],
        className
      )}
      {...rest}
    />
  );
}
