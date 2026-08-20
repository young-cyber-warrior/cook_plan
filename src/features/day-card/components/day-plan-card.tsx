import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import { DayCard } from '@/features/day-card/components/day-card';
import { DayCardFooter } from '@/features/day-card/components/day-card-footer';
import { MealList } from '@/features/day-card/components/meal-list';
import type { Day, Meal } from '@/features/day-card/types';
import { useRecipesStore, useWeeksStore } from '@/stores/store-context';

interface DayPlanCardProps {
  day: Day;
}

export const DayPlanCard = observer(function DayPlanCard({ day }: DayPlanCardProps) {
  const { setServings, attachRecipe, renameMeal, removeMeal, addMeal } = useWeeksStore();
  const { findBySlotCategory } = useRecipesStore();

  const onPickRecipe = useCallback(
    (meal: Meal) => {
      const recipe = findBySlotCategory(meal.category);

      if (recipe) attachRecipe(meal.id, recipe.id);
    },
    [findBySlotCategory, attachRecipe],
  );

  const onAddMeal = useCallback(
    () => addMeal(day.weekId, day.id, 'Перекус', 'snack'),
    [addMeal, day.weekId, day.id],
  );

  return (
    <DayCard day={day}>
      <MealList
        meals={day.meals}
        onServingsChange={setServings}
        onPickRecipe={onPickRecipe}
        onRenameMeal={renameMeal}
        onRemoveMeal={removeMeal}
        onAddMeal={onAddMeal}
      />
      <DayCardFooter day={day} />
    </DayCard>
  );
});
