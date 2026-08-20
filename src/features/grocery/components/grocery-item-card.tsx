import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { unitLabel } from '@/features/recipes/lib/units';

import type { GroceryItem } from '../types';

const AMOUNT_STEP = 10;

interface GroceryItemCardProps {
  item: GroceryItem;
  onToggle: () => void;
  onRemove: () => void;
  onAmountChange: (amount: number) => void;
}

interface CardFooterProps {
  item: GroceryItem;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  onRemove: () => void;
  onAmountChange: (amount: number) => void;
}

function CardFooter({ item, editing, onEditingChange, onRemove, onAmountChange }: CardFooterProps) {
  if (editing) {
    return (
      <View style={styles.editRow}>
        <Pressable
          style={({ pressed }) => styles.stepButton(pressed)}
          disabled={item.amount <= AMOUNT_STEP}
          onPress={() => onAmountChange(Math.max(AMOUNT_STEP, item.amount - AMOUNT_STEP))}>
          <Text style={styles.stepLabel}>−</Text>
        </Pressable>
        <Text style={styles.editAmount}>
          {item.amount} {unitLabel(item.unit)}
        </Text>
        <Pressable
          style={({ pressed }) => styles.stepButton(pressed)}
          onPress={() => onAmountChange(item.amount + AMOUNT_STEP)}>
          <Text style={styles.stepLabel}>+</Text>
        </Pressable>
        <Pressable style={styles.footerButton} hitSlop={4} onPress={() => onEditingChange(false)}>
          <Text style={styles.footerAccent}>Готово</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.footer}>
      <Pressable style={styles.footerButton} hitSlop={4} onPress={onRemove}>
        <Text style={styles.footerMuted}>Удалить</Text>
      </Pressable>
      <Pressable style={styles.footerButton} hitSlop={4} onPress={() => onEditingChange(true)}>
        <Text style={styles.footerAccent}>Изменить</Text>
      </Pressable>
    </View>
  );
}

export function GroceryItemCard({ item, onToggle, onRemove, onAmountChange }: GroceryItemCardProps) {
  const [editing, setEditing] = useState(false);

  return (
    <View style={styles.card}>
      <Pressable style={styles.main} onPress={onToggle}>
        <View style={styles.checkbox(item.checked)}>
          {item.checked ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
        <Text style={styles.name(item.checked)} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.amount(item.checked)}>
          {item.amount} {unitLabel(item.unit)}
          {item.edited ? ' *' : ''}
        </Text>
      </Pressable>

      <CardFooter
        item={item}
        editing={editing}
        onEditingChange={setEditing}
        onRemove={onRemove}
        onAmountChange={onAmountChange}
      />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.three,
    paddingVertical: theme.spacing.three,
    gap: theme.spacing.two,
    ...theme.shadow.card,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
  },
  checkbox: (checked: boolean) => ({
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    borderWidth: 2,
    borderColor: checked ? theme.colors.success : theme.colors.textMuted,
    backgroundColor: checked ? theme.colors.success : 'transparent',
  }),
  checkmark: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  name: (checked: boolean) => ({
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    flex: 1,
    color: checked ? theme.colors.textMuted : theme.colors.text,
    textDecorationLine: checked ? 'line-through' : 'none',
  }),
  amount: (checked: boolean) => ({
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: checked ? theme.colors.textMuted : theme.colors.textSecondary,
  }),
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.four,
  },
  footerButton: {
    paddingVertical: theme.spacing.one,
  },
  footerMuted: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
  },
  footerAccent: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.accent,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing.three,
  },
  stepButton: (pressed: boolean) => ({
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: pressed ? theme.colors.backgroundSelected : theme.colors.backgroundElement,
  }),
  stepLabel: {
    ...theme.typography.sectionTitle,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
  },
  editAmount: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    fontVariant: ['tabular-nums'],
    color: theme.colors.text,
  },
}));
