/**
 * Hex color constants for prop-based styling (ActivityIndicator, tab bar,
 * Icon component, etc.). Keep in sync with tailwind.config.js color tokens.
 */
export const COLORS = {
  primary:     '#92e846',   // hsl(89, 79%, 59%)  — Apple Fitness Exercise lime
  success:     '#30d158',   // hsl(135, 62%, 51%) — Apple Systems Green
  warning:     '#f59e0b',
  destructive: '#ef4444',
  info:        '#0ea5e9',
  foreground:  '#ffffff',
  muted:       '#999999',
  inverse:     '#0a0a0f',
  background:  '#0a0a0f',
} as const;
