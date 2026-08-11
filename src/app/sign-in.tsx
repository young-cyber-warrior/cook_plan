import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { useAuthContext } from '@/features/auth/context/auth-context';

export default function SignInScreen() {
  // почему так коряво разве нельзя все жэти сеттй обьеденить во что-то? или потом в mobx все это переренесем когда его добавим ?
  const { theme } = useUnistyles();
  const { signIn, signUp } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !busy;

  const submit = async (action: (email: string, password: string) => Promise<string | null>) => {
    setBusy(true);
    setError(null);
    const message = await action(email.trim(), password);
    if (message) setError(message);
    setBusy(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Планер еды</Text>
        <Text style={styles.subtitle}>
          Войди, чтобы недели, рецепты и списки покупок синхронизировались между устройствами
        </Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Почта"
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.accent}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Пароль"
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.accent}
          autoCapitalize="none"
          autoComplete="password"
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => styles.primaryButton(pressed, canSubmit)}
          disabled={!canSubmit}
          onPress={() => submit(signIn)}>
          <Text style={styles.primaryLabel}>Войти</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => styles.secondaryButton(pressed)}
          disabled={!canSubmit}
          onPress={() => submit(signUp)}>
          <Text style={styles.secondaryLabel}>Создать аккаунт</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    paddingTop: rt.insets.top,
    paddingHorizontal: theme.spacing.three,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.four,
    gap: theme.spacing.three,
    ...theme.shadow.card,
  },
  title: {
    ...theme.typography.cardTitle,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
  },
  subtitle: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textSecondary,
  },
  input: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
    backgroundColor: theme.colors.backgroundElement,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.three,
    paddingVertical: theme.spacing.three,
  },
  error: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: '#D5484F',
  },
  primaryButton: (pressed: boolean, enabled: boolean) => ({
    alignItems: 'center',
    paddingVertical: theme.spacing.three,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
    opacity: !enabled ? 0.5 : pressed ? 0.85 : 1,
  }),
  primaryLabel: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: (pressed: boolean) => ({
    alignItems: 'center',
    paddingVertical: theme.spacing.three,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.badgeBackground,
    opacity: pressed ? 0.8 : 1,
  }),
  secondaryLabel: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
}));
