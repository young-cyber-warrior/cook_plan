import type { ComponentType } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { BookIcon, CheckIcon, PencilIcon, TrashIcon } from '@/features/day-card/components/icons';
import type { IconProps } from '@/features/day-card/components/icons';

type Tone = 'danger' | 'neutral' | 'accent';

const DANGER = '#E5484D';

interface MealActionsProps {
  editing: boolean;
  onDelete: () => void;
  onEditToggle: () => void;
  onPickMenu: () => void;
}

function ChipButton({
  icon: Icon,
  tone,
  onPress,
}: {
  icon: ComponentType<IconProps>;
  tone: Tone;
  onPress: () => void;
}) {
  const { theme } = useUnistyles();
  const color =
    tone === 'accent' ? theme.colors.accent : tone === 'danger' ? DANGER : theme.colors.text;

  return (
    <Pressable style={({ pressed }) => styles.chip(color, pressed)} hitSlop={6} onPress={onPress}>
      <Icon color={color} size={20} />
    </Pressable>
  );
}

export function MealActions({ editing, onDelete, onEditToggle, onPickMenu }: MealActionsProps) {
  return (
    <View style={styles.root}>
      <ChipButton icon={TrashIcon} tone="danger" onPress={onDelete} />
      <ChipButton
        icon={editing ? CheckIcon : PencilIcon}
        tone={editing ? 'accent' : 'neutral'}
        onPress={onEditToggle}
      />
      <ChipButton icon={BookIcon} tone="accent" onPress={onPickMenu} />
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
