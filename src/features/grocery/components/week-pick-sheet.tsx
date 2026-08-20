import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { BottomSheet } from '@/components/bottom-sheet';
import { formatRange, todayId } from '@/features/weeks/lib/dates';
import type { Week } from '@/features/weeks/types';
import { useGroceryStore, useWeeksStore } from '@/stores/store-context';

const filledMealCount = (week: Week) =>
  week.days.flatMap(day => day.meals).filter(meal => meal.recipe).length;

const formatRecipeCount = (count: number) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} рецепт`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${count} рецепта`;
  return `${count} рецептов`;
};

export const WeekPickSheet = observer(function WeekPickSheet() {
  const { weeks } = useWeeksStore();
  const { list, sheetVisible, closeSheet, generate } = useGroceryStore();
  const [pickedIds, setPickedIds] = useState<string[]>([]);

  useEffect(() => {
    // а что здесь происходит чет намуди=рил и очень сложно
    if (!sheetVisible) return;
    const today = todayId();
    const fallback = weeks.filter(week => today >= week.start && today <= week.end);
    const previous = weeks.filter(week => list?.weekIds.includes(week.id));
    setPickedIds((previous.length > 0 ? previous : fallback).map(week => week.id));
  }, [sheetVisible, weeks, list]);

  const togglePicked = (weekId: string) =>
    setPickedIds(current =>
      current.includes(weekId) ? current.filter(id => id !== weekId) : [...current, weekId],
    );
// зачем тодай создавать два раза 
  const today = todayId();

  return (
    <BottomSheet
      visible={sheetVisible}
      onClose={closeSheet}
      header={<Text style={styles.heading}>Какие недели включить?</Text>}>
      {weeks.map(week => {
        const picked = pickedIds.includes(week.id);
        const isCurrent = today >= week.start && today <= week.end;

        return (
          <Pressable key={week.id} style={styles.row(picked)} onPress={() => togglePicked(week.id)}>
            <View style={styles.checkbox(picked)}>
              {picked ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text style={styles.range}>
              {formatRange(week.start, week.end)}
              {isCurrent ? <Text style={styles.current}> · текущая</Text> : null}
            </Text>
            <Text style={styles.meta}>{formatRecipeCount(filledMealCount(week))}</Text>
          </Pressable>
        );
      })}

      <Pressable
        style={({ pressed }) => styles.submit(pressed, pickedIds.length === 0)}
        disabled={pickedIds.length === 0}
        onPress={() => generate(pickedIds)}>
        <Text style={styles.submitLabel}>Сформировать список</Text>
      </Pressable>
    </BottomSheet>
  );
});

const styles = StyleSheet.create(theme => ({
  heading: {
    ...theme.typography.sectionTitle,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
    marginBottom: theme.spacing.two,
  },
  row: (picked: boolean) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
    marginBottom: theme.spacing.two,
    paddingVertical: theme.spacing.three,
    paddingHorizontal: theme.spacing.three,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: picked ? theme.colors.mealFilledBorder : theme.colors.cardBorder,
    backgroundColor: picked ? theme.colors.mealFilled : theme.colors.card,
  }),
  checkbox: (picked: boolean) => ({
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    borderWidth: 2,
    borderColor: picked ? theme.colors.accent : theme.colors.textMuted,
    backgroundColor: picked ? theme.colors.accent : 'transparent',
  }),
  checkmark: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  range: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    flex: 1,
    color: theme.colors.text,
  },
  current: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.accent,
  },
  meta: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
  },
  submit: (pressed: boolean, disabled: boolean) => ({
    alignItems: 'center',
    marginTop: theme.spacing.three,
    marginBottom: theme.spacing.two,
    paddingVertical: theme.spacing.three,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
    opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
  }),
  submitLabel: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}));
