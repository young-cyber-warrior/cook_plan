import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { categoryLabel } from '@/features/recipes/lib/category-label';
import type { RecipeCategory } from '@/features/recipes/types';

const OPTIONS: RecipeCategory[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface CategoryToggleProps {
  value: RecipeCategory;
  onChange: (category: RecipeCategory) => void;
}

/** Category picker for edit mode — same pill language as the ingredient unit toggle. */
export function CategoryToggle({ value, onChange }: CategoryToggleProps) {
  return (
    <View style={styles.root}>
      {OPTIONS.map(option => (
        <Pressable
          key={option}
          style={styles.option(option === value)}
          hitSlop={4}
          onPress={() => onChange(option)}>
          <Text style={styles.label(option === value)}>{categoryLabel(option)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.one,
  },
  option: (active: boolean) => ({
    paddingHorizontal: theme.spacing.two,
    paddingVertical: theme.spacing.half,
    borderRadius: theme.radius.full,
    backgroundColor: active ? theme.colors.accent : theme.colors.badgeBackground,
  }),
  label: (active: boolean) => ({
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: active ? '#FFFFFF' : theme.colors.textSecondary,
  }),
}));
