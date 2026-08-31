import { observer } from 'mobx-react-lite';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { MacroBreakdown } from '@/components/macro-breakdown';
import { servingsWord } from '@/features/day-card/lib/servings';
import type { Recipe } from '@/features/recipes/types';
import { useSyncStore } from '@/stores/store-context';

interface MacrosBlockProps {
  recipe: Recipe;
}

export const MacrosBlock = observer(function MacrosBlock({ recipe }: MacrosBlockProps) {
  const { connected } = useSyncStore();
  const { macrosStatus, macrosError, macros } = recipe;
  const unknownCount = recipe.ingredients.filter(ingredient => !ingredient.recognized).length;

  const note = (() => {
    if (macrosStatus === 'pending') {
      return connected ? 'Считаем по ингредиентам…' : 'Нет сети — посчитаем при подключении';
    }
    if (macrosStatus === 'partial') {
      return `Без ${unknownCount} непонятных продуктов — они отмечены в списке`;
    }
    if (macrosStatus === 'failed') {
      return macrosError || 'Не удалось посчитать. Уточни названия продуктов';
    }
    if (macrosStatus === 'idle') return 'Добавь ингредиенты, чтобы посчитать';
    return '';
  })();

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>Пищевая ценность</Text>

      <View style={styles.numbers(macrosStatus === 'pending')}>
        <Text style={styles.calories}>{macros.calories} ккал</Text>
        {recipe.servings > 1 ? (
          <Text style={styles.perServing}>
            {Math.round(macros.calories / recipe.servings)} ккал в порции · {recipe.servings}{' '}
            {servingsWord(recipe.servings)}
          </Text>
        ) : null}
        <MacroBreakdown macros={macros} />
      </View>

      {note ? <Text style={styles.note(macrosStatus === 'failed')}>{note}</Text> : null}
    </View>
  );
});

const DANGER = '#E5484D';

const styles = StyleSheet.create(theme => ({
  root: {
    gap: theme.spacing.two,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.three,
    backgroundColor: `${theme.colors.success}14`,
  },
  heading: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  numbers: (pending: boolean) => ({
    gap: theme.spacing.two,
    opacity: pending ? 0.4 : 1,
  }),
  calories: {
    ...theme.typography.macroValue,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
  },
  perServing: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textSecondary,
  },
  note: (failed: boolean) => ({
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: failed ? DANGER : theme.colors.textSecondary,
  }),
}));
