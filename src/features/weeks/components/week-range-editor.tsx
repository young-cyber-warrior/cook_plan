import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Calendar, LocaleConfig, type DateData } from 'react-native-calendars';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { useWeeksContext } from '../context/weeks-context';
import { maxRangeEnd, occupiedDates, suggestRange } from '../lib/build-week';
import { eachDay, formatDayCount, formatRange, rangeLength } from '../lib/dates';
import type { WeekRange } from '../types';

/* Своя ru-локаль: у react-native-calendars собственный словарь без чтения языка системы.
   Перейдём на автогенерацию через Intl вместе с общей i18n приложения. */
LocaleConfig.locales.ru = {
  monthNames: [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ],
  monthNamesShort: [
    'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
    'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек',
  ],
  dayNames: [
    'Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота',
  ],
  dayNamesShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  today: 'Сегодня',
};
LocaleConfig.defaultLocale = 'ru';

export function WeekRangeEditor() {
  const { theme } = useUnistyles();
  const { weeks, editing, cancelEdit, saveWeek } = useWeeksContext();

  const editedWeek = editing?.weekId ? weeks.find(week => week.id === editing.weekId) : undefined;
  const occupied = useMemo(
    () => occupiedDates(weeks, editedWeek?.id),
    [weeks, editedWeek?.id],
  );

  const [range, setRange] = useState<WeekRange>(() =>
    editedWeek ? { start: editedWeek.start, end: editedWeek.end } : suggestRange(weeks),
  );

  /**
   * First tap (or a tap outside the allowed span) restarts the range: it stretches to 7 days,
   * clipped by the nearest occupied date. A second tap inside the span moves the end.
   */
  const onDayPress = ({ dateString }: DateData) => {
    if (occupied.has(dateString)) return;

    const withinCurrent =
      dateString >= range.start && dateString <= maxRangeEnd(range.start, occupied);

    if (withinCurrent) {
      setRange({ start: range.start, end: dateString });
    } else {
      setRange({ start: dateString, end: maxRangeEnd(dateString, occupied) });
    }
  };

  const markedDates = useMemo(() => {
    const marks: Record<string, object> = {};
    for (const day of occupied) {
      marks[day] = { disabled: true, disableTouchEvent: true };
    }
    const days = eachDay(range.start, range.end);
    for (const day of days) {
      marks[day] = {
        startingDay: day === range.start,
        endingDay: day === range.end,
        color: theme.colors.accent,
        textColor: '#FFFFFF',
      };
    }
    return marks;
  }, [occupied, range, theme.colors.accent]);

  const save = () => saveWeek(range);

  return (
    <View style={styles.root}>
      <Calendar
        initialDate={range.start}
        firstDay={1}
        hideExtraDays
        enableSwipeMonths
        markingType="period"
        markedDates={markedDates}
        onDayPress={onDayPress}
        theme={{
          calendarBackground: 'transparent',
          dayTextColor: theme.colors.text,
          monthTextColor: theme.colors.text,
          textSectionTitleColor: theme.colors.textMuted,
          textDisabledColor: theme.colors.textMuted,
          todayTextColor: theme.colors.accent,
          arrowColor: theme.colors.accent,
        }}
      />

      <Text style={styles.summary}>
        {formatRange(range.start, range.end)} · {formatDayCount(rangeLength(range.start, range.end))}
      </Text>

      <View style={styles.actions}>
        <Pressable style={({ pressed }) => styles.cancelButton(pressed)} onPress={cancelEdit}>
          <Text style={styles.cancelLabel}>Отмена</Text>
        </Pressable>
        <Pressable style={({ pressed }) => styles.saveButton(pressed)} onPress={save}>
          <Text style={styles.saveLabel}>{editedWeek ? 'Сохранить' : 'Создать неделю'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    gap: theme.spacing.three,
  },
  summary: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.two,
    marginBottom: theme.spacing.two,
  },
  cancelButton: (pressed: boolean) => ({
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.three,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.badgeBackground,
    opacity: pressed ? 0.8 : 1,
  }),
  cancelLabel: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  saveButton: (pressed: boolean) => ({
    flex: 2,
    alignItems: 'center',
    paddingVertical: theme.spacing.three,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
    opacity: pressed ? 0.85 : 1,
  }),
  saveLabel: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}));
