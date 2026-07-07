import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { schema } from './schema';
import { Project, Record, Animal } from './models';

const MIGRATION_KEY = 'agrotensor-wmdb-migrated';

export async function createDatabase(): Promise<Database> {
  const adapter = new LokiJSAdapter({
    schema,
    useWebWorker: false,
    useIncrementalIndexedDB: true,
    dbName: 'agrotensor-wmdb',
    onQuotaExceededError: (error) => {
      console.error('WatermelonDB quota exceeded:', error);
    },
    onSetUpError: (error) => {
      console.error('WatermelonDB setup error:', error);
    },
    extraIncrementalIDBOptions: {
      onDidOverwrite: () => {
        console.warn('WatermelonDB was overwritten by another tab');
      },
      onversionchange: () => {
        console.warn('WatermelonDB version changed, reloading');
        window.location.reload();
      },
    },
  });

  const database = new Database({
    adapter,
    modelClasses: [Project, Record, Animal],
  });

  return database;
}

export async function needsMigration(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const migrated = localStorage.getItem(MIGRATION_KEY);
    if (migrated === 'true') return false;

    const db = await createDatabase();
    const projects = await db.get('projects').query().fetchCount();
    if (projects > 0) {
      localStorage.setItem(MIGRATION_KEY, 'true');
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function markMigrationComplete(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MIGRATION_KEY, 'true');
  }
}
