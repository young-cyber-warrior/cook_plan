import type { ComponentType } from 'react';
import { usePathname } from 'expo-router';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { RecipesNavbarContent } from '@/features/recipes/components/recipes-navbar-content';

const CONTENT_BY_PATH: Record<string, ComponentType> = {
  '/recipes': RecipesNavbarContent,
};

export function Navbar() {
  const pathname = usePathname();
  const Content = CONTENT_BY_PATH[pathname];

  return <View style={styles.root}>{Content ? <Content /> : null}</View>;
}

const styles = StyleSheet.create((theme, rt) => ({
  root: {
    height: 56 + rt.insets.top,
    paddingTop: rt.insets.top,
    backgroundColor: theme.colors.primary,
  },
}));
