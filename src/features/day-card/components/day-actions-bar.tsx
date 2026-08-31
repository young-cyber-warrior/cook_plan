import { Pressable, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { PlusIcon } from '@/features/day-card/components/icons';

interface DayActionsBarProps {
  onAddExtra: () => void;
  onOpenRecipes: () => void;
}

/**
 * Day actions are pinned instead of scrolling away with the content: the screen has no tab bar,
 * so this bar is also the only way out to the recipes list once every meal is filled.
 */
export function DayActionsBar({ onAddExtra, onOpenRecipes }: DayActionsBarProps) {
  const { theme } = useUnistyles();

  return (
    <View style={styles.root}>
      <Pressable style={({ pressed }) => styles.recipes(pressed)} onPress={onOpenRecipes}>
        <Text style={styles.recipesLabel}>Рецепты</Text>
      </Pressable>

      <Pressable style={({ pressed }) => styles.add(pressed)} onPress={onAddExtra}>
        <PlusIcon color="#FFFFFF" size={18} />
        <Text style={styles.addLabel} numberOfLines={1}>
          Добавить продукт
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
    paddingHorizontal: theme.spacing.three,
    paddingTop: theme.spacing.three,
    paddingBottom: rt.insets.bottom + theme.spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.cardBorder,
    backgroundColor: theme.colors.card,
    ...theme.shadow.card,
  },
  recipes: (pressed: boolean) => ({
    paddingHorizontal: theme.spacing.three,
    paddingVertical: theme.spacing.three,
    borderRadius: theme.radius.md,
    backgroundColor: pressed ? theme.colors.backgroundElement : 'transparent',
  }),
  recipesLabel: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textSecondary,
  },
  add: (pressed: boolean) => ({
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.two,
    paddingHorizontal: theme.spacing.three,
    paddingVertical: theme.spacing.three,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
    opacity: pressed ? 0.85 : 1,
  }),
  addLabel: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: '#FFFFFF',
  },
}));
