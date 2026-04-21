import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticStrength = 'light' | 'medium' | 'heavy' | 'selection' | 'off';

export function triggerHaptic(strength: HapticStrength = 'light') {
  if (strength === 'off') return;
  if (Platform.OS === 'web') return;
  try {
    if (strength === 'selection') {
      Haptics.selectionAsync();
      return;
    }
    const map = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    } as const;
    Haptics.impactAsync(map[strength]);
  } catch {
    // no-op — haptics best-effort
  }
}
