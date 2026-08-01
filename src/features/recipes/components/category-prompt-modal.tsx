import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

interface CategoryPromptModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (label: string) => void;
}

/** Alert.prompt only exists on iOS — this stands in for both platforms. */
export function CategoryPromptModal({ visible, onCancel, onSubmit }: CategoryPromptModalProps) {
  const { theme } = useUnistyles();
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (visible) setLabel('');
  }, [visible]);

  const trimmed = label.trim();
  const submit = () => trimmed && onSubmit(trimmed);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.scrim}>
        <Pressable style={styles.scrimPress} onPress={onCancel} />

        <View style={styles.card}>
          <Text style={styles.title}>Новая категория</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="Например, «Полдник»"
            placeholderTextColor={theme.colors.textMuted}
            selectionColor={theme.colors.accent}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={submit}
          />

          <View style={styles.buttons}>
            <Pressable style={({ pressed }) => styles.button(pressed, false)} onPress={onCancel}>
              <Text style={styles.buttonLabel(false, false)}>Отмена</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => styles.button(pressed, true)}
              disabled={!trimmed}
              onPress={submit}>
              <Text style={styles.buttonLabel(true, !trimmed)}>Добавить</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create(theme => ({
  scrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,10,15,0.5)',
    padding: theme.spacing.five,
  },
  scrimPress: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    gap: theme.spacing.three,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.four,
    backgroundColor: theme.colors.card,
    ...theme.shadow.card,
  },
  title: {
    ...theme.typography.sectionTitle,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
    textAlign: 'center',
  },
  input: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.three,
    paddingVertical: theme.spacing.two,
    backgroundColor: theme.colors.badgeBackground,
  },
  buttons: {
    flexDirection: 'row',
    gap: theme.spacing.two,
  },
  button: (pressed: boolean, primary: boolean) => ({
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.two,
    borderRadius: theme.radius.md,
    backgroundColor: primary ? theme.colors.accent : theme.colors.badgeBackground,
    opacity: pressed ? 0.8 : 1,
  }),
  buttonLabel: (primary: boolean, disabled: boolean) => ({
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    color: primary ? '#FFFFFF' : theme.colors.textSecondary,
    opacity: disabled ? 0.5 : 1,
  }),
}));
