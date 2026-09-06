import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export interface PhotoTile {
  id: string;
  uri: string | null;
}

interface PhotoTilesProps {
  photos: PhotoTile[];
  editing: boolean;
  canAdd: boolean;
  onRemove: (id: string) => void;
  onPick: () => void;
  onCapture: () => void;
}

/** Photo strip shared by the add-recipe draft and the saved-recipe editor. */
export function PhotoTiles({
  photos,
  editing,
  canAdd,
  onRemove,
  onPick,
  onCapture,
}: PhotoTilesProps) {
  return (
    <View style={styles.root}>
      <View style={styles.row}>
        {photos.map(photo => (
          <View key={photo.id} style={styles.tile}>
            {photo.uri ? (
              <Image source={{ uri: photo.uri }} style={styles.image} contentFit="cover" />
            ) : (
              <View style={styles.placeholder}>
                <ActivityIndicator />
              </View>
            )}

            {editing && (
              <Pressable style={styles.remove} onPress={() => onRemove(photo.id)}>
                <Text style={styles.removeLabel}>✕</Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>

      {canAdd && (
        <View style={styles.actions}>
          <Pressable onPress={onPick}>
            <Text style={styles.action}>Из галереи</Text>
          </Pressable>
          <Pressable onPress={onCapture}>
            <Text style={styles.action}>Снять</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    gap: theme.spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.two,
  },
  tile: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.backgroundElement,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remove: {
    position: 'absolute',
    top: theme.spacing.one,
    right: theme.spacing.one,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.card,
  },
  removeLabel: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.three,
  },
  action: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.accent,
  },
}));
