// File Sync Module for AgroTensor
// Handles file-based data import/export and sharing

import { FarmProject, FarmRecord, FarmAnimal, getProject, importProject, importRecord, importAnimal, getRecordsByProject, getAnimalsByProject, flushDatabase } from './db';

export interface SyncDataV1 {
  type: 'agrotensor-sync';
  version: '1.0';
  timestamp: string;
  project: FarmProject;
  records: FarmRecord[];
}

export interface SyncDataV2 extends Omit<SyncDataV1, 'version'> {
  version: '2.0';
  animals: FarmAnimal[];
}

export type SyncData = SyncDataV1 | SyncDataV2;

export interface SyncResult {
  success: boolean;
  message: string;
  newRecords?: number;
  updatedRecords?: number;
  skippedRecords?: number;
}

// Create sync data package
export function createSyncData(project: FarmProject, records: FarmRecord[], animals: FarmAnimal[] = []): SyncDataV2 {
  return {
    type: 'agrotensor-sync',
    version: '2.0',
    timestamp: new Date().toISOString(),
    project,
    records,
    animals,
  };
}

// Validate incoming sync data (accepts legacy FarmDeck-era exports too)
const LEGACY_SYNC_TYPES = ['agrotensor-sync', 'farmdeck-sync', 'farm-deck-sync', 'farmdeck-backup', 'agrotensor-backup'];

export function validateSyncData(data: unknown): data is SyncData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  const typeOk = typeof d.type === 'string' && LEGACY_SYNC_TYPES.includes(d.type);
  return (
    typeOk &&
    typeof d.project === 'object' &&
    d.project !== null &&
    Array.isArray(d.records)
  );
}

export function getSyncAnimals(data: SyncData): FarmAnimal[] {
  const animals = (data as SyncDataV2).animals;
  return Array.isArray(animals) ? animals : [];
}

// ---------- Legacy (FarmDeck era) backup parsing ----------

export interface ParsedBackup {
  projects: FarmProject[];
  records: FarmRecord[];
  animals: FarmAnimal[];
}

function coerceProject(raw: any): FarmProject | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id ?? raw.projectId ?? raw.uuid;
  const title = raw.title ?? raw.name ?? raw.projectName;
  if (typeof id !== 'string' || typeof title !== 'string') return null;
  const now = new Date().toISOString();
  const projectType = raw.projectType ?? raw.type ?? 'produce';
  return {
    id,
    title,
    startDate: raw.startDate ?? raw.start_date ?? raw.createdAt ?? now,
    createdAt: raw.createdAt ?? raw.created_at ?? now,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? now,
    projectType: projectType === 'breeding' ? 'breeding' : 'produce',
    customColumns: Array.isArray(raw.customColumns) ? raw.customColumns : [],
    customColumnTypes: raw.customColumnTypes && typeof raw.customColumnTypes === 'object' ? raw.customColumnTypes : {},
    recordType: raw.recordType === 'delayed_revenue' ? 'delayed_revenue' : 'standard',
    isCompleted: !!raw.isCompleted,
    completedAt: raw.completedAt,
    details: raw.details ?? raw.projectDetails ?? {},
    deletedAt: raw.deletedAt,
    isDeleted: !!raw.isDeleted,
  } as FarmProject;
}

function coerceRecord(raw: any, fallbackProjectId?: string): FarmRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id ?? raw.recordId;
  const projectId = raw.projectId ?? raw.project_id ?? fallbackProjectId;
  if (typeof id !== 'string' || typeof projectId !== 'string') return null;
  const now = new Date().toISOString();
  return {
    id,
    projectId,
    date: raw.date ?? raw.recordDate ?? now.slice(0, 10),
    item: raw.item ?? raw.produceItem,
    produceAmount: Number(raw.produceAmount ?? raw.amount ?? raw.quantity ?? 0) || 0,
    produceRevenue: Number(raw.produceRevenue ?? raw.revenue ?? raw.income ?? 0) || 0,
    comment: raw.comment ?? raw.notes ?? '',
    isLocked: !!raw.isLocked,
    lockedAt: raw.lockedAt,
    customFields: raw.customFields && typeof raw.customFields === 'object' ? raw.customFields : {},
    createdAt: raw.createdAt ?? raw.created_at ?? now,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? now,
    isBatchSale: raw.isBatchSale,
    isCarriedBalance: raw.isCarriedBalance,
    sourceRecordIds: raw.sourceRecordIds,
    soldQuantity: raw.soldQuantity,
    availableQuantity: raw.availableQuantity,
    batchSaleId: raw.batchSaleId,
  } as FarmRecord;
}

