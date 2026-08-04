import * as Haptics from 'expo-haptics';
import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import { MOCK_RECIPES } from '@/features/recipes/mock';
import { useWeeksContext } from '@/features/weeks/context/weeks-context';

import { buildGroceryList } from '../lib/build-list';
import type { GroceryList } from '../types';

interface GroceryContextValue {
  list: GroceryList | null;
  sheetVisible: boolean;
  hasEdits: boolean;
  openSheet: () => void;
  closeSheet: () => void;
  generate: (weekIds: string[]) => void;
  refresh: () => void;
  clear: () => void;
  toggleItem: (key: string) => void;
  setItemAmount: (key: string, amount: number) => void;
  removeItem: (key: string) => void;
}

const GroceryContext = createContext<GroceryContextValue | null>(null);

export function GroceryProvider({ children }: PropsWithChildren) {
  const { weeks } = useWeeksContext();
  const [list, setList] = useState<GroceryList | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const value = useMemo<GroceryContextValue>(() => {
    const generate = (weekIds: string[]) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setList(current => buildGroceryList(weeks, weekIds, MOCK_RECIPES, current));
      setSheetVisible(false);
    };

    return {
      list,
      sheetVisible,
      hasEdits: list?.items.some(item => item.edited) ?? false,
      openSheet: () => setSheetVisible(true),
      closeSheet: () => setSheetVisible(false),
      generate,
      refresh: () => list && generate(list.weekIds),
      clear: () => setList(null),

      toggleItem: key => {
        Haptics.selectionAsync();
        setList(current =>
          current && {
            ...current,
            items: current.items.map(item =>
              item.key === key ? { ...item, checked: !item.checked } : item,
            ),
          },
        );
      },

      setItemAmount: (key, amount) =>
        setList(current =>
          current && {
            ...current,
            items: current.items.map(item =>
              item.key === key ? { ...item, amount, edited: true } : item,
            ),
          },
        ),

      removeItem: key =>
        setList(current =>
          current && { ...current, items: current.items.filter(item => item.key !== key) },
        ),
    };
  }, [list, sheetVisible, weeks]);

  return <GroceryContext.Provider value={value}>{children}</GroceryContext.Provider>;
}

export function useGroceryContext(): GroceryContextValue {
  const context = useContext(GroceryContext);
  if (!context) throw new Error('useGroceryContext must be used within GroceryProvider');
  return context;
}
