import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export function Navbar() {
  return <View style={styles.root} />;
}

const styles = StyleSheet.create((theme, rt) => ({
  root: {
    height: 56 + rt.insets.top,
    paddingTop: rt.insets.top,
    backgroundColor: theme.colors.primary,
  },
}));
