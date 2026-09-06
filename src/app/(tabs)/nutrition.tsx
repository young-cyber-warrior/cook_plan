import { observer } from 'mobx-react-lite';
import { Pressable, SectionList, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AddGroceryItemSheet } from '@/features/grocery/components/add-grocery-item-sheet';
import { GroceryItemCard } from '@/features/grocery/components/grocery-item-card';
import { WeekPickSheet } from '@/features/grocery/components/week-pick-sheet';
import type { GroceryItem } from '@/features/grocery/types';
import { useGroceryStore } from '@/stores/store-context';

const formatRecipeCount = (count: number) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} рецепта`;
  return `${count} рецептов`;
};

export default observer(function NutritionScreen() {
  const {
    list,
    recipeItems,
    customItems,
    openSheet,
    openCustomSheet,
    toggleItem,
    setItemAmount,
    removeItem,
  } = useGroceryStore();

  /** Own products outlive the generated list, so the CTA follows the recipe half alone. */
  const actions = (
    <>
      {recipeItems.length === 0 && (
        <Pressable style={({ pressed }) => styles.cta(pressed)} onPress={openSheet}>
          <Text style={styles.ctaLabel}>Получить список продуктов</Text>
        </Pressable>
      )}
      <Pressable style={({ pressed }) => styles.secondaryCta(pressed)} onPress={openCustomSheet}>
        <Text style={styles.secondaryCtaLabel}>Добавить свой продукт</Text>
      </Pressable>
    </>
  );

  if (recipeItems.length === 0 && customItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Список ещё не сформирован.</Text>
          {actions}
        </View>

        <WeekPickSheet />
        <AddGroceryItemSheet />
      </View>
    );
  }

  const sections: { title: string; meta: string; data: GroceryItem[] }[] = [];

  if (recipeItems.length > 0) {
    sections.push({
      title: 'Из рецептов',
      meta: list ? formatRecipeCount(list.recipeCount) : '',
      data: recipeItems,
    });
  }

  if (customItems.length > 0) {
    sections.push({ title: 'Свои продукты', meta: '', data: customItems });
  }

  const total = recipeItems.length + customItems.length;
  const checked = [...recipeItems, ...customItems].filter(item => item.checked).length;

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              {total} продуктов · куплено {checked}
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.meta ? (
              <View style={styles.chip}>
                <Text style={styles.chipLabel}>из {section.meta}</Text>
              </View>
            ) : null}
          </View>
        )}
        ListFooterComponent={<View style={styles.footer}>{actions}</View>}
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
      <AddGroceryItemSheet />
    </View>
  );
});

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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.two,
    paddingBottom: theme.spacing.one,
    paddingHorizontal: theme.spacing.one,
    backgroundColor: theme.colors.background,
  },
  sectionTitle: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
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
    alignItems: 'center',
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
  footer: {
    gap: theme.spacing.two,
    paddingTop: theme.spacing.three,
  },
  secondaryCta: (pressed: boolean) => ({
    alignItems: 'center',
    paddingVertical: theme.spacing.three,
    paddingHorizontal: theme.spacing.four,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.accent,
    backgroundColor: pressed ? theme.colors.backgroundSelected : 'transparent',
  }),
  secondaryCtaLabel: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    color: theme.colors.accent,
  },
}));
