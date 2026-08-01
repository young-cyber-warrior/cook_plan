import { Pressable, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { BottomSheet } from '@/components/bottom-sheet';
import { PencilIcon, PlusIcon, TrashIcon } from '@/features/day-card/components/icons';

import { useWeeksContext } from '../context/weeks-context';
import { formatDayCount, formatRange, rangeLength, todayId } from '../lib/dates';
import { WeekRangeEditor } from './week-range-editor';

export function WeeksSheet() {
  const { theme } = useUnistyles();
  const {
    weeks,
    activeIndex,
    sheetVisible,
    editing,
    canRemove,
    setActiveIndex,
    closeSheet,
    startAdd,
    startEdit,
    removeWeek,
  } = useWeeksContext();

  const heading = editing ? (editing.weekId ? 'Даты недели' : 'Новая неделя') : 'Недели';
  const today = todayId();

  return (
    <BottomSheet
      visible={sheetVisible}
      onClose={closeSheet}
      header={<Text style={styles.heading}>{heading}</Text>}>
      {editing ? (
        <WeekRangeEditor />
      ) : (
        <>
          {weeks.map((week, index) => (
            <View key={week.id} style={styles.row}>
              <Pressable
                style={styles.rowLabel}
                onPress={() => {
                  setActiveIndex(index);
                  closeSheet();
                }}>
                <Text style={styles.range(index === activeIndex)}>
                  {formatRange(week.start, week.end)}
                </Text>
                <Text style={styles.length}>{formatDayCount(rangeLength(week.start, week.end))}</Text>
              </Pressable>

              {today >= week.start && today <= week.end ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeLabel}>Текущая</Text>
                </View>
              ) : null}

              <Pressable
                style={({ pressed }) => styles.rowButton(pressed)}
                hitSlop={4}
                accessibilityLabel="Редактировать даты"
                onPress={() => startEdit(week.id)}>
                <PencilIcon color={theme.colors.textSecondary} size={18} />
              </Pressable>

              <Pressable
                style={({ pressed }) => styles.rowButton(pressed)}
                hitSlop={4}
                accessibilityLabel="Удалить неделю"
                disabled={!canRemove}
                onPress={() => removeWeek(week.id)}>
                <TrashIcon
                  color={canRemove ? theme.colors.textSecondary : theme.colors.cardBorder}
                  size={18}
                />
              </Pressable>
            </View>
          ))}

          <Pressable style={({ pressed }) => styles.addButton(pressed)} onPress={startAdd}>
            <PlusIcon color="#FFFFFF" size={18} />
            <Text style={styles.addLabel}>Добавить неделю</Text>
          </Pressable>

          {!canRemove ? <Text style={styles.note}>Последнюю неделю удалить нельзя</Text> : null}
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create(theme => ({
  heading: {
    ...theme.typography.sectionTitle,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
    marginBottom: theme.spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.two,
    paddingVertical: theme.spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },
  rowLabel: {
    flex: 1,
    gap: theme.spacing.half,
  },
  range: (active: boolean) => ({
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    color: active ? theme.colors.accent : theme.colors.text,
  }),
  length: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
  },
  badge: {
    paddingVertical: theme.spacing.half,
    paddingHorizontal: theme.spacing.two,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.mealFilled,
  },
  badgeLabel: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.accent,
  },
  rowButton: (pressed: boolean) => ({
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: pressed ? theme.colors.backgroundElement : 'transparent',
  }),
  addButton: (pressed: boolean) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.two,
    marginTop: theme.spacing.four,
    marginBottom: theme.spacing.two,
    paddingVertical: theme.spacing.three,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
    opacity: pressed ? 0.85 : 1,
  }),
  addLabel: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  note: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.two,
  },
}));
