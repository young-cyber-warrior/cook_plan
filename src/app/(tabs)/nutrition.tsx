import { FlatList, Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { GroceryItemCard } from '@/features/grocery/components/grocery-item-card';
import { WeekPickSheet } from '@/features/grocery/components/week-pick-sheet';
import { useGroceryContext } from '@/features/grocery/context/grocery-context';

const formatRecipeCount = (count: number) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} рецепта`;
  return `${count} рецептов`;
};

export default function NutritionScreen() {
  const { list, openSheet, toggleItem, setItemAmount, removeItem } = useGroceryContext();

  if (!list) {
    return (
      <View style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Список ещё не сформирован.</Text>
          <Pressable style={({ pressed }) => styles.cta(pressed)} onPress={openSheet}>
            <Text style={styles.ctaLabel}>Получить список продуктов</Text>
          </Pressable>
        </View>

        <WeekPickSheet />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={list.items}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              {list.items.length} продуктов · куплено{' '}
              {list.items.filter(item => item.checked).length}
            </Text>
            <View style={styles.chip}>
              <Text style={styles.chipLabel}>из {formatRecipeCount(list.recipeCount)}</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <GroceryItemCard
            item={item}
            onToggle={() => toggleItem(item.key)}
            onRemove={() => removeItem(item.key)}
            onAmountChange={amount => setItemAmount(item.key, amount)}
          />
        )}
      />

      <WeekPickSheet />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.three,
    gap: theme.spacing.two,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.one,
    paddingBottom: theme.spacing.two,
  },
  summaryText: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textSecondary,
  },
  chip: {
    paddingVertical: theme.spacing.half,
    paddingHorizontal: theme.spacing.two,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.badgeBackground,
  },
  chipLabel: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.badgeText,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.four,
    paddingHorizontal: theme.spacing.five,
  },
  emptyText: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  cta: (pressed: boolean) => ({
    paddingVertical: theme.spacing.three,
    paddingHorizontal: theme.spacing.four,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.accent,
    opacity: pressed ? 0.85 : 1,
  }),
  ctaLabel: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}));
