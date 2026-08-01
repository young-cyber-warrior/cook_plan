import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { PlusIcon } from '@/features/day-card/components/icons';
import { useAddRecipeContext } from '@/features/recipes/context/add-recipe-context';

export function RecipesNavbarContent() {
  const { open } = useAddRecipeContext();

  return (
    <View style={styles.content}>
      <Text style={styles.title}>Рецепты</Text>

      <Pressable style={({ pressed }) => styles.addButton(pressed)} hitSlop={8} onPress={open}>
        <PlusIcon color="#FFFFFF" size={20} />
      </Pressable>
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
  addButton: (pressed: boolean) => ({
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent,
    opacity: pressed ? 0.85 : 1,
  }),
}));
