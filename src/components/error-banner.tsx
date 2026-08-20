import { observer } from 'mobx-react-lite';
import { Pressable, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useErrorsStore } from '@/stores/store-context';

export const ErrorBanner = observer(function ErrorBanner() {
  const { message, dismiss } = useErrorsStore();
  if (!message) return null;

  return (
    <Pressable style={styles.banner} onPress={dismiss} accessibilityLabel="Скрыть ошибку">
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.hint}>Нажми, чтобы скрыть</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create((theme, rt) => ({
  banner: {
    position: 'absolute',
    left: theme.spacing.three,
    right: theme.spacing.three,
    bottom: rt.insets.bottom + theme.spacing.three,
    gap: theme.spacing.one,
    padding: theme.spacing.three,
    borderRadius: theme.radius.md,
    backgroundColor: '#D5484F',
    ...theme.shadow.card,
  },
  message: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  hint: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: '#FFFFFF',
    opacity: 0.8,
  },
}));
