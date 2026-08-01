import type { Day, Meal } from '@/features/day-card/types';
import { MOCK_RECIPES } from '@/features/day-card/mock';

import type { Week, WeekRange } from '../types';
import { addDays, eachDay, startOfWeek, todayId, weekdayName, type DateId } from './dates';

export const MAX_WEEK_DAYS = 7;

/** Slots every new day starts with — mirrors the day-card mock template. */
function buildMeals(dateId: DateId): Meal[] {
  return [
    { id: `${dateId}-m-breakfast`, title: 'Завтрак', category: 'breakfast', servings: 2, recipe: null },
    { id: `${dateId}-m-lunch`, title: 'Обед', category: 'lunch', servings: 2, recipe: null },
    { id: `${dateId}-m-dinner`, title: 'Ужин', category: 'dinner', servings: 2, recipe: null },
  ];
}

function buildDay(dateId: DateId): Day {
  return { id: dateId, weekday: weekdayName(dateId), meals: buildMeals(dateId) };
}

export function buildWeek(range: WeekRange): Week {
  return {
    id: `week-${range.start}`,
    start: range.start,
    end: range.end,
    days: eachDay(range.start, range.end).map(buildDay),
  };
}

/** Move a week to new dates keeping the days that survive; days are matched by date (day.id). */
export function resizeWeek(week: Week, range: WeekRange): Week {
  const existing = new Map(week.days.map(day => [day.id, day]));
  return {
    ...week,
    start: range.start,
    end: range.end,
    days: eachDay(range.start, range.end).map(dateId => existing.get(dateId) ?? buildDay(dateId)),
  };
}

/** The app always starts with the calendar week around today; first breakfast is pre-filled like the mock. */
export function initialWeeks(): Week[] {
  const start = startOfWeek(todayId());
  const week = buildWeek({ start, end: addDays(start, MAX_WEEK_DAYS - 1) });
  week.days[0].meals[0].recipe = MOCK_RECIPES[0];
  return [week];
}

/** Default proposal for a new week: the 7 days right after the last existing week. */
export function suggestRange(weeks: Week[]): WeekRange {
  const lastEnd = weeks.reduce((max, week) => (week.end > max ? week.end : max), weeks[0].end);
  const start = addDays(lastEnd, 1);
  return { start, end: addDays(start, MAX_WEEK_DAYS - 1) };
}

/** Every date already taken by a week, except the one being edited. */
export function occupiedDates(weeks: Week[], excludeId?: string): Set<DateId> {
  const taken = new Set<DateId>();
  for (const week of weeks) {
    if (week.id === excludeId) continue;
    for (const day of eachDay(week.start, week.end)) taken.add(day);
  }
  return taken;
}

/**
 * Furthest allowed end for a range starting at `start`: capped by the 7-day limit
 * and by the first occupied day after the start.
 */
export function maxRangeEnd(start: DateId, occupied: Set<DateId>): DateId {
  let end = start;
  for (let step = 1; step < MAX_WEEK_DAYS; step += 1) {
    const next = addDays(start, step);
    if (occupied.has(next)) break;
    end = next;
  }
  return end;
}
