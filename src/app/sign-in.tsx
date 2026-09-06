import { useState } from 'react';
import { Pressable, StyleSheet as RNStyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import type { AuthResult } from '@/stores/auth-store';
import { useAuthStore } from '@/stores/store-context';

type FormStatus = { kind: 'idle' } | { kind: 'sending' } | { kind: 'error'; message: string };

interface SignInForm {
  email: string;
  password: string;
  status: FormStatus;
}

const initialForm: SignInForm = { email: '', password: '', status: { kind: 'idle' } };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A Unistyles style inside a Reanimated style array is rejected at runtime. */
const animatable = RNStyleSheet.create({
  scroll: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center' },
});

export default function SignInScreen() {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuthStore();
  const [form, setForm] = useState(initialForm);
  const { email, password, status } = form;

  const setField = (patch: Partial<SignInForm>) => setForm(current => ({ ...current, ...patch }));
  const emailValid = EMAIL_PATTERN.test(email.trim());
  const emailError = email.length > 0 && !emailValid ? 'Проверь адрес почты' : null;
  const filled = emailValid && password.length > 0;
  const canSubmit = filled && status.kind !== 'sending';
  const submit = async (action: (email: string, password: string) => Promise<AuthResult>) => {
    setField({ status: { kind: 'sending' } });
    const result = await action(email.trim(), password);
    setField({ status: result.ok ? { kind: 'idle' } : { kind: 'error', message: result.message } });
  };

  return (
    <KeyboardAwareScrollView
      style={[animatable.scroll, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        animatable.content,
        {
          paddingTop: insets.top + theme.spacing.three,
          paddingBottom: insets.bottom + theme.spacing.three,
          paddingHorizontal: theme.spacing.three,
        },
      ]}
      mode="layout"
      bottomOffset={theme.spacing.five}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
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
        {emailError ? <Text style={styles.error}>{emailError}</Text> : null}
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

        {status.kind === 'error' ? <Text style={styles.error}>{status.message}</Text> : null}

        <Pressable
          style={({ pressed }) => styles.primaryButton(pressed, canSubmit)}
          disabled={!canSubmit}
          onPress={() => submit(signIn)}>
          <Text style={styles.primaryLabel}>Войти</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => styles.secondaryButton(pressed, canSubmit)}
          disabled={!canSubmit}
          onPress={() => submit(signUp)}>
          <Text style={styles.secondaryLabel}>Создать аккаунт</Text>
        </Pressable>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create(theme => ({
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
  secondaryButton: (pressed: boolean, enabled: boolean) => ({
    alignItems: 'center',
    paddingVertical: theme.spacing.three,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.badgeBackground,
    opacity: !enabled ? 0.5 : pressed ? 0.8 : 1,
  }),
  secondaryLabel: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
}));
