import type { Day, Recipe } from '@/features/day-card/types';

const photos = (seed: string) =>
  [1, 2, 3].map(n => `https://picsum.photos/seed/${seed}-${n}/400/400`);

export const MOCK_RECIPES: Recipe[] = [
  {
    id: 'r-oatmeal',
    title: 'Овсянка с ягодами',
    category: 'breakfast',
    photos: photos('oatmeal'),
    macrosPerServing: { calories: 320, protein: 11.4, fat: 8.2, carbs: 51.6 },
  },
  {
    id: 'r-omelette',
    title: 'Омлет с овощами',
    category: 'breakfast',
    photos: photos('omelette'),
    macrosPerServing: { calories: 280, protein: 19.8, fat: 19.1, carbs: 6.4 },
  },
  {
    id: 'r-chicken-rice',
    title: 'Курица с рисом',
    category: 'lunch',
    photos: photos('chicken'),
    macrosPerServing: { calories: 520, protein: 38.5, fat: 12.7, carbs: 62.3 },
  },
  {
    id: 'r-salmon',
    title: 'Лосось на пару',
    category: 'dinner',
    photos: photos('salmon'),
    macrosPerServing: { calories: 410, protein: 34.2, fat: 24.6, carbs: 8.1 },
  },
];

/** Slots every new day starts with. */
export const MOCK_DAY: Day = {
  id: 'day-monday',
  weekday: 'Понедельник',
  meals: [
    {
      id: 'm-breakfast',
      title: 'Завтрак',
      category: 'breakfast',
      servings: 2,
      recipe: MOCK_RECIPES[0],
    },
    { id: 'm-lunch', title: 'Обед', category: 'lunch', servings: 2, recipe: null },
    { id: 'm-dinner', title: 'Ужин', category: 'dinner', servings: 2, recipe: null },
  ],
};

const WEEKDAYS = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
] as const;

/** A week of empty days; ids are namespaced so meals stay unique across cards. */
export const MOCK_WEEK: Day[] = WEEKDAYS.map((weekday, index) => ({
  id: `day-${index}`,
  weekday,
  meals: MOCK_DAY.meals.map(meal => ({
    ...meal,
    id: `day-${index}-${meal.id}`,
    /* Only the first day ships with a recipe, the rest start empty. */
    recipe: index === 0 ? meal.recipe : null,
  })),
}));
