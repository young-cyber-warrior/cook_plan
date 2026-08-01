import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { PlusIcon } from '@/features/day-card/components/icons';
import { CategoryPromptModal } from '@/features/recipes/components/category-prompt-modal';
import type { Category, RecipeCategory } from '@/features/recipes/types';

interface CategoryToggleProps {
  categories: Category[];
  value: RecipeCategory;
  onChange: (category: RecipeCategory) => void;
  onCreateCategory: (label: string) => Category;
}

/** Category picker for edit mode — same pill language as the ingredient unit toggle. */
export function CategoryToggle({ categories, value, onChange, onCreateCategory }: CategoryToggleProps) {
  const { theme } = useUnistyles();
  const [promptVisible, setPromptVisible] = useState(false);

  return (
    <View style={styles.root}>
      {categories.map(category => (
        <Pressable
          key={category.id}
          style={styles.option(category.id === value)}
          hitSlop={4}
          onPress={() => onChange(category.id)}>
          <Text style={styles.label(category.id === value)}>{category.label}</Text>
        </Pressable>
      ))}

      <Pressable style={({ pressed }) => styles.add(pressed)} hitSlop={4} onPress={() => setPromptVisible(true)}>
        <PlusIcon color={theme.colors.accent} size={11} />
        <Text style={styles.addLabel}>Новая</Text>
      </Pressable>

      <CategoryPromptModal
        visible={promptVisible}
        onCancel={() => setPromptVisible(false)}
        onSubmit={label => {
          const created = onCreateCategory(label);
          onChange(created.id);
          setPromptVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
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
  add: (pressed: boolean) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.half,
    paddingHorizontal: theme.spacing.two,
    paddingVertical: theme.spacing.half,
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.accent,
    opacity: pressed ? 0.7 : 1,
  }),
  addLabel: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.accent,
  },
}));
