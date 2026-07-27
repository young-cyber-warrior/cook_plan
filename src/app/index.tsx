import { FlatList } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { DayPlanCard } from '@/features/day-card/components/day-plan-card';
import { MOCK_WEEK } from '@/features/day-card/mock';

export default function HomeScreen() {
  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={MOCK_WEEK}
      keyExtractor={day => day.id}
      renderItem={({ item, index }) => <DayPlanCard day={item} defaultExpanded={index === 0} />}
    />
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.three,
    paddingBottom: theme.spacing.three + rt.insets.bottom,
    gap: theme.spacing.three,
  },
}));
