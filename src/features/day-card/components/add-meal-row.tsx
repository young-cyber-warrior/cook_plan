import { Pressable, Text } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { PlusIcon } from '@/features/day-card/components/icons';

interface AddMealRowProps {
  onPress: () => void;
}

/** Appends a custom meal slot, which also bumps the day ring total to `0/4`. */
export function AddMealRow({ onPress }: AddMealRowProps) {
  const { theme } = useUnistyles();

  return (
    <Pressable style={({ pressed }) => styles.root(pressed)} onPress={onPress}>
      <PlusIcon color={theme.colors.accent} size={18} />
      <Text style={styles.label}>Добавь свой приём пищи</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create(theme => ({
  root: (pressed: boolean) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.two,
    paddingHorizontal: theme.spacing.four,
    paddingVertical: theme.spacing.three,
    backgroundColor: pressed ? theme.colors.backgroundElement : 'transparent',
  }),
  label: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.accent,
  },
}));
