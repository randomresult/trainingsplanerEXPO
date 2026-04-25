// lib/animations.ts
import { Easing } from 'react-native-reanimated';

export const springConfig = {
  damping: 15,
  stiffness: 120,
  mass: 1,
};

export const layoutSpringConfig = {
  damping: 18,
  stiffness: 140,
};

export const shimmerConfig = {
  duration: 1200,
  easing: Easing.inOut(Easing.ease),
};

export const scrollBlurConfig = {
  scrollThreshold: 100, // pixels to fully opaque
  blurIntensity: 80,
};
