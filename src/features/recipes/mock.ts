import type { Recipe } from '@/features/recipes/types';

export const MOCK_RECIPES: Recipe[] = [
  {
    id: 'r-oatmeal',
    category: 'breakfast',
    title: 'Овсянка с ягодами',
    description: 'Овсяные хлопья на воде с миксом свежих ягод и мёдом.',
    macros: { calories: 320, protein: 11.4, fat: 8.2, carbs: 51.6 },
    ingredients: [
      { id: 'i-oats', name: 'Овсяные хлопья', amount: 60, unit: 'g' },
      { id: 'i-milk', name: 'Молоко', amount: 150, unit: 'ml' },
      { id: 'i-berries', name: 'Ягодная смесь', amount: 80, unit: 'g' },
      { id: 'i-honey', name: 'Мёд', amount: 15, unit: 'g' },
    ],
  },
  {
    id: 'r-omelette',
    category: 'breakfast',
    title: 'Омлет с овощами',
    description: 'Омлет из трёх яиц с болгарским перцем и помидорами.',
    macros: { calories: 280, protein: 19.8, fat: 19.1, carbs: 6.4 },
    ingredients: [
      { id: 'i-eggs', name: 'Яйца', amount: 3, unit: 'g' },
      { id: 'i-pepper', name: 'Болгарский перец', amount: 50, unit: 'g' },
      { id: 'i-tomato', name: 'Помидор', amount: 60, unit: 'g' },
      { id: 'i-oil', name: 'Оливковое масло', amount: 10, unit: 'ml' },
    ],
  },
  {
    id: 'r-chicken-rice',
    category: 'lunch',
    title: 'Курица с рисом',
    description: 'Куриное филе гриль с отварным рисом и зеленью.',
    macros: { calories: 520, protein: 38.5, fat: 12.7, carbs: 62.3 },
    ingredients: [
      { id: 'i-chicken', name: 'Куриное филе', amount: 150, unit: 'g' },
      { id: 'i-rice', name: 'Рис', amount: 120, unit: 'g' },
      { id: 'i-herbs', name: 'Зелень', amount: 10, unit: 'g' },
    ],
  },
  {
    id: 'r-salmon',
    category: 'dinner',
    title: 'Лосось на пару',
    description: 'Лосось на пару с брокколи и лимоном.',
    macros: { calories: 410, protein: 34.2, fat: 24.6, carbs: 8.1 },
    ingredients: [
      { id: 'i-salmon', name: 'Лосось', amount: 150, unit: 'g' },
      { id: 'i-broccoli', name: 'Брокколи', amount: 100, unit: 'g' },
      { id: 'i-lemon', name: 'Лимон', amount: 20, unit: 'g' },
    ],
  },
];