function coerceAnimal(raw: any, fallbackProjectId?: string): FarmAnimal | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id;
  const projectId = raw.projectId ?? raw.project_id ?? fallbackProjectId;
  if (typeof id !== 'string' || typeof projectId !== 'string') return null;
  if (!('animalId' in raw) && !('tag' in raw)) return null;
  return { ...raw, id, projectId, animalId: raw.animalId ?? raw.tag } as FarmAnimal;
}

/**
 * Accepts any AgroTensor or legacy FarmDeck backup/export shape:
 *  - { type: '*-sync', project, records, animals }
 *  - { projects: [], records: [], animals: [] } (full backup / snapshot)
 *  - { data: { ... } } or { backup: { ... } } wrappers
 *  - a bare array of projects (each optionally embedding its records)
 */
export function parseAnyBackup(input: string | unknown): ParsedBackup | null {
  let data: any = input;
  if (typeof input === 'string') {
    try {
      data = JSON.parse(input);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== 'object') return null;

  // Unwrap common containers
  for (const key of ['data', 'backup', 'payload', 'export']) {
    if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key])) {
      const inner = data[key];
      if (inner.projects || inner.project || inner.records) data = inner;
    }
  }

  const projects: FarmProject[] = [];
  const records: FarmRecord[] = [];
  const animals: FarmAnimal[] = [];

  const takeProject = (rawProject: any) => {
    const project = coerceProject(rawProject);
    if (!project) return;
    projects.push(project);
    const embeddedRecords = rawProject.records ?? rawProject.entries ?? rawProject.rows;
    if (Array.isArray(embeddedRecords)) {
      for (const r of embeddedRecords) {
        const rec = coerceRecord(r, project.id);
        if (rec) records.push(rec);
      }
    }
    const embeddedAnimals = rawProject.animals ?? rawProject.livestock;
    if (Array.isArray(embeddedAnimals)) {
      for (const a of embeddedAnimals) {
        const ani = coerceAnimal(a, project.id);
        if (ani) animals.push(ani);
      }
    }
  };

  if (Array.isArray(data)) {
    data.forEach(takeProject);
  } else {
    if (data.project) takeProject(data.project);
    if (Array.isArray(data.projects)) data.projects.forEach(takeProject);
    const topRecords = data.records ?? data.entries;
    if (Array.isArray(topRecords)) {
      for (const r of topRecords) {
        const rec = coerceRecord(r, projects.length === 1 ? projects[0].id : undefined);
        if (rec) records.push(rec);
      }
    }
    const topAnimals = data.animals ?? data.livestock;
    if (Array.isArray(topAnimals)) {
      for (const a of topAnimals) {
        const ani = coerceAnimal(a, projects.length === 1 ? projects[0].id : undefined);
        if (ani) animals.push(ani);
      }
    }
  }

  if (!projects.length && !records.length && !animals.length) return null;

  // Dedupe by id (first wins)
  const uniq = <T extends { id: string }>(items: T[]) => {
    const map = new Map<string, T>();
    for (const i of items) if (!map.has(i.id)) map.set(i.id, i);
    return Array.from(map.values());
  };

  return { projects: uniq(projects), records: uniq(records), animals: uniq(animals) };
}

export interface BackupImportResult {
  projects: number;
  records: number;
  animals: number;
  failed: number;
  errors: string[];
}

