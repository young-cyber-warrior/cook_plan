import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

interface AddRecipeContextValue {
  visible: boolean;
  open: () => void;
  close: () => void;
}

const AddRecipeContext = createContext<AddRecipeContextValue | null>(null);

/**
 * Lives at the app root because the trigger (Navbar) and the sheet (RecipesScreen)
 * sit in different branches of the tree — Navbar renders above the tab Stack, not inside it.
 */
export function AddRecipeProvider({ children }: PropsWithChildren) {
  const [visible, setVisible] = useState(false);

  const value = useMemo<AddRecipeContextValue>(
    () => ({ visible, open: () => setVisible(true), close: () => setVisible(false) }),
    [visible],
  );

  return <AddRecipeContext.Provider value={value}>{children}</AddRecipeContext.Provider>;
}

export function useAddRecipeContext(): AddRecipeContextValue {
  const context = useContext(AddRecipeContext);
  if (!context) throw new Error('useAddRecipeContext must be used within AddRecipeProvider');
  return context;
}
