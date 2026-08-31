import { Image } from 'expo-image';
import { observer } from 'mobx-react-lite';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import {
  capturePhoto,
  MAX_RECIPE_PHOTOS,
  pickPhoto,
} from '@/features/recipes/lib/photo-pipeline';
import { useRecipesStore } from '@/stores/store-context';

interface RecipePhotoEditorProps {
  recipeId: string;
  editing: boolean;
}

export const RecipePhotoEditor = observer(function RecipePhotoEditor({
  recipeId,
  editing,
}: RecipePhotoEditorProps) {
  const store = useRecipesStore();
  const photos = store.photosOf(recipeId);

  if (photos.length === 0 && !editing) return null;

  const canAdd = editing && photos.length < MAX_RECIPE_PHOTOS;

  const addFromLibrary = async () => {
    // где обратобка ошибок

    const source = await pickPhoto();
    if (source) store.addPhoto(recipeId, source);
  };

  const addFromCamera = async () => {
    // где обратобка ошибок
    const source = await capturePhoto();
    if (source) store.addPhoto(recipeId, source);
  };

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        {photos.map(photo => (
          <View key={photo.id} style={styles.tile}>
            {photo.local_uri ? (
              <Image source={{ uri: photo.local_uri }} style={styles.image} contentFit="cover" />
            ) : (
              <View style={styles.placeholder}>
                <ActivityIndicator />
              </View>
            )}
            {/* используй && */}
            {editing ? (
              <Pressable style={styles.remove} onPress={() => store.removePhoto(photo.id)}>
                <Text style={styles.removeLabel}>✕</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>
            {/* используй && */}

      {canAdd ? (
        <View style={styles.actions}>
          <Pressable onPress={addFromLibrary}>
            <Text style={styles.action}>Из галереи</Text>
          </Pressable>
          <Pressable onPress={addFromCamera}>
            <Text style={styles.action}>Снять</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
});

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
