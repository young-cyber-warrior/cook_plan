import { AttachmentTable, column, Schema, Table, type RowType } from '@powersync/react-native';

const synced = {
  owner_id: column.text,
  deleted: column.integer,
  created_at: column.text,
  updated_at: column.text,
};

const categories = new Table({
  slug: column.text,
  label: column.text,
  position: column.integer,
  ...synced,
});

const recipes = new Table(
  {
    category_id: column.text,
    title: column.text,
    description: column.text,
    calories: column.real,
    protein: column.real,
    fat: column.real,
    carbs: column.real,
    ...synced,
  },
  { indexes: { category: ['category_id'] } },
);

const recipe_ingredients = new Table(
  {
    recipe_id: column.text,
    name: column.text,
    amount: column.real,
    unit: column.text,
    position: column.integer,
    ...synced,
  },
  { indexes: { recipe: ['recipe_id'] } },
);

const weeks = new Table({
  start_date: column.text,
  end_date: column.text,
  ...synced,
});

const meals = new Table(
  {
    week_id: column.text,
    day: column.text,
    title: column.text,
    category: column.text,
    servings: column.integer,
    recipe_id: column.text,
    position: column.integer,
    ...synced,
  },
  { indexes: { week: ['week_id'] } },
);

const grocery_lists = new Table({
  week_ids: column.text,
  source_hash: column.text,
  recipe_count: column.integer,
  ...synced,
});

const grocery_items = new Table(
  {
    list_id: column.text,
    name: column.text,
    amount: column.real,
    unit: column.text,
    checked: column.integer,
    edited: column.integer,
    ...synced,
  },
  { indexes: { list: ['list_id'] } },
);

const shares = new Table({
  resource_type: column.text,
  resource_id: column.text,
  user_id: column.text,
  role: column.text,
  ...synced,
});

const recipe_photos = new Table(
  {
    recipe_id: column.text,
    storage_path: column.text,
    content_hash: column.text,
    width: column.integer,
    height: column.integer,
    bytes: column.integer,
    position: column.integer,
    ...synced,
  },
  { indexes: { recipe: ['recipe_id'] } },
);

const families = new Table({
  name: column.text,
  ...synced,
});

const family_members = new Table(
  {
    family_id: column.text,
    user_id: column.text,
    role: column.text,
    ...synced,
  },
  { indexes: { family: ['family_id'] } },
);

const invites = new Table(
  {
    family_id: column.text,
    token: column.text,
    expires_at: column.text,
    max_uses: column.integer,
    uses: column.integer,
    revoked: column.integer,
    ...synced,
  },
  { indexes: { family: ['family_id'] } },
);

export const AppSchema = new Schema({
  categories,
  recipes,
  recipe_ingredients,
  weeks,
  meals,
  grocery_lists,
  grocery_items,
  shares,
  families,
  family_members,
  invites,
  recipe_photos,
  attachments: new AttachmentTable(),
});

export type CategoryRow = RowType<typeof categories>;
export type RecipeRow = RowType<typeof recipes>;
export type RecipeIngredientRow = RowType<typeof recipe_ingredients>;
export type WeekRow = RowType<typeof weeks>;
export type MealRow = RowType<typeof meals>;
export type GroceryListRow = RowType<typeof grocery_lists>;
export type GroceryItemRow = RowType<typeof grocery_items>;
export type ShareRow = RowType<typeof shares>;
export type FamilyRow = RowType<typeof families>;
export type FamilyMemberRow = RowType<typeof family_members>;
export type InviteRow = RowType<typeof invites>;
export type RecipePhotoRow = RowType<typeof recipe_photos>;
