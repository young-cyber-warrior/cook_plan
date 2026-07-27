import { memo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Image } from 'expo-image';

import { PhotoViewer } from '@/features/day-card/components/photo-viewer';

/** Sketch calls for three thumbnails; extras stay behind the viewer. */
const VISIBLE = 3;
const THUMB = 44;
/** Heavier overlap now that the stack fans out instead of lying flat. */
const OVERLAP = 34;
/** Degrees between neighbouring cards; the stack pivots around its base. */
const FAN_STEP = 12;

interface RecipeCollageProps {
  photos: string[];
}

/** Center card stays upright, siblings fan out symmetrically. */
const fanAngle = (index: number) => (index - (VISIBLE - 1) / 2) * FAN_STEP;

/** Overlapping thumbnail stack fanned like a hand of cards. Tap opens the pager. */
export const RecipeCollage = memo(function RecipeCollage({ photos }: RecipeCollageProps) {
  const [viewerOpen, setViewerOpen] = useState(false);

  if (photos.length === 0) return null;

  return (
    <>
      <Pressable
        style={({ pressed }) => styles.root(pressed)}
        onPress={() => setViewerOpen(true)}>
        {photos.slice(0, VISIBLE).map((uri, index) => (
          <View key={uri} style={styles.slot(index)}>
            <Image source={uri} style={styles.photo} contentFit="cover" transition={150} />
          </View>
        ))}
      </Pressable>

      <PhotoViewer
        photos={photos}
        visible={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
});

const styles = StyleSheet.create(theme => ({
  root: (pressed: boolean) => ({
    flexDirection: 'row',
    alignItems: 'center',
    opacity: pressed ? 0.7 : 1,
  }),
  /** Each next thumbnail slides left over the previous one and tilts outward. */
  slot: (index: number) => ({
    width: THUMB,
    height: THUMB,
    marginLeft: index === 0 ? 0 : -OVERLAP,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.card,
    overflow: 'hidden',
    zIndex: index,
    /* Pivot around the bottom edge so the cards splay like a fan. */
    transformOrigin: 'bottom center',
    transform: [{ rotate: `${fanAngle(index)}deg` }],
  }),
  photo: {
    width: '100%',
    height: '100%',
  },
}));
