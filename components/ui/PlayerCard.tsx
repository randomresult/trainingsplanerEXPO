import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { Avatar } from './Avatar';
import { Card } from './Card';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils/cn';
import type { Player } from '@/lib/types/models';

export interface PlayerCardProps {
  player: Player;
  onPress?: () => void;
  trailing?: React.ReactNode;
  compact?: boolean;
  showRemove?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function PlayerCard({
  player,
  onPress,
  trailing,
  compact,
  showRemove,
  onRemove,
  className,
}: PlayerCardProps) {
  const initials =
    (player.firstname?.[0] ?? '') + (player.Name?.[0] ?? '') || '?';
  const fullName = [player.firstname, player.Name].filter(Boolean).join(' ') || 'Spieler';

  return (
    <Card onPress={onPress} className={cn('flex-row items-center gap-3', className)}>
      <Avatar initials={initials} size={compact ? 'sm' : 'md'} />

      <View className="flex-1">
        <Text variant="headline" numberOfLines={1}>
          {fullName}
        </Text>
        {!compact && player.Club?.Name && (
          <Text variant="footnote" color="muted" numberOfLines={1}>
            {player.Club.Name}
          </Text>
        )}
        {player.requiresInviteAcceptance && (
          <View className="flex-row items-center gap-1 mt-0.5">
            <Icon name="lock-closed-outline" size={10} color="warning" />
            <Text variant="caption2" color="warning">
              Einladung ausstehend
            </Text>
          </View>
        )}
      </View>

      {showRemove && onRemove ? (
        <Pressable
          onPress={() => {
            triggerHaptic('medium');
            onRemove();
          }}
          className="w-8 h-8 rounded-full bg-destructive/10 items-center justify-center"
        >
          <Icon name="close" size={16} color="destructive" />
        </Pressable>
      ) : (
        trailing
      )}
    </Card>
  );
}
