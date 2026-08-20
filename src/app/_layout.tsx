import { Stack } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ErrorBanner } from '@/components/error-banner';
import { Navbar } from '@/components/navbar';
import { AddRecipeProvider } from '@/features/recipes/context/add-recipe-context';
import { StoreProvider, useAuthStore } from '@/stores/store-context';

export default function RootLayout() {
  return (
    <StoreProvider>
      <AddRecipeProvider>
        <RootNavigator />
      </AddRecipeProvider>
    </StoreProvider>
  );
}

const RootNavigator = observer(function RootNavigator() {
  const { session, ready } = useAuthStore();
// в чем смысл ready? и почему он выставляеся в finally? и что заняит ready?
  if (!ready) return null;

  return (
    <View style={styles.root}>
      {session ? <Navbar /> : null}
      <Stack screenOptions={{ headerShown: false, contentStyle: styles.content }}>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
      <ErrorBanner />
    </View>
  );
});

const styles = StyleSheet.create(theme => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  content: {
    backgroundColor: theme.colors.surface,
  },
}));
