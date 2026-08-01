import type { Day } from '@/features/day-card/types';

import type { DateId } from './lib/dates';

/** Inclusive date span, at most 7 days. */
export interface WeekRange {
  start: DateId;
  end: DateId;
}

export interface Week extends WeekRange {
  id: string;
  days: Day[];
}
