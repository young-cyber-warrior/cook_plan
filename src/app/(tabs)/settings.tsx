import { observer } from 'mobx-react-lite';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { FamilySection } from '@/features/family/components/family-section';
import { useAuthStore } from '@/stores/store-context';

export default observer(function SettingsScreen() {
  const { email, signOut } = useAuthStore();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.account}>
        <Text style={styles.label}>Аккаунт</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <FamilySection />

      <Pressable style={({ pressed }) => styles.signOutButton(pressed)} onPress={signOut}>
        <Text style={styles.signOutLabel}>Выйти</Text>
      </Pressable>
    </ScrollView>
  );
});

const styles = StyleSheet.create(theme => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    alignItems: 'center',
    gap: theme.spacing.four,
    padding: theme.spacing.three,
  },
  account: {
    alignItems: 'center',
    gap: theme.spacing.two,
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
