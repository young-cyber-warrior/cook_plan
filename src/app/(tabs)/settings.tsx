import { observer } from 'mobx-react-lite';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useAuthStore } from '@/stores/store-context';

export default observer(function SettingsScreen() {
  const { email, signOut } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Аккаунт</Text>
      <Text style={styles.email}>{email}</Text>
      <Pressable style={({ pressed }) => styles.signOutButton(pressed)} onPress={signOut}>
        <Text style={styles.signOutLabel}>Выйти</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.two,
    padding: theme.spacing.three,
  },
  label: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  email: {
    ...theme.typography.sectionTitle,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
  },
  signOutButton: (pressed: boolean) => ({
    marginTop: theme.spacing.three,
    alignItems: 'center',
    paddingVertical: theme.spacing.three,
    paddingHorizontal: theme.spacing.five,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.badgeBackground,
    opacity: pressed ? 0.8 : 1,
  }),
  signOutLabel: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
}));
