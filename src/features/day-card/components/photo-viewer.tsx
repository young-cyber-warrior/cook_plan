import { useCallback, useState } from 'react';
import { FlatList, Modal, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Image } from 'expo-image';

interface PhotoViewerProps {
  photos: string[];
  visible: boolean;
  initialIndex?: number;
  onClose: () => void;
}

/** Fullscreen pager opened from the meal collage. */
export function PhotoViewer({ photos, visible, initialIndex = 0, onClose }: PhotoViewerProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initialIndex);

  const onScrollEnd = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
    },
    [width],
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.root}>
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={onScrollEnd}
          keyExtractor={uri => uri}
          renderItem={({ item }) => (
            <Image
              source={item}
              style={{ width, height }}
              contentFit="contain"
              transition={150}
            />
          )}
        />

        <Pressable
          style={({ pressed }) => styles.close(pressed, insets.top)}
          hitSlop={8}
          onPress={onClose}>
          <Text style={styles.closeSign}>✕</Text>
        </Pressable>

        <View style={[styles.counter, { bottom: insets.bottom + 24 }]}>
          <Text style={styles.counterText} allowFontScaling={false}>
            {index + 1}/{photos.length}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  close: (pressed: boolean, top: number) => ({
    position: 'absolute',
    top: top + theme.spacing.three,
    right: theme.spacing.three,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    backgroundColor: pressed ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.16)',
  }),
  closeSign: {
    ...theme.typography.sectionTitle,
    color: '#FFFFFF',
  },
  counter: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.three,
    paddingVertical: theme.spacing.one,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  counterText: {
    ...theme.typography.label,
    color: '#FFFFFF',
  },
}));
