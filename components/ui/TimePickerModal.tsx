import React, { useState, useEffect } from 'react';
import { Modal, View, Pressable } from 'react-native';
import { Text } from './Text';
import { Button } from './Button';
import { triggerHaptic } from '@/lib/haptics';

interface TimePickerModalProps {
  visible: boolean;
  value: number;
  onClose: () => void;
  onConfirm: (minutes: number) => void;
}

const PRESETS = [5, 10, 15, 20, 30, 45];

export function TimePickerModal({ visible, value, onClose, onConfirm }: TimePickerModalProps) {
  const [minutes, setMinutes] = useState(value);

  useEffect(() => {
    if (visible) setMinutes(value);
  }, [visible, value]);

  const adjust = (delta: number) => {
    triggerHaptic('light');
    setMinutes((m) => Math.max(0, Math.min(180, m + delta)));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable onPress={() => {}} style={{ backgroundColor: '#1c1c1e', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}>
          {/* Drag handle */}
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 20 }} />

          {/* Large value display */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <Text variant="largeTitle" weight="bold" style={{ fontSize: 72, lineHeight: 80 }}>
              {minutes}
            </Text>
            <Text variant="subhead" color="muted">Minuten</Text>
          </View>

          {/* +/- buttons */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 }}>
            <Pressable
              onPress={() => adjust(-5)}
              style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#2c2c2e', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text variant="headline" weight="semibold">−5</Text>
            </Pressable>
            <Pressable
              onPress={() => adjust(-1)}
              style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#2c2c2e', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text variant="body" weight="semibold">−1</Text>
            </Pressable>
            <Pressable
              onPress={() => adjust(1)}
              style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#2c2c2e', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text variant="body" weight="semibold">+1</Text>
            </Pressable>
            <Pressable
              onPress={() => adjust(5)}
              style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#2c2c2e', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text variant="headline" weight="semibold">+5</Text>
            </Pressable>
          </View>

          {/* Preset chips */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
            {PRESETS.map((p) => {
              const active = minutes === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => { triggerHaptic('light'); setMinutes(p); }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: active ? '#007aff' : 'rgba(255,255,255,0.15)',
                    backgroundColor: active ? 'rgba(0,122,255,0.15)' : 'transparent',
                  }}
                >
                  <Text variant="subhead" weight="semibold" color={active ? 'primary' : 'muted'}>
                    {p} min
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Button size="lg" onPress={() => { triggerHaptic('medium'); onConfirm(minutes); }}>
            Fertig
          </Button>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
