import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import { PhotoTiles } from '@/features/recipes/components/photo-tiles';
import { usePhotoPicker } from '@/features/recipes/hooks/use-photo-picker';
import { MAX_RECIPE_PHOTOS, type PhotoSource } from '@/features/recipes/lib/photo-pipeline';
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

  const onPicked = useCallback(
    (source: PhotoSource) => store.addPhoto(recipeId, source),
    [store, recipeId],
  );
  const { pick, capture } = usePhotoPicker(onPicked);

  /** Outside edit mode the photos live in the card header as a collage. */
  if (!editing) return null;

  return (
    <PhotoTiles
      photos={photos.map(photo => ({ id: photo.id, uri: photo.local_uri }))}
      editing
      canAdd={photos.length < MAX_RECIPE_PHOTOS}
      onRemove={store.removePhoto}
      onPick={pick}
      onCapture={capture}
    />
  );
});
