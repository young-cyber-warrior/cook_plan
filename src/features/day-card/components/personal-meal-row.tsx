import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ServingsStepper } from '@/features/day-card/components/servings-stepper';
import { effectiveServings, mealMacros } from '@/features/day-card/lib/nutrition';
import type { Meal, MealAdjustment } from '@/features/day-card/types';

interface PersonalMealRowProps {
  meal: Meal;
  adjustment?: MealAdjustment;
  onServingsChange: (servings: number) => void;
  onSkippedChange: (skipped: boolean) => void;
  onReset: () => void;
  onPickRecipe: () => void;
}

/** One family meal seen through the current user's personal patch. */
export function PersonalMealRow({
  meal,
  adjustment,
  onServingsChange,
  onSkippedChange,
  onReset,
  onPickRecipe,
}: PersonalMealRowProps) {
  const skipped = adjustment?.skipped ?? false;
  const macros = mealMacros(meal, adjustment);
  const edited = adjustment !== undefined;
// сложный компоет упросить и разделить
  return (
    <View style={styles.root(skipped)}>
      <View style={styles.titleRow}>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {meal.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {meal.recipe ? meal.recipe.title : 'Рецепт не выбран'}
          </Text>
        </View>

        <Text style={styles.calories(skipped)}>{macros.calories} ккал</Text>
      </View>

      {meal.recipe ? (
        <View style={styles.controlRow}>
          {skipped ? (
            <Pressable onPress={() => onSkippedChange(false)} hitSlop={6}>
              <Text style={styles.action}>Вернуть в день</Text>
            </Pressable>
          ) : (
            <>
              <ServingsStepper
                value={effectiveServings(meal, adjustment)}
                onChange={onServingsChange}
              />
              <Pressable onPress={() => onSkippedChange(true)} hitSlop={6}>
                <Text style={styles.muted}>Не ел</Text>
              </Pressable>
            </>
          )}

          {edited ? (
            <Pressable onPress={onReset} hitSlop={6}>
              <Text style={styles.muted}>Как у семьи</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Pressable onPress={onPickRecipe} hitSlop={6}>
          <Text style={styles.action}>Выбрать рецепт</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  root: (skipped: boolean) => ({
    gap: theme.spacing.three,
    padding: theme.spacing.three,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.cardBorder,
    backgroundColor: theme.colors.card,
    opacity: skipped ? 0.55 : 1,
  }),
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
  },
  info: {
    flex: 1,
    gap: theme.spacing.half,
  },
  title: {
    ...theme.typography.sectionTitle,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
  },
  subtitle: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
  },
  calories: (skipped: boolean) => ({
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: skipped ? theme.colors.textMuted : theme.colors.text,
    textDecorationLine: skipped ? 'line-through' : 'none',
  }),
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
  },
  action: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.accent,
  },
  muted: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
  },
}));
