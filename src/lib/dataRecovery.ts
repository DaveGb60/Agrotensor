// Data Recovery: scans every IndexedDB on the current origin for orphaned
// AgroTensor data (from older app versions, corrupted schemas, or backup
// snapshots) and restores it into the current live database.
//
// Also maintains an auto-snapshot in a SEPARATE IndexedDB (`agrotensor-db-backup`)
// so that future app updates always have a rescue copy — completely
// independent of the primary schema.

import {
  FarmProject,
  FarmRecord,
  FarmAnimal,
  importProject,
  importRecord,
  importAnimal,
  getAllProjects,
  getAllRecords,
  getAllAnimals,
  normalizeAnimal,
  createDefaultProjectDetails,
  createDefaultBreedingProjectDetails,
} from './db';

const BACKUP_DB_NAME = 'agrotensor-db-backup';
const BACKUP_STORE = 'snapshot';
const BACKUP_KEY = 'latest';
const LAST_SNAPSHOT_KEY = 'agrotensor.last_snapshot_at';

export interface RecoveryScanResult {
  source: string; // human label e.g. "agrotensor-db (v3) / projects"
  dbName: string;
  storeName: string;
  projects: FarmProject[];
  records: FarmRecord[];
  animals: FarmAnimal[];
}

export interface RecoverySummary {
  scans: RecoveryScanResult[];
  totalProjects: number;
  totalRecords: number;
  totalAnimals: number;
  liveProjectCount: number;
  hasSnapshot: boolean;
  snapshotAt?: string;
}

// ---------- helpers ----------

function looksLikeProject(o: unknown): o is FarmProject {
  if (!o || typeof o !== 'object') return false;
  const p = o as Record<string, unknown>;
  return typeof p.id === 'string' && typeof p.title === 'string' && (
    'startDate' in p || 'createdAt' in p || 'details' in p || 'customColumns' in p
  );
}

function looksLikeRecord(o: unknown): o is FarmRecord {
  if (!o || typeof o !== 'object') return false;
  const r = o as Record<string, unknown>;
  return typeof r.id === 'string' && typeof r.projectId === 'string' &&
    ('produceRevenue' in r || 'produceAmount' in r || 'customFields' in r || 'date' in r);
}

function looksLikeAnimal(o: unknown): o is FarmAnimal {
  if (!o || typeof o !== 'object') return false;
  const a = o as Record<string, unknown>;
  return typeof a.id === 'string' && typeof a.projectId === 'string' &&
    'animalId' in a && ('sex' in a || 'healthStatus' in a);
}

function normalizeProject(p: FarmProject): FarmProject {
  const projectType = (p as any).projectType || 'produce';
  return {
    ...p,
    projectType,
    isCompleted: p.isCompleted ?? false,
    customColumns: p.customColumns ?? [],
    customColumnTypes: p.customColumnTypes ?? {},
    recordType: p.recordType ?? 'standard',
    details:
      projectType === 'produce'
        ? (p.details ?? createDefaultProjectDetails())
        : (p.details ?? createDefaultBreedingProjectDetails()),
    createdAt: p.createdAt ?? new Date().toISOString(),
    updatedAt: p.updatedAt ?? new Date().toISOString(),
  };
}

async function listDatabases(): Promise<string[]> {
  try {
    // Chrome/Edge/Firefox 126+
    const anyIdb = indexedDB as unknown as {
      databases?: () => Promise<Array<{ name?: string }>>;
    };
    if (typeof anyIdb.databases === 'function') {
      const dbs = await anyIdb.databases();
      return dbs.map((d) => d.name).filter((n): n is string => !!n);
    }
  } catch {
    /* ignore */
  }
  // Fallback: try known names
  return ['agrotensor-db', BACKUP_DB_NAME];
}

function openRaw(name: string, version?: number): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    let req: IDBOpenDBRequest;
    try {
      req = version ? indexedDB.open(name, version) : indexedDB.open(name);
    } catch {
      resolve(null);
      return;
    }
    // If we open without a version and it doesn't exist, IDB will create it
    // with version 1 and an empty store list — that's fine, we'll just see
    // objectStoreNames.length === 0 and skip it.
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      /* opened fresh — will be handled in success */
    };
  });
}

function getAllFromStore<T = unknown>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

// ---------- scan ----------

