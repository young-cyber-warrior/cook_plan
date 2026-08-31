import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { RootStore } from './root-store';

const StoreContext = createContext<RootStore | null>(null);

export function StoreProvider({ children }: PropsWithChildren) {
  const [store] = useState(() => new RootStore());

  useEffect(() => {
    store.init();
    return () => store.dispose();
  }, [store]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useRootStore(): RootStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useRootStore must be used within StoreProvider');
  return store;
}

export function useAuthStore() {
  return useRootStore().auth;
}

export function useErrorsStore() {
  return useRootStore().errors;
}

export function useWeeksStore() {
  return useRootStore().weeks;
}

export function useRecipesStore() {
  return useRootStore().recipes;
}

export function useGroceryStore() {
  return useRootStore().grocery;
}

export function useFamilyStore() {
  return useRootStore().family;
}
