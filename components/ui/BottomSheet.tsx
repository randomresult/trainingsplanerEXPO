import React, { useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Pressable } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Text } from './Text';
import { Icon } from './Icon';
import { triggerHaptic } from '@/lib/haptics';

export interface BottomSheetRef {
  present: () => void;
  dismiss: () => void;
}

export interface BottomSheetProps {
  snapPoints?: (string | number)[];
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
}

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(function BottomSheet(
  { snapPoints = ['50%', '90%'], title, children, onDismiss },
  ref
) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const memoSnap = useMemo(() => snapPoints, [snapPoints]);

  useImperativeHandle(ref, () => ({
    present: () => sheetRef.current?.present(),
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.55}
      />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={memoSnap}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: 'hsl(0, 0%, 10%)' }}
      handleIndicatorStyle={{ backgroundColor: 'hsl(0, 0%, 40%)' }}
      onDismiss={onDismiss}
    >
      <BottomSheetView className="flex-1 px-5">
        {title && (
          <View className="flex-row items-center justify-between pt-2 pb-4 border-b border-border mb-4">
            <Text variant="title2" weight="bold">
              {title}
            </Text>
            <Pressable
              onPress={() => {
                triggerHaptic('light');
                sheetRef.current?.dismiss();
              }}
              className="w-8 h-8 rounded-full bg-surface-1 items-center justify-center"
            >
              <Icon name="close" size={16} color="muted" />
            </Pressable>
          </View>
        )}
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
});
