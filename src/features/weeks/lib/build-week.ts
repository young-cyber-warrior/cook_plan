import type { Week, WeekRange } from '../types';
import { addDays, eachDay, startOfWeek, todayId, type DateId } from './dates';

export const MAX_WEEK_DAYS = 7;

/** Default proposal for a new week: the 7 days right after the last existing week. */
export function suggestRange(weeks: Week[]): WeekRange {
  if (weeks.length === 0) {
    const start = startOfWeek(todayId());
    return { start, end: addDays(start, MAX_WEEK_DAYS - 1) };
  }

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
