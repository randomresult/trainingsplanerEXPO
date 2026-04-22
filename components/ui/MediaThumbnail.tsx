import React from 'react';
import { Pressable, View, Image } from 'react-native';
import { Icon } from './Icon';

export interface MediaThumbnailProps {
  uri: string;
  kind: 'image' | 'video';
  onPress?: () => void;
}

export function MediaThumbnail({ uri, kind, onPress }: MediaThumbnailProps) {
  return (
    <Pressable onPress={onPress} className="rounded-lg overflow-hidden bg-muted">
      <View style={{ width: 120, height: 80 }}>
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        {kind === 'video' && (
          <View className="absolute inset-0 items-center justify-center bg-black/30">
            <Icon name="play" size={24} color="foreground" />
          </View>
        )}
      </View>
    </Pressable>
  );
}
