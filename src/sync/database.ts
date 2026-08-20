import { PowerSyncDatabase } from '@powersync/react-native';

import { AppSchema } from './schema';

export const powersync = new PowerSyncDatabase({
  schema: AppSchema,
  database: { dbFilename: 'meal-planner.db' },
});
