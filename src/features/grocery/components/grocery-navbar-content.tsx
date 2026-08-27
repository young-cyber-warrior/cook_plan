import { observer } from 'mobx-react-lite';
import { Alert, Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { TrashIcon } from '@/features/day-card/components/icons';
import { useGroceryStore } from '@/stores/store-context';

import { RefreshIcon } from './icons';

const GroceryActions = observer(function GroceryActions() {
  const { list, hasEdits, isStale, refresh, clear } = useGroceryStore();

  if (!list) return null;

  const confirmRefresh = () => {
    if (!hasEdits) {
      refresh();
      return;
    }
    Alert.alert('Обновить список?', 'Ручные правки количества будут потеряны.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Обновить', style: 'destructive', onPress: refresh },
    ]);
  };

  const confirmClear = () =>
    Alert.alert('Очистить список?', 'Все продукты и отметки будут удалены.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Очистить', style: 'destructive', onPress: clear },
    ]);

  return (
    <View style={styles.actions}>
      <Pressable
        style={({ pressed }) => styles.accentButton(pressed)}
        hitSlop={8}
        accessibilityLabel={isStale ? 'Обновить список, продукты устарели' : 'Обновить список'}
        onPress={confirmRefresh}>
        <RefreshIcon color="#FFFFFF" size={18} />
        {isStale ? <View style={styles.staleDot} /> : null}
      </Pressable>
      <Pressable
        style={({ pressed }) => styles.mutedButton(pressed)}
        hitSlop={8}
        accessibilityLabel="Очистить список"
        onPress={confirmClear}>
        <TrashIcon color="#FFFFFF" size={18} />
      </Pressable>
    </View>
  );
});

export function GroceryNavbarContent() {
  return (
    <View style={styles.content}>
      <Text style={styles.title}>Продукты</Text>
      <GroceryActions />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.three,
  },
  title: {
    ...theme.typography.cardTitle,
    fontFamily: theme.fonts.sans,
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.two,
  },
  accentButton: (pressed: boolean) => ({
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent,
    opacity: pressed ? 0.85 : 1,
  }),
  staleDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: '#FFFFFF',
  },
  mutedButton: (pressed: boolean) => ({
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    backgroundColor: pressed ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.16)',
  }),
}));
