import { useCallback } from 'react';

import { capturePhoto, pickPhoto, type PhotoSource } from '@/features/recipes/lib/photo-pipeline';
import { useErrorsStore } from '@/stores/store-context';

/** Picking can throw on a denied permission or a broken asset — the caller only sees a source or nothing. */
export function usePhotoPicker(onPicked: (source: PhotoSource) => void) {
  const errors = useErrorsStore();

  const run = useCallback(
    async (source: string, pick: () => Promise<PhotoSource | null>) => {
      try {
        const picked = await pick();
        if (picked) onPicked(picked);
      } catch (cause) {
        errors.notify(source, cause);
      }
    },
    [errors, onPicked],
  );

  return {
    pick: useCallback(() => void run('recipes.pickPhoto', pickPhoto), [run]),
    capture: useCallback(() => void run('recipes.capturePhoto', capturePhoto), [run]),
  };
}
