/** Local calendar date as 'YYYY-MM-DD'; avoids UTC shifts that Date ISO parsing brings. */
export type DateId = string;

const DAY_MS = 86_400_000;

const dayFormat = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'short' });
const weekdayFormat = new Intl.DateTimeFormat('ru', { weekday: 'long' });

export function toDateId(date: Date): DateId {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseDateId(id: DateId): Date {
  const [year, month, day] = id.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(id: DateId, amount: number): DateId {
  const date = parseDateId(id);
  date.setDate(date.getDate() + amount);
  return toDateId(date);
}

/** Inclusive day count of the [start, end] range. */
export function rangeLength(start: DateId, end: DateId): number {
  return Math.round((parseDateId(end).getTime() - parseDateId(start).getTime()) / DAY_MS) + 1;
}

export function eachDay(start: DateId, end: DateId): DateId[] {
  const days: DateId[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) days.push(day);
  return days;
}

export function todayId(): DateId {
  return toDateId(new Date());
}

/** Monday of the week the given date falls into. */
export function startOfWeek(id: DateId): DateId {
  const date = parseDateId(id);
  const shift = (date.getDay() + 6) % 7;
  return addDays(id, -shift);
}

/** '27 июл' — ru short month without the trailing dot. */
export function formatDay(id: DateId): string {
  return dayFormat.format(parseDateId(id)).replace('.', '');
}

export function formatRange(start: DateId, end: DateId): string {
  return `${formatDay(start)} – ${formatDay(end)}`;
}

/** 'Понедельник' */
export function weekdayName(id: DateId): string {
  const name = weekdayFormat.format(parseDateId(id));
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function formatDayCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} день`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} дня`;
  return `${count} дней`;
}
