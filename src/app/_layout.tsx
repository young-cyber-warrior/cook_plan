import { Stack } from 'expo-router';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Navbar } from '@/components/navbar';

export default function RootLayout() {
  return (
    <View style={styles.root}>
      <Navbar />
      <Stack screenOptions={{ headerShown: false, contentStyle: styles.content }} />
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
