import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface PickRecipeBarProps {
  /** What confirming does — the picker fills a meal slot or the personal extras of a day. */
  confirmLabel: string;
  canConfirm: boolean;
  onConfirm: () => void;
  onBack: () => void;
}

export function PickRecipeBar({ confirmLabel, canConfirm, onConfirm, onBack }: PickRecipeBarProps) {
  return (
    <View style={styles.root}>
      <Pressable style={({ pressed }) => styles.back(pressed)} onPress={onBack}>
        <Text style={styles.backLabel}>Назад</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => styles.confirm(canConfirm, pressed)}
        disabled={!canConfirm}
        onPress={onConfirm}>
        <Text style={styles.confirmLabel} numberOfLines={1}>
          {confirmLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
    paddingHorizontal: theme.spacing.three,
    paddingVertical: theme.spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.cardBorder,
    backgroundColor: theme.colors.card,
  },
  back: (pressed: boolean) => ({
    paddingHorizontal: theme.spacing.three,
    paddingVertical: theme.spacing.three,
    borderRadius: theme.radius.md,
    backgroundColor: pressed ? theme.colors.backgroundElement : 'transparent',
  }),
  backLabel: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textSecondary,
  },
  confirm: (canConfirm: boolean, pressed: boolean) => ({
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.three,
    paddingVertical: theme.spacing.three,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
    opacity: canConfirm ? (pressed ? 0.85 : 1) : 0.4,
  }),
  confirmLabel: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: '#FFFFFF',
  },
}));
