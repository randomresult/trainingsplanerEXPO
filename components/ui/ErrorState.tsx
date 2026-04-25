// components/ui/ErrorState.tsx
import React from 'react';
import { View } from 'react-native';
import { Icon } from './Icon';
import { Text } from './Text';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Fehler beim Laden',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Icon name="alert-circle-outline" size={64} color="destructive" />
      <Text variant="headline" className="mt-4 text-center">
        {title}
      </Text>
      <Text variant="body" color="muted" className="mt-2 text-center">
        {message}
      </Text>
      {onRetry && (
        <Button variant="secondary" onPress={onRetry} className="mt-6">
          Erneut versuchen
        </Button>
      )}
    </View>
  );
}
