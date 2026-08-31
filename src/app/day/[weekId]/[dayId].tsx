import { router, useLocalSearchParams, type Href } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { MacroBreakdown } from '@/components/macro-breakdown';
import { DayActionsBar } from '@/features/day-card/components/day-actions-bar';
import { DayExtraRow } from '@/features/day-card/components/day-extra-row';
import { DayExtraSheet } from '@/features/day-card/components/day-extra-sheet';
import { PersonalMealRow } from '@/features/day-card/components/personal-meal-row';
import { usePersonalDay } from '@/features/day-card/hooks/use-personal-day';
import { servingMacros } from '@/features/day-card/lib/extra-units';
import { dayMacros, hasPersonalEdits, personalDelta } from '@/features/day-card/lib/nutrition';
import type { DayExtra } from '@/features/day-card/types';
import type { DateId } from '@/features/weeks/lib/dates';
import type { DayExtraInput } from '@/stores/personal-store';
import { useMealPickStore, usePersonalStore } from '@/stores/store-context';

const formatDelta = (delta: number) => `${delta > 0 ? '+' : '−'}${Math.abs(delta)} ккал`;

export default observer(function PersonalDayScreen() {
  const { weekId, dayId } = useLocalSearchParams<{ weekId: string; dayId: DateId }>();
  const { addExtra, removeExtra, resetDay, resetMeal, setMealServings, setMealSkipped, updateExtra } =
    usePersonalStore();
  const { startForDay, startForMeal } = useMealPickStore();
  const { day, personal } = usePersonalDay(weekId, dayId);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editing, setEditing] = useState<DayExtra | null>(null);

  const origin: Href = { pathname: '/day/[weekId]/[dayId]', params: { weekId, dayId } };

  const openRecipes = () => {
    startForDay(weekId, dayId, origin);
    router.navigate('/recipes');
  };

  const openSheet = (extra: DayExtra | null) => {
    setEditing(extra);
    setSheetVisible(true);
  };

  const setExtraServings = (extra: DayExtra, servings: number) => {
    updateExtra(extra.id, {
      name: extra.name,
      amount: servings,
      unit: extra.unit,
      macros: servingMacros(extra, servings),
    });
  };

  const submitExtra = (input: DayExtraInput) => {
    if (editing) updateExtra(editing.id, input);
    else addExtra(weekId, dayId, input);
  };

  if (!day) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>День не найден.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.action}>Назад</Text>
        </Pressable>
      </View>
    );
  }

  const macros = dayMacros(day, personal);
  const edited = hasPersonalEdits(day, personal);
  const delta = personalDelta(day, personal);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.action}>Назад</Text>
          </Pressable>
          {edited ? (
            <Pressable onPress={() => resetDay(weekId, dayId, day.meals.map(meal => meal.id))}>
              <Text style={styles.reset}>Сбросить правки</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>{day.weekday}</Text>
          <View style={styles.headline}>
            <Text style={styles.title}>Мой итог</Text>
            <Text style={styles.calories}>
              {macros.calories}
              <Text style={styles.unit}> ккал</Text>
            </Text>
          </View>

          <MacroBreakdown macros={macros} />

          {edited && delta !== 0 ? (
            <Text style={styles.delta}>{formatDelta(delta)} к плану семьи</Text>
          ) : null}
        </View>

        <Text style={styles.label}>Приёмы пищи</Text>

        {day.meals.map(meal => (
          <PersonalMealRow
            key={meal.id}
            meal={meal}
            adjustment={personal.adjustmentByMealId.get(meal.id)}
            onServingsChange={servings => setMealServings(meal.id, servings)}
            onSkippedChange={skipped => setMealSkipped(meal.id, skipped)}
            onReset={() => resetMeal(meal.id)}
            onPickRecipe={() => {
              startForMeal(meal, origin);
              router.navigate('/recipes');
            }}
          />
        ))}

        <Text style={styles.label}>Моё сверх плана</Text>

        {personal.extras.length === 0 ? (
          <Text style={styles.empty}>Ничего не добавлено.</Text>
        ) : (
          personal.extras.map(extra => (
            <DayExtraRow
              key={extra.id}
              extra={extra}
              onPress={() => openSheet(extra)}
              onServingsChange={servings => setExtraServings(extra, servings)}
              onRemove={() => removeExtra(extra.id)}
            />
          ))
        )}
      </ScrollView>

      <DayActionsBar onAddExtra={() => openSheet(null)} onOpenRecipes={openRecipes} />

      <DayExtraSheet
        visible={sheetVisible}
        extra={editing}
        onClose={() => setSheetVisible(false)}
        onSubmit={submitExtra}
      />
    </View>
  );
});

const styles = StyleSheet.create(theme => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    gap: theme.spacing.three,
    padding: theme.spacing.three,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.three,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  block: {
    gap: theme.spacing.three,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.three,
    backgroundColor: theme.colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.cardBorder,
  },
  label: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  headline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing.three,
  },
  title: {
    ...theme.typography.sectionTitle,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
  },
  calories: {
    ...theme.typography.macroValue,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
  },
  unit: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  delta: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.accent,
  },
  empty: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
  },
  message: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
  },
  action: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.accent,
  },
  reset: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
  },
}));
