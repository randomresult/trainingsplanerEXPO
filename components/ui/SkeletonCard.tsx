// components/ui/SkeletonCard.tsx
import React from 'react';
import { View } from 'react-native';
import { SkeletonLine, SkeletonPill } from './Skeleton';

interface SkeletonCardProps {
  delay?: number;
}

export function SkeletonCard({ delay = 0 }: SkeletonCardProps) {
  return (
    <View className="bg-card p-4 rounded-xl border border-border">
      <SkeletonLine width="60%" height={20} className="mb-2" delay={delay} />
      <SkeletonLine width="40%" height={16} className="mb-4" delay={delay} />
      <View className="flex-row gap-2">
        <SkeletonPill width={60} delay={delay} />
        <SkeletonPill width={80} delay={delay} />
      </View>
    </View>
  );
}

interface SkeletonListProps {
  count?: number;
  stagger?: boolean;
}

export function SkeletonList({ count = 5, stagger = true }: SkeletonListProps) {
  return (
    <View className="gap-3">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <SkeletonCard key={i} delay={stagger ? i * 100 : 0} />
        ))}
    </View>
  );
}

export function SkeletonDetail({ delay = 0 }: { delay?: number }) {
  return (
    <View>
      <SkeletonLine width="80%" height={28} className="mb-2" delay={delay} />
      <SkeletonLine width="50%" height={16} className="mb-4" delay={delay} />
      <View className="flex-row gap-2 flex-wrap">
        <SkeletonPill width={70} delay={delay} />
        <SkeletonPill width={90} delay={delay + 50} />
        <SkeletonPill width={60} delay={delay + 100} />
      </View>
    </View>
  );
}
