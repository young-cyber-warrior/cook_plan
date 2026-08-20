import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { MAX_SERVINGS, MIN_SERVINGS } from '@/features/day-card/lib/servings';

interface ServingsStepperProps {
  value: number;
  onChange: (value: number) => void;
}

/** Person count for a meal. Drives the macro scaling. */
export function ServingsStepper({ value, onChange }: ServingsStepperProps) {
  return (
    <View style={styles.root}>
      <Pressable
        style={({ pressed }) => styles.button(pressed)}
        disabled={value <= MIN_SERVINGS}
        hitSlop={6}
        onPress={() => onChange(value - 1)}>
        <Text style={styles.sign(value <= MIN_SERVINGS)}>−</Text>
      </Pressable>

      <Text style={styles.value} allowFontScaling={false}>
        {value}
      </Text>

      <Pressable
        style={({ pressed }) => styles.button(pressed)}
        disabled={value >= MAX_SERVINGS}
        hitSlop={6}
        onPress={() => onChange(value + 1)}>
        <Text style={styles.sign(value >= MAX_SERVINGS)}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.one,
    padding: theme.spacing.half,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.badgeBackground,
  },
  button: (pressed: boolean) => ({
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    backgroundColor: pressed ? theme.colors.backgroundSelected : 'transparent',
  }),
  sign: (disabled: boolean) => ({
    ...theme.typography.sectionTitle,
    lineHeight: 20,
    fontFamily: theme.fonts.sans,
    color: disabled ? theme.colors.textMuted : theme.colors.text,
  }),
  value: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
    minWidth: 16,
    textAlign: 'center',
  },
}));
