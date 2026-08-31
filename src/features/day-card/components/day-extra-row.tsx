import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { TrashIcon } from '@/features/day-card/components/icons';
import { ServingsStepper } from '@/features/day-card/components/servings-stepper';
import { extraAmountLabel, isServingExtra } from '@/features/day-card/lib/extra-units';
import type { DayExtra } from '@/features/day-card/types';

const DANGER = '#E5484D';
const ICON_SIZE = 16;

interface DayExtraRowProps {
  extra: DayExtra;
  onPress: () => void;
  onServingsChange: (servings: number) => void;
  onRemove: () => void;
}

/**
 * Personal food added on top of the family plan. A recipe is counted in servings and edited
 * right in the row by the stepper; a hand-entered product opens the product sheet instead.
 */
export function DayExtraRow({ extra, onPress, onServingsChange, onRemove }: DayExtraRowProps) {
  const servings = isServingExtra(extra);

  const body = (
    <>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {extra.name}
        </Text>
        {servings ? (
          <ServingsStepper value={extra.amount} onChange={onServingsChange} />
        ) : (
          <Text style={styles.amount}>{extraAmountLabel(extra)}</Text>
        )}
      </View>

      <Text style={styles.calories}>{extra.macros.calories} ккал</Text>

      <Pressable style={({ pressed }) => styles.remove(pressed)} hitSlop={8} onPress={onRemove}>
        <TrashIcon color={DANGER} size={ICON_SIZE} />
      </Pressable>
    </>
  );

  if (servings) return <View style={styles.root(false)}>{body}</View>;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => styles.root(pressed)}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create(theme => ({
  root: (pressed: boolean) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
    padding: theme.spacing.three,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.cardBorder,
    backgroundColor: pressed ? theme.colors.backgroundSelected : theme.colors.card,
  }),
  info: {
    flex: 1,
    alignItems: 'flex-start',
    gap: theme.spacing.two,
  },
  name: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    color: theme.colors.text,
  },
  amount: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
  },
  calories: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
  },
  remove: (pressed: boolean) => ({
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: `${DANGER}${pressed ? '33' : '22'}`,
  }),
}));
