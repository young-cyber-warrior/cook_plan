import { Pressable, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { ChevronRightIcon, PencilIcon } from '@/features/day-card/components/icons';

const ICON_SIZE = 16;

const formatDelta = (delta: number) => `${delta > 0 ? '+' : '−'}${Math.abs(delta)} ккал`;

interface PersonalMacrosChipProps {
  hasEdits: boolean;
  /** Calorie gap against the untouched family plan. */
  delta: number;
  onPress: () => void;
}

/** Entry point into the personal day editor; also shows whether edits exist. */
export function PersonalMacrosChip({ hasEdits, delta, onPress }: PersonalMacrosChipProps) {
  const { theme } = useUnistyles();
  const color = hasEdits ? theme.colors.accent : theme.colors.textSecondary;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => styles.root(pressed, hasEdits)}>
      <PencilIcon color={color} size={ICON_SIZE} />

      <View style={styles.labels}>
        <Text style={styles.label(hasEdits)}>
          {hasEdits ? 'Мои правки' : 'Скорректировать под себя'}
        </Text>
        {hasEdits && delta !== 0 ? <Text style={styles.delta}>{formatDelta(delta)}</Text> : null}
      </View>

      <ChevronRightIcon color={theme.colors.textMuted} size={ICON_SIZE} />
    </Pressable>
  );
}

const styles = StyleSheet.create(theme => ({
  root: (pressed: boolean, hasEdits: boolean) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.two,
    paddingVertical: theme.spacing.two,
    paddingHorizontal: theme.spacing.three,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: hasEdits ? theme.colors.mealFilledBorder : theme.colors.cardBorder,
    backgroundColor: pressed
      ? theme.colors.backgroundSelected
      : hasEdits
        ? theme.colors.mealFilled
        : theme.colors.card,
  }),
  labels: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.two,
  },
  label: (hasEdits: boolean) => ({
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: hasEdits ? theme.colors.accent : theme.colors.textSecondary,
  }),
  delta: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
  },
}));
