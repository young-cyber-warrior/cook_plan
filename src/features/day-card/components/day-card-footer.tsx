import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { MacroBreakdown } from '@/components/macro-breakdown';
import { PersonalMacrosChip } from '@/features/day-card/components/personal-macros-chip';
import { dayMacros, hasPersonalEdits, personalDelta } from '@/features/day-card/lib/nutrition';
import type { Day, PersonalLayer } from '@/features/day-card/types';

interface DayCardFooterProps {
  day: Day;
  personal: PersonalLayer;
  onEdit: () => void;
}

/** Day totals: everything here recomputes from the meals above plus personal edits. */
export function DayCardFooter({ day, personal, onEdit }: DayCardFooterProps) {
  const macros = useMemo(() => dayMacros(day, personal), [day, personal]);
  const edited = useMemo(() => hasPersonalEdits(day, personal), [day, personal]);
  const delta = useMemo(() => personalDelta(day, personal), [day, personal]);

  return (
    <View style={styles.root}>
      <View style={styles.headline}>
        <Text style={styles.title}>Итого за день</Text>
        <Text style={styles.calories}>
          {macros.calories}
          <Text style={styles.unit}> ккал</Text>
        </Text>
      </View>

      <MacroBreakdown macros={macros} />

      <PersonalMacrosChip hasEdits={edited} delta={delta} onPress={onEdit} />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    gap: theme.spacing.three,
    paddingHorizontal: theme.spacing.four,
    paddingVertical: theme.spacing.four,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.divider,
    backgroundColor: theme.colors.backgroundElement,
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
}));
