import type { Day, PersonalLayer } from '@/features/day-card/types';
import type { DateId } from '@/features/weeks/lib/dates';
import { mealDayKey } from '@/stores/mappers';
import { usePersonalStore, useWeeksStore } from '@/stores/store-context';

export interface PersonalDay {
  day: Day | null;
  personal: PersonalLayer;
}

/**
 * The current user's layer over one day.
 * The store getters are read here, in render, so the observer subscribes to them.
 */
export function usePersonalLayer(weekId: string, dayId: DateId): PersonalLayer {
  const { adjustmentByMealId, extrasByWeekDay } = usePersonalStore();

  return {
    adjustmentByMealId,
    extras: extrasByWeekDay.get(mealDayKey(weekId, dayId)) ?? [],
  };
}

/** Resolves a day and its personal layer from route params. */
export function usePersonalDay(weekId: string, dayId: DateId): PersonalDay {
  const { weeks } = useWeeksStore();
  const personal = usePersonalLayer(weekId, dayId);

  const week = weeks.find(item => item.id === weekId) ?? null;

  return {
    day: week?.days.find(item => item.id === dayId) ?? null,
    personal,
  };
}
