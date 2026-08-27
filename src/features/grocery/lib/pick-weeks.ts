import type { DateId } from '@/features/weeks/lib/dates';
import type { Week } from '@/features/weeks/types';

export function initialPick(weeks: Week[], previousIds: string[], today: DateId): string[] {
  const previous = new Set(previousIds);
  const picked: string[] = [];
  const current: string[] = [];

  for (const week of weeks) {
    if (previous.has(week.id)) picked.push(week.id);
    else if (today >= week.start && today <= week.end) current.push(week.id);
  }

  return picked.length > 0 ? picked : current;
}
