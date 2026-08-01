import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useWeeksContext } from '@/features/weeks/context/weeks-context';
import { formatRange, todayId } from '@/features/weeks/lib/dates';

export function DaysNavbarContent() {
  const { weeks, activeIndex, openSheet } = useWeeksContext();
  const week = weeks[activeIndex];
  const isCurrent = todayId() >= week.start && todayId() <= week.end;

  return (
    <View style={styles.content}>
      <Pressable style={({ pressed }) => styles.pill(pressed)} hitSlop={8} onPress={openSheet}>
        <Text style={styles.range}>{formatRange(week.start, week.end)}</Text>
        {isCurrent ? <Text style={styles.current}>· текущая</Text> : null}
        <Text style={styles.caret}>▾</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.three,
  },
  pill: (pressed: boolean) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.one,
    paddingVertical: theme.spacing.two,
    paddingHorizontal: theme.spacing.three,
    borderRadius: theme.radius.full,
    backgroundColor: pressed ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.16)',
  }),
  range: {
    ...theme.typography.sectionTitle,
    fontFamily: theme.fonts.sans,
    color: '#FFFFFF',
  },
  current: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: 'rgba(255,255,255,0.75)',
  },
  caret: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: 'rgba(255,255,255,0.8)',
  },
}));