export async function scanForRecoverableData(): Promise<RecoverySummary> {
  const dbNames = await listDatabases();
  const scans: RecoveryScanResult[] = [];

  for (const name of dbNames) {
    // Skip totally unrelated DBs to avoid opening random third-party ones
    if (!/agrotensor|agro-tensor|farm/i.test(name)) continue;

    const db = await openRaw(name);
    if (!db) continue;

    const storeNames = Array.from(db.objectStoreNames);
    for (const storeName of storeNames) {
      const rows = await getAllFromStore(db, storeName);
      if (!rows.length) continue;

      // If store contains the snapshot wrapper, unpack it
      if (storeName === BACKUP_STORE && rows.length === 1 && (rows[0] as any)?.projects) {
        const snap = rows[0] as {
          projects?: FarmProject[];
          records?: FarmRecord[];
          animals?: FarmAnimal[];
        };
        const projects = (snap.projects || []).filter(looksLikeProject).map(normalizeProject);
        const records = (snap.records || []).filter(looksLikeRecord);
        const animals = (snap.animals || []).filter(looksLikeAnimal).map(normalizeAnimal);
        if (projects.length || records.length || animals.length) {
          scans.push({
            source: `${name} / snapshot`,
            dbName: name,
            storeName,
            projects,
            records,
            animals,
          });
        }
        continue;
      }

      const projects = rows.filter(looksLikeProject).map(normalizeProject);
      const records = rows.filter(looksLikeRecord);
      const animals = rows.filter(looksLikeAnimal).map(normalizeAnimal);

      if (projects.length || records.length || animals.length) {
        scans.push({
          source: `${name} / ${storeName}`,
          dbName: name,
          storeName,
          projects,
          records,
          animals,
        });
      }
    }
    db.close();
  }

  const liveProjects = await getAllProjects().catch(() => []);
  const totalProjects = scans.reduce((s, x) => s + x.projects.length, 0);
  const totalRecords = scans.reduce((s, x) => s + x.records.length, 0);
  const totalAnimals = scans.reduce((s, x) => s + x.animals.length, 0);
  const snapshotScan = scans.find((s) => s.dbName === BACKUP_DB_NAME);
  const snapshotAt = localStorage.getItem(LAST_SNAPSHOT_KEY) || undefined;

  return {
    scans,
    totalProjects,
    totalRecords,
    totalAnimals,
    liveProjectCount: liveProjects.length,
    hasSnapshot: !!snapshotScan,
    snapshotAt,
  };
}

// ---------- restore ----------

export interface RestoreOutcome {
  projectsRestored: number;
  recordsRestored: number;
  animalsRestored: number;
  skipped: number;
}

export async function restoreFromScan(scans: RecoveryScanResult[]): Promise<RestoreOutcome> {
  // Deduplicate by id across all scans (first occurrence wins)
  const projectsById = new Map<string, FarmProject>();
  const recordsById = new Map<string, FarmRecord>();
  const animalsById = new Map<string, FarmAnimal>();

  for (const scan of scans) {
    for (const p of scan.projects) if (!projectsById.has(p.id)) projectsById.set(p.id, p);
    for (const r of scan.records) if (!recordsById.has(r.id)) recordsById.set(r.id, r);
    for (const a of scan.animals) if (!animalsById.has(a.id)) animalsById.set(a.id, a);
  }

  // Live data — don't overwrite live projects/records
  const [liveProjects, liveRecords, liveAnimals] = await Promise.all([
    getAllProjects().catch(() => [] as FarmProject[]),
    getAllRecords().catch(() => [] as FarmRecord[]),
    getAllAnimals().catch(() => [] as FarmAnimal[]),
  ]);
  const liveProjectIds = new Set(liveProjects.map((p) => p.id));
  const liveRecordIds = new Set(liveRecords.map((r) => r.id));
  const liveAnimalIds = new Set(liveAnimals.map((a) => a.id));

  let projectsRestored = 0;
  let recordsRestored = 0;
  let animalsRestored = 0;
  let skipped = 0;

  for (const p of projectsById.values()) {
    if (liveProjectIds.has(p.id)) {
      skipped++;
      continue;
    }
    try {
      await importProject(p);
      projectsRestored++;
    } catch {
      skipped++;
    }
  }

  for (const r of recordsById.values()) {
    if (liveRecordIds.has(r.id)) {
      skipped++;
      continue;
    }
    try {
      await importRecord(r);
      recordsRestored++;
    } catch {
      skipped++;
    }
  }

  for (const a of animalsById.values()) {
    if (liveAnimalIds.has(a.id)) {
      skipped++;
      continue;
    }
    try {
      await importAnimal(a);
      animalsRestored++;
    } catch {
      skipped++;
    }
  }

  return { projectsRestored, recordsRestored, animalsRestored, skipped };
}

// ---------- auto snapshot ----------

function openBackupDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(BACKUP_DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(BACKUP_STORE)) {
          db.createObjectStore(BACKUP_STORE, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function writeAutoSnapshot(): Promise<boolean> {
  try {
    const [projects, records, animals] = await Promise.all([
      getAllProjects().catch(() => [] as FarmProject[]),
      getAllRecords().catch(() => [] as FarmRecord[]),
      getAllAnimals().catch(() => [] as FarmAnimal[]),
    ]);
    if (!projects.length && !records.length && !animals.length) {
      // Nothing to snapshot — but don't overwrite an existing snapshot with empty
      return false;
    }
    const db = await openBackupDB();
    if (!db) return false;

    const snapshot = {
      key: BACKUP_KEY,
      savedAt: new Date().toISOString(),
      projects,
      records,
      animals,
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(BACKUP_STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
      tx.objectStore(BACKUP_STORE).put(snapshot);
    });
    db.close();
    localStorage.setItem(LAST_SNAPSHOT_KEY, snapshot.savedAt);
    return true;
  } catch {
    return false;
  }
}

// Debounced snapshot — safe to call often
let snapshotTimer: ReturnType<typeof setTimeout> | null = null;
export function scheduleAutoSnapshot(delayMs = 5000): void {
  if (snapshotTimer) clearTimeout(snapshotTimer);
  snapshotTimer = setTimeout(() => {
    void writeAutoSnapshot();
  }, delayMs);
}

export function getLastSnapshotAt(): string | null {
  return localStorage.getItem(LAST_SNAPSHOT_KEY);
}
