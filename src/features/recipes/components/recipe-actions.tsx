import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { CheckIcon, PencilIcon, TrashIcon } from '@/features/day-card/components/icons';

const DANGER = '#E5484D';

interface RecipeActionsProps {
  editing: boolean;
  onDelete: () => void;
  onEditToggle: () => void;
}

export function RecipeActions({ editing, onDelete, onEditToggle }: RecipeActionsProps) {
  const { theme } = useUnistyles();
  const editColor = editing ? theme.colors.accent : theme.colors.text;

  return (
    <View style={styles.root}>
      <Pressable style={({ pressed }) => styles.chip(DANGER, pressed)} hitSlop={6} onPress={onDelete}>
        <TrashIcon color={DANGER} size={18} />
      </Pressable>

      <Pressable
        style={({ pressed }) => styles.chip(editColor, pressed)}
        hitSlop={6}
        onPress={onEditToggle}>
        {editing ? <CheckIcon color={editColor} size={18} /> : <PencilIcon color={editColor} size={18} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.two,
  },
  chip: (color: string, pressed: boolean) => ({
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: `${color}${pressed ? '33' : '22'}`,
  }),
}));
