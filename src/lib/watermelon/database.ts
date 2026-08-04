import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { schema } from './schema';
import { Project, RecordModel, Animal } from './models';

const MIGRATION_KEY = 'agrotensor-wmdb-migrated';

let flushHooksInstalled = false;

/**
 * Grab the underlying LokiJS instance so we can force a synchronous-ish flush
 * to IndexedDB. Without this, writes made shortly before a reload/close can be
 * lost because Loki's autosave timer never fires.
 */
function getLoki(adapter: LokiJSAdapter): { saveDatabase?: (cb?: () => void) => void } | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const driver = (adapter as any)._driver;
    return driver?.loki ?? null;
  } catch {
    return null;
  }
}

export function flushDatabase(adapter: LokiJSAdapter): Promise<void> {
  const loki = getLoki(adapter);
  if (!loki || typeof loki.saveDatabase !== 'function') return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    try {
      loki.saveDatabase!(finish);
    } catch {
      finish();
    }
    // Never hang the caller on a stuck save
    setTimeout(finish, 1500);
  });
}

function installFlushHooks(adapter: LokiJSAdapter) {
  if (flushHooksInstalled || typeof window === 'undefined') return;
  flushHooksInstalled = true;

  const flush = () => {
    void flushDatabase(adapter);
  };

  // pagehide/visibilitychange are the reliable "app is going away" signals on
  // mobile browsers; beforeunload alone is not fired on Android/iOS.
  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}

export async function createDatabase(): Promise<Database> {
  console.trace('CREATE_DATABASE_CALLED');
  const adapter = new LokiJSAdapter({
    schema,
    useWebWorker: false,
    useIncrementalIndexedDB: true,
    dbName: 'agrotensor-wmdb',
    // Persist aggressively — rural users close the app abruptly.
    extraLokiOptions: {
      autosave: true,
      autosaveInterval: 250,

    },
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
    modelClasses: [Project, RecordModel, Animal],
  });

  installFlushHooks(adapter);

  // Expose a flush helper on the database instance for write paths that need
  // an immediate durable checkpoint (imports, restores, migrations).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (database as any).flush = () => flushDatabase(adapter);

  return database;
}

export async function flushDB(database: Database): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fn = (database as any).flush;
  if (typeof fn === 'function') await fn();
}

export async function needsMigration(database: Database): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const migrated = localStorage.getItem(MIGRATION_KEY);
    if (migrated === 'true') return false;

    const projects = await database.get('projects').query().fetchCount();
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
    try {
      localStorage.setItem(MIGRATION_KEY, 'true');
    } catch {
      /* ignore */
    }
  }
}