export async function importAnyBackup(input: string | unknown): Promise<BackupImportResult> {
  const parsed = parseAnyBackup(input);
  if (!parsed) {
    throw new Error('This file is not a recognisable AgroTensor or FarmDeck backup.');
  }

  const result: BackupImportResult = { projects: 0, records: 0, animals: 0, failed: 0, errors: [] };

  for (const p of parsed.projects) {
    try {
      await importProject(p);
      result.projects++;
    } catch (e) {
      result.failed++;
      if (result.errors.length < 5) result.errors.push(`Project "${p.title}": ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  for (const r of parsed.records) {
    try {
      await importRecord(r);
      result.records++;
    } catch (e) {
      result.failed++;
      if (result.errors.length < 5) result.errors.push(`Record ${r.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  for (const a of parsed.animals) {
    try {
      await importAnimal(a);
      result.animals++;
    } catch (e) {
      result.failed++;
      if (result.errors.length < 5) result.errors.push(`Animal ${a.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Make the restore durable immediately so it survives a reload/app close.
  await flushDatabase();

  return result;
}

// Generate a content fingerprint for a record (excludes id, createdAt, updatedAt)
export function generateRecordFingerprint(record: FarmRecord): string {
  const content = {
    projectId: record.projectId,
    date: record.date,
    item: record.item || '',
    produceAmount: record.produceAmount,
    produceRevenue: record.produceRevenue,
    comment: record.comment || '',
    customFields: record.customFields || {},
    isBatchSale: record.isBatchSale || false,
    isCarriedBalance: record.isCarriedBalance || false,
    soldQuantity: record.soldQuantity,
    availableQuantity: record.availableQuantity,
  };
  return JSON.stringify(content);
}

// Calculate sync diff - what records need to be transferred
export async function calculateSyncDiff(
  incomingData: SyncData
): Promise<{
  newRecords: FarmRecord[];
  existingRecords: FarmRecord[];
  duplicateRecords: FarmRecord[]; // Records with same content but different IDs
  existingRecordDetails?: FarmRecord[];
  projectExists: boolean;
}> {
  const existingProject = await getProject(incomingData.project.id);
  const projectExists = !!existingProject;

  if (!projectExists) {
    return {
      newRecords: incomingData.records,
      existingRecords: [],
      duplicateRecords: [],
      existingRecordDetails: [],
      projectExists: false,
    };
  }

  const existingRecords = await getRecordsByProject(incomingData.project.id);
  const existingRecordIds = new Set(existingRecords.map(r => r.id));
  
  // Create a set of content fingerprints for existing records
  const existingFingerprints = new Set(existingRecords.map(r => generateRecordFingerprint(r)));

  const newRecords: FarmRecord[] = [];
  const alreadyExisting: FarmRecord[] = [];
  const duplicates: FarmRecord[] = [];
  
  for (const record of incomingData.records) {
    if (existingRecordIds.has(record.id)) {
      // Same ID - already exists
      alreadyExisting.push(record);
    } else {
      // Different ID - check if content is duplicate
      const fingerprint = generateRecordFingerprint(record);
      if (existingFingerprints.has(fingerprint)) {
        // Same content, different ID - this is a duplicate
        duplicates.push(record);
      } else {
        // Truly new record
        newRecords.push(record);
      }
    }
  }

  return {
    newRecords,
    existingRecords: alreadyExisting,
    duplicateRecords: duplicates,
    existingRecordDetails: existingRecords,
    projectExists: true,
  };
}

// Import sync data into database with proper deduplication
export async function importSyncData(data: SyncData): Promise<SyncResult> {
  try {
    const diff = await calculateSyncDiff(data);
    
    // Import or update project
    await importProject(data.project);
    
    let importedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;
    
    // Import only truly new records (not existing by ID and not content duplicates)
    for (const record of diff.newRecords) {
      try {
        await importRecord(record);
        importedCount++;
      } catch {
        skippedCount++;
      }
    }

    // Import animals (v2.0 sync)
    let importedAnimals = 0;
    for (const animal of getSyncAnimals(data)) {
      try {
        await importAnimal(animal);
        importedAnimals++;
      } catch {
        skippedCount++;
      }
    }
    
    // Skip content duplicates (same data, different IDs)
    skippedCount += diff.duplicateRecords.length;
    
    // For existing records (same ID), optionally update if incoming is newer
    for (const incomingRecord of diff.existingRecords) {
      const existingRecord = diff.existingRecordDetails?.find(r => r.id === incomingRecord.id);
      if (existingRecord) {
        const incomingTime = new Date(incomingRecord.updatedAt).getTime();
        const existingTime = new Date(existingRecord.updatedAt).getTime();
        
        // Only update if incoming is newer and existing is not locked
        if (incomingTime > existingTime && !existingRecord.isLocked) {
          try {
            await importRecord(incomingRecord);
            updatedCount++;
          } catch {
            skippedCount++;
          }
        } else {
          skippedCount++;
        }
      } else {
        skippedCount++;
      }
    }
    
    const duplicateInfo = diff.duplicateRecords.length > 0 
      ? ` (${diff.duplicateRecords.length} duplicates skipped)` 
      : '';
    
    return {
      success: true,
      message: diff.projectExists 
        ? `Synced ${importedCount} new, ${updatedCount} updated records${importedAnimals ? `, ${importedAnimals} animals` : ''}${duplicateInfo}`
        : `Imported project with ${importedCount} records${importedAnimals ? ` and ${importedAnimals} animals` : ''}`,
      newRecords: importedCount,
      updatedRecords: updatedCount,
      skippedRecords: skippedCount,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Import failed',
    };
  }
}

// Export project data to JSON string
export function exportToJSON(project: FarmProject, records: FarmRecord[], animals: FarmAnimal[] = []): string {
  const syncData = createSyncData(project, records, animals);
  return JSON.stringify(syncData, null, 2);
}

// Parse JSON string to sync data
export function parseJSONImport(jsonString: string): SyncData | null {
  try {
    const data = JSON.parse(jsonString);
    if (validateSyncData(data)) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

// Download JSON file
export function downloadJSON(project: FarmProject, records: FarmRecord[], animals: FarmAnimal[] = []): void {
  const json = exportToJSON(project, records, animals);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `agrotensor-${project.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Share via Web Share API (if available)
export async function shareViaWebShare(project: FarmProject, records: FarmRecord[], animals: FarmAnimal[] = []): Promise<boolean> {
  if (!navigator.share) {
    return false;
  }
  
  const json = exportToJSON(project, records, animals);
  const blob = new Blob([json], { type: 'application/json' });
  const file = new File([blob], `agrotensor-${project.title}.json`, { type: 'application/json' });
  
  try {
    await navigator.share({
      title: `AgroTensor: ${project.title}`,
      text: `AgroTensor project data - ${records.length} records${animals.length ? `, ${animals.length} animals` : ''}`,
      files: [file],
    });
    return true;
  } catch {
    // User cancelled or share failed
    return false;
  }
}

// Copy to clipboard
export async function copyToClipboard(project: FarmProject, records: FarmRecord[], animals: FarmAnimal[] = []): Promise<boolean> {
  const json = exportToJSON(project, records, animals);
  try {
    await navigator.clipboard.writeText(json);
    return true;
  } catch {
    return false;
  }
}

// Generate shareable text for nearby share (Android/iOS)
export function generateShareableLink(project: FarmProject, records: FarmRecord[], animals: FarmAnimal[] = []): {
  title: string;
  text: string;
  data: string;
} {
  const data = exportToJSON(project, records, animals);
  return {
      title: `AgroTensor: ${project.title}`,
    text: `Farm project with ${records.length} records${animals.length ? ` and ${animals.length} animals` : ''}`,
    data,
  };
}

export function createDataUrl(project: FarmProject, records: FarmRecord[], animals: FarmAnimal[] = []): string {
  const json = exportToJSON(project, records, animals);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return `data:application/json;base64,${base64}`;
}

// One-tap share: saves the JSON file to device storage and opens the OS share sheet.
export async function shareProjectFile(
  project: FarmProject,
  records: FarmRecord[],
  animals: FarmAnimal[] = []
): Promise<{ saved: boolean; shared: boolean }> {
  const json = exportToJSON(project, records, animals);
  const fileName = `agrotensor-${project.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.json`;
  const blob = new Blob([json], { type: 'application/json' });

  // 1. Drop a copy into device storage (Downloads)
  let saved = false;
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    saved = true;
  } catch {
    saved = false;
  }

  // 2. Open the external apps share sheet with the same file
  let shared = false;
  try {
    const file = new File([blob], fileName, { type: 'application/json' });
    const canShareFile =
      typeof navigator !== 'undefined' &&
      !!navigator.share &&
      (!navigator.canShare || navigator.canShare({ files: [file] }));
    if (canShareFile) {
      await navigator.share({
        title: `AgroTensor: ${project.title}`,
        text: `AgroTensor project data - ${records.length} records${animals.length ? `, ${animals.length} animals` : ''}`,
        files: [file],
      });
      shared = true;
    }
  } catch {
    shared = false;
  }

  return { saved, shared };
}
