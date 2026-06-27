// File Sync Module for FarmDesk
// Handles file-based data import/export and sharing

import { FarmProject, FarmRecord, FarmAnimal, getProject, importProject, importRecord, importAnimal, getRecordsByProject, getAnimalsByProject } from './db';

export interface SyncDataV1 {
  type: 'farmdesk-sync';
  version: '1.0';
  timestamp: string;
  project: FarmProject;
  records: FarmRecord[];
}

export interface SyncDataV2 extends SyncDataV1 {
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
    type: 'farmdesk-sync',
    version: '2.0',
    timestamp: new Date().toISOString(),
    project,
    records,
    animals,
  };
}

// Validate incoming sync data
export function validateSyncData(data: unknown): data is SyncData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  const validVersion = d.version === '1.0' || d.version === '2.0';
  return (
    d.type === 'farmdesk-sync' &&
    validVersion &&
    typeof d.project === 'object' &&
    d.project !== null &&
    Array.isArray(d.records) &&
    (d.version === '1.0' || Array.isArray(d.animals))
  );
}

export function getSyncAnimals(data: SyncData): FarmAnimal[] {
  if (data.version === '2.0') return data.animals;
  return [];
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
  a.download = `farmdesk-${project.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.json`;
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
  const file = new File([blob], `farmdesk-${project.title}.json`, { type: 'application/json' });
  
  try {
    await navigator.share({
      title: `FarmDesk: ${project.title}`,
      text: `Farm project data - ${records.length} records${animals.length ? `, ${animals.length} animals` : ''}`,
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
    title: `FarmDesk: ${project.title}`,
    text: `Farm project with ${records.length} records${animals.length ? ` and ${animals.length} animals` : ''}`,
    data,
  };
}

export function createDataUrl(project: FarmProject, records: FarmRecord[], animals: FarmAnimal[] = []): string {
  const json = exportToJSON(project, records, animals);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return `data:application/json;base64,${base64}`;
}
