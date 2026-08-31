const MODEL = 'gemini-3.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export interface NormalizedIngredient {
  id: string;
  query: string;
  density: number;
  recognized: boolean;
  note: string;
}

export interface CandidateChoice {
  id: string;
  index: number;
}

interface SchemaProperty {
  type: string;
  description?: string;
}

const NORMALIZE_PROMPT = `Названия продуктов -> поисковые запросы к USDA FoodData Central.

query: продукт по-английски как в USDA, сырой, без обработки ("гречка" -> "buckwheat groats raw").
density: граммов в 1 мл; для твёрдых 1.
recognized: false для бессмыслицы, опечаток без очевидного прочтения и слишком общих названий; query тогда пустой.
note: по-русски вариант, если выбирал его сам ("подсолнечное рафинированное"); иначе пустая строка.

id — как пришёл. По одному элементу на ингредиент.`;

const SELECT_PROMPT = `Выбор записи USDA под продукт пользователя.

index: позиция подходящего кандидата в его candidates с 0; -1, если ни один не тот же продукт.
Без указанной обработки предпочитай сырой продукт без добавок.

id — как пришёл. По одному элементу на ингредиент.`;

const arraySchema = (properties: Record<string, SchemaProperty>) => ({
  type: 'OBJECT',
  properties: {
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties,
        required: Object.keys(properties),
      },
    },
  },
  required: ['items'],
});

async function generate<T>(
  apiKey: string,
  systemPrompt: string,
  payload: unknown,
  responseSchema: unknown,
): Promise<T[]> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: JSON.stringify(payload) }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema },
    }),
  });

  if (!response.ok) throw new Error(`gemini_failed:${response.status}`);

  const body = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('gemini_empty_response');

  return (JSON.parse(text) as { items?: T[] }).items ?? [];
}

export function normalizeIngredients(
  apiKey: string,
  ingredients: { id: string; name: string; amount: number; unit: string }[],
): Promise<NormalizedIngredient[]> {
  return generate<NormalizedIngredient>(
    apiKey,
    NORMALIZE_PROMPT,
    { ingredients },
    arraySchema({
      id: { type: 'STRING' },
      query: { type: 'STRING' },
      density: { type: 'NUMBER' },
      recognized: { type: 'BOOLEAN' },
      note: { type: 'STRING' },
    }),
  );
}

export function selectCandidates(
  apiKey: string,
  items: { id: string; name: string; candidates: string[] }[],
): Promise<CandidateChoice[]> {
  return generate<CandidateChoice>(
    apiKey,
    SELECT_PROMPT,
    { items },
    arraySchema({
      id: { type: 'STRING' },
      index: { type: 'INTEGER' },
    }),
  );
}
