import { useCallback } from 'react';

import { DayCard } from '@/features/day-card/components/day-card';
import { DayCardFooter } from '@/features/day-card/components/day-card-footer';
import { MealList } from '@/features/day-card/components/meal-list';
import { useDayPlan } from '@/features/day-card/hooks/use-day-plan';
import { MOCK_RECIPES } from '@/features/day-card/mock';
import type { Day, Meal } from '@/features/day-card/types';

interface DayPlanCardProps {
  day: Day;
  defaultExpanded?: boolean;
}

/** Owns the state of a single day, so a week is just a list of these. */
export function DayPlanCard({ day: initialDay, defaultExpanded }: DayPlanCardProps) {
  const { day, setServings, attachRecipe, renameMeal, removeMeal, addMeal } =
    useDayPlan(initialDay);

  /* Placeholder until the recipe list route lands: picks the first recipe of the category. */
  const onPickRecipe = useCallback(
    (meal: Meal) => {
      const recipe = MOCK_RECIPES.find(item => item.category === meal.category);

      if (recipe) attachRecipe(meal.id, recipe);
    },
    [attachRecipe],
  );

  /* Title and category come from a form later; a snack is the sane default. */
  const onAddMeal = useCallback(() => addMeal('Перекус', 'snack'), [addMeal]);

  return (
    <DayCard day={day} defaultExpanded={defaultExpanded}>
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
}
