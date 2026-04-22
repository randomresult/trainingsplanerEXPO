import React from 'react';
import { View } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { Avatar } from './Avatar';
import { Card } from './Card';
import { Badge } from './Badge';
import { cn } from '@/lib/utils/cn';
import type { Training } from '@/lib/types/models';

export type TrainingCardVariant = 'hero' | 'compact';

export interface TrainingCardProps {
  training: Training;
  variant: TrainingCardVariant;
  onPress?: () => void;
  className?: string;
}

function formatDate(iso: string): { eyebrow: string; meta: string } {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const dateStr = d.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  if (sameDay(d, today)) return { eyebrow: 'Heute', meta: dateStr };
  if (sameDay(d, tomorrow)) return { eyebrow: 'Morgen', meta: dateStr };
  return { eyebrow: dateStr, meta: dateStr };
}

export function TrainingCard({ training, variant, onPress, className }: TrainingCardProps) {
  const isActive = training.training_status === 'in_progress';
  const isCompleted = training.training_status === 'completed';
  const { eyebrow } = formatDate(training.Date);

  const playersToShow = training.players?.slice(0, variant === 'hero' ? 5 : 3) ?? [];
  const extraPlayers = (training.players?.length ?? 0) - playersToShow.length;

  const ctaLabel = isActive ? 'Fortsetzen' : isCompleted ? 'Ansehen' : 'Öffnen';

  if (variant === 'hero') {
    return (
      <Card
        onPress={onPress}
        className={cn(
          'overflow-hidden bg-primary/10 border-primary/30',
          className
        )}
      >
        {isActive && (
          <View className="absolute top-4 right-4">
            <Badge variant="warning-soft">Läuft</Badge>
          </View>
        )}

        <Text variant="subhead" color="primary" weight="semibold" className="mb-1">
          {eyebrow}
        </Text>
        <Text variant="title1" weight="bold" className="mb-3 pr-20">
          {training.Name}
        </Text>

        {playersToShow.length > 0 && (
          <View className="flex-row items-center mb-4">
            {playersToShow.map((p, idx) => (
              <View
                key={p.documentId}
                className={idx > 0 ? '-ml-2' : ''}
                style={{ zIndex: playersToShow.length - idx }}
              >
                <Avatar
                  initials={(p.firstname?.[0] ?? '') + (p.Name?.[0] ?? '')}
                  size="md"
                  className="border-2 border-background"
                />
              </View>
            ))}
            {extraPlayers > 0 && (
              <View className="-ml-2 w-12 h-12 rounded-full bg-muted items-center justify-center border-2 border-background">
                <Text variant="caption1" weight="bold" color="foreground">
                  +{extraPlayers}
                </Text>
              </View>
            )}
          </View>
        )}

        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Icon name="people-outline" size={14} color="muted" />
              <Text variant="footnote" color="muted">
                {training.players?.length ?? 0}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Icon name="fitness-outline" size={14} color="muted" />
              <Text variant="footnote" color="muted">
                {training.exercises?.length ?? 0}
              </Text>
            </View>
          </View>
          <Text variant="subhead" weight="semibold" color="primary">
            {ctaLabel} →
          </Text>
        </View>
      </Card>
    );
  }

  // compact
  return (
    <Card onPress={onPress} className={cn('', className)}>
      {isActive && (
        <View className="absolute top-3 right-3">
          <Badge variant="warning-soft">Läuft</Badge>
        </View>
      )}
      {isCompleted && (
        <View className="absolute top-3 right-3">
          <Icon name="checkmark-circle" size={18} color="success" />
        </View>
      )}

      <Text variant="caption1" color="muted" className="mb-0.5">
        {eyebrow}
      </Text>
      <Text variant="headline" className="mb-2 pr-16">
        {training.Name}
      </Text>

      {playersToShow.length > 0 && (
        <View className="flex-row items-center mb-2">
          {playersToShow.map((p, idx) => (
            <View
              key={p.documentId}
              className={idx > 0 ? '-ml-1.5' : ''}
              style={{ zIndex: playersToShow.length - idx }}
            >
              <Avatar
                initials={(p.firstname?.[0] ?? '') + (p.Name?.[0] ?? '')}
                size="sm"
                className="border-2 border-background"
              />
            </View>
          ))}
          {extraPlayers > 0 && (
            <View className="-ml-1.5 w-8 h-8 rounded-full bg-muted items-center justify-center border-2 border-background">
              <Text variant="caption2" weight="bold" color="foreground">
                +{extraPlayers}
              </Text>
            </View>
          )}
        </View>
      )}

      <View className="flex-row items-center gap-3">
        <View className="flex-row items-center gap-1">
          <Icon name="people-outline" size={12} color="muted" />
          <Text variant="caption1" color="muted">
            {training.players?.length ?? 0}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Icon name="fitness-outline" size={12} color="muted" />
          <Text variant="caption1" color="muted">
            {training.exercises?.length ?? 0} Übungen
          </Text>
        </View>
      </View>
    </Card>
  );
}
