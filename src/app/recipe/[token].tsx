import { router, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { servingsWord } from '@/features/day-card/lib/servings';
import {
  sharedRecipeMessage,
  type SharedRecipePayload,
  type SharedRecipeReason,
} from '@/features/recipes/lib/share';
import { toIngredientUnit, unitLabel } from '@/features/recipes/lib/units';
import { useAuthStore, useRecipesStore } from '@/stores/store-context';

export default observer(function SharedRecipeScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const store = useRecipesStore();
  const { session, sessionChecked } = useAuthStore();
// зачаем столок стеттйо елс иможно один ? или ест ьсмысл в этом ?
  const [payload, setPayload] = useState<SharedRecipePayload | null>(null);
  const [reason, setReason] = useState<SharedRecipeReason | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
        // что эта за дичть блять что ты написал и что ты здесь делать без обработок ошибок в само вызывающей функци 
    // полная чушь

    if (!sessionChecked) return;

    let cancelled = false;

    void (async () => {
      if (!token) {
        router.replace('/');
        return;
      }

      if (!session) {
        await store.savePendingShare(token);
        if (!cancelled) router.replace('/');
        return;
      }

      const preview = await store.previewSharedRecipe(token);
      if (cancelled) return;
      if (preview.ok) setPayload(preview.payload);
      else setReason(preview.reason);
    })();

    return () => {
      cancelled = true;
    };
  }, [session, sessionChecked, store, token]);

  const add = async () => {
    // где и как идет обратобка ошибок ? доавть скобки к иф везед блять 
    if (!token) return;
    setImporting(true);
    const result = await store.importSharedRecipe(token);
    setImporting(false);
    if (result.ok) router.replace('/');
    else setReason(result.reason);
  };

  if (reason) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>{sharedRecipeMessage(reason)}</Text>
        <Pressable onPress={() => router.replace('/')}>
          <Text style={styles.action}>Закрыть</Text>
        </Pressable>
      </View>
    );
  }

  if (!payload) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.label}>Рецепт по ссылке</Text>
      <Text style={styles.title}>{payload.recipe.title}</Text>
      {payload.recipe.description ? (
        <Text style={styles.description}>{payload.recipe.description}</Text>
      ) : null}

      <View style={styles.block}>
        <Text style={styles.blockHeading}>
          Ингредиенты на {payload.recipe.servings} {servingsWord(payload.recipe.servings)}
        </Text>
        {payload.ingredients.map((item, index) => (
          <Text key={`${item.name}-${index}`} style={styles.ingredient}>
            {item.name} — {item.amount} {unitLabel(toIngredientUnit(item.unit))}
          </Text>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => styles.button(pressed, importing)}
        disabled={importing}
        onPress={add}
      >
        <Text style={styles.buttonLabel}>Добавить себе</Text>
      </Pressable>

      <Pressable onPress={() => router.replace('/')}>
        <Text style={styles.action}>Не сейчас</Text>
      </Pressable>
    </ScrollView>
  );
});

const styles = StyleSheet.create(theme => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    gap: theme.spacing.three,
    padding: theme.spacing.three,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.three,
    backgroundColor: theme.colors.background,
  },
  label: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    ...theme.typography.cardTitle,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
  },
  description: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textSecondary,
  },
  block: {
    gap: theme.spacing.two,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.three,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  blockHeading: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  ingredient: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
  },
  message: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
  },
  action: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.accent,
  },
  button: (pressed: boolean, disabled: boolean) => ({
    alignItems: 'center',
    paddingVertical: theme.spacing.three,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
    opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
  }),
  buttonLabel: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}));
