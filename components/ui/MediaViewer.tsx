import React from 'react';
import { Modal, Pressable, View, Image } from 'react-native';
import { Icon } from './Icon';

export interface MediaViewerProps {
  uri: string | null;
  onClose: () => void;
}

export function MediaViewer({ uri, onClose }: MediaViewerProps) {
  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 bg-black/90 items-center justify-center">
        {uri && (
          <Image
            source={{ uri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        )}
        <Pressable
          onPress={onClose}
          className="absolute top-12 right-5 w-10 h-10 rounded-full bg-black/60 items-center justify-center"
        >
          <Icon name="close" size={20} color="foreground" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
