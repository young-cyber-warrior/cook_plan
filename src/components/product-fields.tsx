import { TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { UnitToggle } from '@/features/recipes/components/unit-toggle';
import type { Unit } from '@/features/recipes/types';
import { toNumber } from '@/lib/number';

interface ProductFieldsProps<T extends Unit> {
  name: string;
  amount: number;
  unit: T;
  units?: readonly T[];
  onNameChange: (name: string) => void;
  onAmountChange: (amount: number) => void;
  onUnitChange: (unit: T) => void;
}

/** Name + amount + unit row shared by every sheet that describes one product. */
export function ProductFields<T extends Unit>({
  name,
  amount,
  unit,
  units,
  onNameChange,
  onAmountChange,
  onUnitChange,
}: ProductFieldsProps<T>) {
  const { theme } = useUnistyles();

  return (
    <View style={styles.row}>
      <TextInput
        style={styles.nameInput}
        value={name}
        onChangeText={onNameChange}
        placeholder="Название"
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.accent}
      />

      <TextInput
        style={styles.amountInput}
        value={String(amount)}
        onChangeText={text => onAmountChange(toNumber(text))}
        keyboardType="number-pad"
        selectionColor={theme.colors.accent}
      />

      <UnitToggle value={unit} units={units} onChange={onUnitChange} />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.two,
    marginBottom: theme.spacing.three,
  },
  nameInput: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
    flex: 1,
    padding: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.accent,
  },
  amountInput: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
    width: 48,
    padding: 0,
    textAlign: 'right',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.accent,
  },
}));
