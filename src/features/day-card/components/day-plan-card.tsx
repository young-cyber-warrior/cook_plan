import { router } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import { DayCard } from '@/features/day-card/components/day-card';
import { DayCardFooter } from '@/features/day-card/components/day-card-footer';
import { MealList } from '@/features/day-card/components/meal-list';
import { usePersonalLayer } from '@/features/day-card/hooks/use-personal-day';
import type { Day, Meal } from '@/features/day-card/types';
import { useMealPickStore, useWeeksStore } from '@/stores/store-context';

interface DayPlanCardProps {
  day: Day;
}

export const DayPlanCard = observer(function DayPlanCard({ day }: DayPlanCardProps) {
  const { setServings, renameMeal, removeMeal, addMeal } = useWeeksStore();
  const personal = usePersonalLayer(day.weekId, day.id);
  const { startForMeal } = useMealPickStore();

  const onPickRecipe = useCallback(
    (meal: Meal) => {
      startForMeal(meal, '/');
      router.navigate('/recipes');
    },
    [startForMeal],
  );

  const onAddMeal = useCallback(
    () => addMeal(day.weekId, day.id, 'Перекус', 'snack'),
    [addMeal, day.weekId, day.id],
  );

  const onEditMacros = useCallback(
    () =>
      router.navigate({
        pathname: '/day/[weekId]/[dayId]',
        params: { weekId: day.weekId, dayId: day.id },
      }),
    [day.weekId, day.id],
  );

  return (
    <DayCard day={day} personal={personal}>
      <MealList
        meals={day.meals}
        onServingsChange={setServings}
        onPickRecipe={onPickRecipe}
        onRenameMeal={renameMeal}
        onRemoveMeal={removeMeal}
        onAddMeal={onAddMeal}
      />
      <DayCardFooter day={day} personal={personal} onEdit={onEditMacros} />
    </DayCard>
  );
});
