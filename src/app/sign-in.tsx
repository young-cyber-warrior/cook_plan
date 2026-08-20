import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import type { AuthResult } from '@/stores/auth-store';
import { useAuthStore } from '@/stores/store-context';

interface SignInForm {
  email: string;
  password: string;
  error: string | null;
  busy: boolean;
}

const initialForm: SignInForm = { email: '', password: '', error: null, busy: false };

export default function SignInScreen() {
  const { theme } = useUnistyles();
  const { signIn, signUp } = useAuthStore();
  const [form, setForm] = useState(initialForm);
  const { email, password, error, busy } = form;

  const setField = (patch: Partial<SignInForm>) => setForm(current => ({ ...current, ...patch }));
// а где нормальная валидация почты?
// здесь чет очень сложно ? что ты пытаешь решитьздесь и почему так ?
  const canSubmit = email.trim().length > 0 && password.length > 0 && !busy;
// почему нет обработки ошибок?
  const submit = async (action: (email: string, password: string) => Promise<AuthResult>) => {
    // зачем идет два обнровления стейта сразу setField ? в чем приична и польза? что значит busy и для чего это ?
    setField({ busy: true, error: null });
    const result = await action(email.trim(), password);
    setField({ busy: false, error: result.ok ? null : result.message });
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
          onChangeText={value => setField({ email: value })}
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
          onChangeText={value => setField({ password: value })}
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
