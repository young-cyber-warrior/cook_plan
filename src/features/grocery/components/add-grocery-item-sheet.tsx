import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { BottomSheet } from '@/components/bottom-sheet';
import { ProductFields } from '@/components/product-fields';
import { DEFAULT_UNIT, GROCERY_UNITS } from '@/features/recipes/lib/units';
import type { Unit } from '@/features/recipes/types';
import { useGroceryStore } from '@/stores/store-context';

export const AddGroceryItemSheet = observer(function AddGroceryItemSheet() {
  const { customSheetVisible, closeCustomSheet, addCustomItem } = useGroceryStore();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(0);
  const [unit, setUnit] = useState<Unit>(DEFAULT_UNIT);

  useEffect(() => {
    if (!customSheetVisible) return;
    setName('');
    setAmount(0);
    setUnit(DEFAULT_UNIT);
  }, [customSheetVisible]);

  const canSave = name.trim() !== '' && amount > 0;

  return (
    <BottomSheet
      visible={customSheetVisible}
      onClose={closeCustomSheet}
      header={<Text style={styles.heading}>Свой продукт</Text>}>
      <ProductFields
        name={name}
        amount={amount}
        unit={unit}
        units={GROCERY_UNITS}
        onNameChange={setName}
        onAmountChange={setAmount}
        onUnitChange={setUnit}
      />

      <Pressable
        style={({ pressed }) => styles.submit(pressed, !canSave)}
        disabled={!canSave}
        onPress={() => addCustomItem(name.trim(), amount, unit)}>
        <Text style={styles.submitLabel}>Добавить</Text>
      </Pressable>
    </BottomSheet>
  );
});

const styles = StyleSheet.create(theme => ({
  heading: {
    ...theme.typography.sectionTitle,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
    marginBottom: theme.spacing.two,
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
