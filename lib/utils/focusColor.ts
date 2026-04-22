export type FocusColor =
  | 'primary'
  | 'info'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'muted';

const PALETTE: FocusColor[] = [
  'primary',
  'info',
  'success',
  'warning',
  'destructive',
  'muted',
];

export function focusColorFromName(name: string | undefined | null): FocusColor {
  if (!name) return 'muted';
  const normalized = name.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash + normalized.charCodeAt(i)) % PALETTE.length;
  }
  return PALETTE[hash];
}
