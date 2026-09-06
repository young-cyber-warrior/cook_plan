import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { BottomSheet } from '@/components/bottom-sheet';
import { ProductFields } from '@/components/product-fields';
import {
  useDayExtraDraft,
  type EstimateStatus,
} from '@/features/day-card/hooks/use-day-extra-draft';
import type { DayExtra, Macros } from '@/features/day-card/types';
import { toNumber } from '@/lib/number';
import type { DayExtraInput } from '@/stores/personal-store';

const MACRO_FIELDS: { key: keyof Macros; label: string }[] = [
  { key: 'calories', label: 'ккал' },
  { key: 'protein', label: 'Б' },
  { key: 'fat', label: 'Ж' },
  { key: 'carbs', label: 'У' },
];

const STATUS_HINTS: Partial<Record<EstimateStatus, string>> = {
  unrecognized: 'Не понял продукт — впиши КБЖУ сам или уточни название.',
  failed: 'Не удалось посчитать — впиши КБЖУ сам.',
};

interface DayExtraSheetProps {
  visible: boolean;
  /** `null` opens the sheet for a new product. */
  extra: DayExtra | null;
  onClose: () => void;
  onSubmit: (input: DayExtraInput) => void;
}

export function DayExtraSheet({ visible, extra, onClose, onSubmit }: DayExtraSheetProps) {
  const { theme } = useUnistyles();
  const draft = useDayExtraDraft(extra);
  const hint = STATUS_HINTS[draft.status];

  const submit = () => {
    onSubmit({
      name: draft.name.trim(),
      amount: draft.amount,
      unit: draft.unit,
      macros: draft.macros,
    });
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      header={<Text style={styles.heading}>{extra ? 'Мой продукт' : 'Добавить продукт'}</Text>}>
      <ProductFields
        name={draft.name}
        amount={draft.amount}
        unit={draft.unit}
        onNameChange={draft.setName}
        onAmountChange={draft.setAmount}
        onUnitChange={draft.setUnit}
      />

      <Pressable
        style={({ pressed }) => styles.estimate(pressed, !draft.canSave)}
        disabled={!draft.canSave || draft.status === 'pending'}
        onPress={draft.estimate}>
        {draft.status === 'pending' ? (
          <ActivityIndicator color={theme.colors.accent} />
        ) : (
          <Text style={styles.estimateLabel}>Рассчитать</Text>
        )}
      </Pressable>

      {draft.description ? <Text style={styles.description}>{draft.description}</Text> : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <View style={styles.macroRow}>
        {MACRO_FIELDS.map(field => (
          <View key={field.key} style={styles.macroField}>
            <TextInput
              style={styles.macroInput}
              value={String(draft.macros[field.key])}
              onChangeText={text => draft.setMacro(field.key, toNumber(text))}
              keyboardType="number-pad"
              selectionColor={theme.colors.accent}
            />
            <Text style={styles.macroLabel}>{field.label}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => styles.submit(pressed, !draft.canSave)}
        disabled={!draft.canSave}
        onPress={submit}>
        <Text style={styles.submitLabel}>{extra ? 'Сохранить' : 'Добавить'}</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create(theme => ({
  heading: {
    ...theme.typography.sectionTitle,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
    marginBottom: theme.spacing.two,
  },
  estimate: (pressed: boolean, disabled: boolean) => ({
    alignItems: 'center',
    paddingVertical: theme.spacing.two,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.accent,
    backgroundColor: pressed ? theme.colors.backgroundSelected : 'transparent',
    opacity: disabled ? 0.4 : 1,
  }),
  estimateLabel: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.accent,
  },
  description: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.two,
  },
  hint: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.two,
  },
  macroRow: {
    flexDirection: 'row',
    gap: theme.spacing.two,
    marginVertical: theme.spacing.three,
  },
  macroField: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.half,
    paddingVertical: theme.spacing.two,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.backgroundElement,
  },
  macroInput: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
    padding: 0,
    minWidth: 40,
    textAlign: 'center',
  },
  macroLabel: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
  },
  submit: (pressed: boolean, disabled: boolean) => ({
    alignItems: 'center',
    marginBottom: theme.spacing.two,
    paddingVertical: theme.spacing.three,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
    opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
  }),
  submitLabel: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}));
