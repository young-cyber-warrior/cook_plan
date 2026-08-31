import { memo } from 'react';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { MacroBadge } from '@/features/day-card/components/macro-badge';
import { ProgressRing } from '@/features/day-card/components/progress-ring';
import { dayMacros, dayProgress } from '@/features/day-card/lib/nutrition';
import type { Day, PersonalLayer } from '@/features/day-card/types';

interface DayCardHeaderProps {
  day: Day;
  personal: PersonalLayer;
}

export const DayCardHeader = memo(function DayCardHeader({ day, personal }: DayCardHeaderProps) {
  const progress = dayProgress(day);
  const macros = dayMacros(day, personal);

  return (
    <View style={styles.root}>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {day.weekday}
        </Text>

        <View style={styles.badges}>
          {/* этот комент не трогой он для меня - здесь подумать какие вообще они будут и надо ли они мне  */}
          <MacroBadge value={String(macros.calories)} unit="ккал" />
        </View>
      </View>
      <ProgressRing progress={progress} />
    </View>
  );
});

const styles = StyleSheet.create(theme => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
    paddingHorizontal: theme.spacing.four,
    paddingVertical: theme.spacing.three,
  },
  info: {
    flex: 1,
    gap: theme.spacing.two,
  },
  title: {
    ...theme.typography.cardTitle,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'flex-start',
    marginTop: theme.spacing.two,
    gap: theme.spacing.two,
  },
}));
