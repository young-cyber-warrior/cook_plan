import { observer } from 'mobx-react-lite';

import { RecipeCollage } from '@/features/day-card/components/recipe-collage';
import { useRecipesStore } from '@/stores/store-context';

interface RecipePhotoCollageProps {
  recipeId: string;
}

/** Photos that have not been downloaded yet have no local file to show. */
export const RecipePhotoCollage = observer(function RecipePhotoCollage({
  recipeId,
}: RecipePhotoCollageProps) {
  const store = useRecipesStore();

  return <RecipeCollage photos={store.photosOf(recipeId).flatMap(photo => photo.local_uri ?? [])} />;
});
