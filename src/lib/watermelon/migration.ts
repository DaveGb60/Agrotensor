import { Database } from '@nozbe/watermelondb';
import { FarmProject, FarmRecord, FarmAnimal, normalizeAnimal, createDefaultProjectDetails, createDefaultBreedingProjectDetails } from '@/lib/db';

const OLD_DB_NAME = 'agrotensor-db';

export async function migrateFromIndexedDB(database: Database): Promise<{
  projects: number;
  records: number;
  animals: number;
}> {
  let projectsCount = 0;
  let recordsCount = 0;
  let animalsCount = 0;

  try {
    const oldDb = await openOldDatabase();
    if (!oldDb) {
      return { projects: 0, records: 0, animals: 0 };
    }

    const projects = await readAllFromStore<FarmProject>(oldDb, 'projects');
    const records = await readAllFromStore<FarmRecord>(oldDb, 'records');
    const animals = await readAllFromStore<FarmAnimal>(oldDb, 'animals');

    await database.write(async () => {
      for (const p of projects) {
        const projectType = (p as any).projectType || 'produce';
        const details = p.details || (projectType === 'produce' ? createDefaultProjectDetails() : createDefaultBreedingProjectDetails());
        await database.get('projects').prepareCreate((proj: any) => {
          proj.id = p.id;
          proj.title = p.title;
          proj.startDate = p.startDate;
          proj.createdAt = p.createdAt;
          proj.updatedAt = p.updatedAt;
          proj.projectType = projectType;
          proj.customColumns = p.customColumns ?? [];
          proj.customColumnTypes = p.customColumnTypes ?? {};
          proj.recordType = p.recordType ?? 'standard';
          proj.isCompleted = p.isCompleted ?? false;
          if (p.completedAt) proj.completedAt = p.completedAt;
          proj.details = details as Record<string, any>;
          if (p.deletedAt) proj.deletedAt = p.deletedAt;
          proj.isDeleted = p.isDeleted ?? false;
        });
        projectsCount++;
      }

      for (const r of records) {
        await database.get('records').prepareCreate((rec: any) => {
          rec.id = r.id;
          rec.projectId = r.projectId;
          rec.date = r.date;
          if (r.item !== undefined) rec.item = r.item;
          rec.produceAmount = r.produceAmount;
          rec.produceRevenue = r.produceRevenue;
          rec.comment = r.comment;
          rec.isLocked = r.isLocked;
          if (r.lockedAt) rec.lockedAt = r.lockedAt;
          rec.customFields = r.customFields ?? {};
          rec.createdAt = r.createdAt;
          rec.updatedAt = r.updatedAt;
          if (r.isBatchSale !== undefined) rec.isBatchSale = r.isBatchSale;
          if (r.isCarriedBalance !== undefined) rec.isCarriedBalance = r.isCarriedBalance;
          if (r.sourceRecordIds !== undefined) rec.sourceRecordIds = r.sourceRecordIds;
          if (r.soldQuantity !== undefined) rec.soldQuantity = r.soldQuantity;
          if (r.availableQuantity !== undefined) rec.availableQuantity = r.availableQuantity;
          if (r.batchSaleId !== undefined) rec.batchSaleId = r.batchSaleId;
        });
        recordsCount++;
      }

      for (const a of animals) {
        const normalized = normalizeAnimal(a);
        await database.get('animals').prepareCreate((ani: any) => {
          ani.id = normalized.id;
          ani.projectId = normalized.projectId;
          ani.animalId = normalized.animalId;
          ani.sex = normalized.sex;
          if (normalized.age !== undefined) ani.age = normalized.age;
          if (normalized.birthDate !== undefined) ani.birthDate = normalized.birthDate;
          if (normalized.breed !== undefined) ani.breed = normalized.breed;
          ani.healthStatus = normalized.healthStatus;
          if (normalized.currentStatus !== undefined) ani.currentStatus = normalized.currentStatus;
          if (normalized.acquisitionCost !== undefined) ani.acquisitionCost = normalized.acquisitionCost;
          if (normalized.notes !== undefined) ani.notes = normalized.notes;
          if (normalized.motherId !== undefined) ani.motherId = normalized.motherId;
          if (normalized.fatherId !== undefined) ani.fatherId = normalized.fatherId;
          ani.createdAt = normalized.createdAt;
          ani.updatedAt = normalized.updatedAt;
          ani.isLocked = normalized.isLocked;
          if (normalized.lockedAt) ani.lockedAt = normalized.lockedAt;
          ani.matingHistory = normalized.matingHistory ?? [];
          ani.pregnancyHistory = normalized.pregnancyHistory ?? [];
          ani.birthRecords = normalized.birthRecords ?? [];
          ani.deathRecords = normalized.deathRecords ?? [];
          ani.saleRecords = normalized.saleRecords ?? [];
          ani.treatmentHistory = normalized.treatmentHistory ?? [];
        });
        animalsCount++;
      }
    });

    oldDb.close();
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }

  return { projects: projectsCount, records: recordsCount, animals: animalsCount };
}

function openOldDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(OLD_DB_NAME, 3);
      request.onerror = () => resolve(null);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('records')) {
          db.createObjectStore('records', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('animals')) {
          db.createObjectStore('animals', { keyPath: 'id' });
        }
      };
    } catch {
      resolve(null);
    }
  });
}

function readAllFromStore<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}
