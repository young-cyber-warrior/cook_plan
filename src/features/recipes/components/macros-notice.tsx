import { observer } from 'mobx-react-lite';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useSyncStore } from '@/stores/store-context';

export const MacrosNotice = observer(function MacrosNotice() {
  const { connected } = useSyncStore();

  return (
    <View style={styles.root(connected)}>
      <Text style={styles.text}>
        {connected
          ? 'Пищевую ценность посчитаем по ингредиентам сразу после сохранения'
          : 'Нет сети: рецепт сохранится на устройстве, пищевую ценность посчитаем при подключении'}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create(theme => ({
  root: (connected: boolean) => ({
    borderRadius: theme.radius.lg,
    padding: theme.spacing.three,
    backgroundColor: connected ? `${theme.colors.accent}12` : theme.colors.badgeBackground,
  }),
  text: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textSecondary,
  },
}));
