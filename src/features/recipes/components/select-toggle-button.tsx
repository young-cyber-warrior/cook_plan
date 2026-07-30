import { Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { CheckIcon, PlusIcon } from '@/features/day-card/components/icons';

interface SelectToggleButtonProps {
  selected: boolean;
  onToggle: () => void;
}

/** Plus morphs into a check once picked; tapping it never bubbles to the card's own accordion toggle. */
export function SelectToggleButton({ selected, onToggle }: SelectToggleButtonProps) {
  const { theme } = useUnistyles();
  const color = selected ? '#FFFFFF' : theme.colors.accent;

  return (
    <Pressable
      style={({ pressed }) => styles.root(selected, pressed)}
      hitSlop={8}
      onPress={onToggle}>
      {selected ? <CheckIcon color={color} size={18} /> : <PlusIcon color={color} size={18} />}
    </Pressable>
  );
}

const styles = StyleSheet.create(theme => ({
  root: (selected: boolean, pressed: boolean) => ({
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    backgroundColor: selected ? theme.colors.accent : `${theme.colors.accent}22`,
    opacity: pressed ? 0.7 : 1,
  }),
}));
