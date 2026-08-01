import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { WeekPager } from '@/features/weeks/components/week-pager';
import { WeeksSheet } from '@/features/weeks/components/weeks-sheet';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <WeekPager />
      <WeeksSheet />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
}));
