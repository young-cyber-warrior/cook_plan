import { Stack } from 'expo-router';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Navbar } from '@/components/navbar';
import { AuthProvider, useAuthContext } from '@/features/auth/context/auth-context';
import { GroceryProvider } from '@/features/grocery/context/grocery-context';
import { AddRecipeProvider } from '@/features/recipes/context/add-recipe-context';
import { WeeksProvider } from '@/features/weeks/context/weeks-context';

export default function RootLayout() {
  return (
    <AuthProvider>
      <WeeksProvider>
        <GroceryProvider>
          <AddRecipeProvider>
            <RootNavigator />
          </AddRecipeProvider>
        </GroceryProvider>
      </WeeksProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { session, ready } = useAuthContext();

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
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  content: {
    backgroundColor: theme.colors.surface,
  },
}));
