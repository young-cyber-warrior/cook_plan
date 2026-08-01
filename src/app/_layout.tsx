import { Stack } from 'expo-router';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Navbar } from '@/components/navbar';
import { AddRecipeProvider } from '@/features/recipes/context/add-recipe-context';

export default function RootLayout() {
  return (
    <AddRecipeProvider>
      <View style={styles.root}>
        <Navbar />
        <Stack screenOptions={{ headerShown: false, contentStyle: styles.content }} />
      </View>
    </AddRecipeProvider>
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
