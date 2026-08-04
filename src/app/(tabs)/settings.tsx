import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Настройки</Text>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...theme.typography.sectionTitle,
    color: theme.colors.text,
  },
}));
