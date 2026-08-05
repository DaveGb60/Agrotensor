// Cloud Backup client
// Talks to the cloud-backup edge function. Stores credentials in localStorage.

import { supabase } from '@/integrations/supabase/client';
import {
  getAllProjects,
  getRecordsByProject,
  getAnimalsByProject,
  importProject,
  importRecord,
  importAnimal,
  FarmProject,
  FarmRecord,
  FarmAnimal,
} from './db';
import { generateRecordFingerprint } from './fileSync';

const STORAGE_KEY = 'agrotensor-cloud-identity';

export interface CloudIdentity {
  cloudId: string;
  recoveryCode: string;
}

export interface CloudStatus {
  project_count: number;
  record_count: number;
  last_backup: { created_at: string; project_count: number; record_count: number } | null;
}

export function getStoredIdentity(): CloudIdentity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.cloudId && parsed?.recoveryCode) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function storeIdentity(identity: CloudIdentity) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}

export function clearIdentity() {
  localStorage.removeItem(STORAGE_KEY);
}

// Combined token for portability (single string the user copies)
export function encodeIdentityToken(id: CloudIdentity): string {
  return `${id.cloudId}.${id.recoveryCode}`;
}

export function decodeIdentityToken(token: string): CloudIdentity | null {
  const trimmed = token.trim();
  const idx = trimmed.indexOf('.');
  if (idx < 0) return null;
  const cloudId = trimmed.slice(0, idx);
  const recoveryCode = trimmed.slice(idx + 1);
  if (!cloudId || !recoveryCode) return null;
  return { cloudId, recoveryCode };
}

async function invoke(action: string, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('cloud-backup', {
    body: { action, ...payload },
  });
  if (error) throw new Error(error.message || 'Request failed');
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function createCloudIdentity(): Promise<CloudIdentity> {
  const data = await invoke('create-identity');
  const identity: CloudIdentity = { cloudId: data.cloud_id, recoveryCode: data.recovery_code };
  storeIdentity(identity);
  return identity;
}

export async function getCloudStatus(identity: CloudIdentity): Promise<CloudStatus> {
  return await invoke('status', {
    cloud_id: identity.cloudId,
    recovery_code: identity.recoveryCode,
  });
}

export async function verifyAndStoreIdentity(identity: CloudIdentity): Promise<CloudStatus> {
  const status = await getCloudStatus(identity);
  storeIdentity(identity);
  return status;
}

export async function backupToCloud(identity: CloudIdentity) {
  const projects = await getAllProjects();
  const activeProjects = projects.filter((p) => !p.isDeleted);

  const allRecords: (FarmRecord & { fingerprint: string })[] = [];
  const allAnimals: FarmAnimal[] = [];
  for (const project of activeProjects) {
    const records = await getRecordsByProject(project.id);
    for (const r of records) {
      allRecords.push({ ...r, fingerprint: generateRecordFingerprint(r) });
    }
    if (project.projectType === 'breeding') {
      const animals = await getAnimalsByProject(project.id);
      allAnimals.push(...animals);
    }
  }

  return await invoke('backup', {
    cloud_id: identity.cloudId,
    recovery_code: identity.recoveryCode,
    projects: activeProjects,
    records: allRecords,
    animals: allAnimals,
  });
}

export interface RestoreResult {
  importedProjects: number;
  importedRecords: number;
  importedAnimals: number;
  skippedRecords: number;
}

export async function restoreFromCloud(identity: CloudIdentity): Promise<RestoreResult> {
  const data = await invoke('restore', {
    cloud_id: identity.cloudId,
    recovery_code: identity.recoveryCode,
  });

  const projects: FarmProject[] = data.projects || [];
  const records: FarmRecord[] = data.records || [];
  const animals: FarmAnimal[] = data.animals || [];

  // Build fingerprint set of local records to dedupe
  const localFingerprints = new Set<string>();
  const localProjects = await getAllProjects();
  for (const lp of localProjects) {
    const localRecords = await getRecordsByProject(lp.id);
    for (const lr of localRecords) {
      localFingerprints.add(`${lr.projectId}|${generateRecordFingerprint(lr)}`);
    }
  }

  let importedProjects = 0;
  for (const p of projects) {
    await importProject(p);
    importedProjects++;
  }

  let importedRecords = 0;
  let skippedRecords = 0;
  for (const r of records) {
    const key = `${r.projectId}|${generateRecordFingerprint(r)}`;
    if (localFingerprints.has(key)) {
      skippedRecords++;
      continue;
    }
    await importRecord(r);
    importedRecords++;
    localFingerprints.add(key);
  }

  let importedAnimals = 0;
  for (const animal of animals) {
    try {
      await importAnimal(animal);
      importedAnimals++;
    } catch {
      // skip locked or invalid
    }
  }

  return { importedProjects, importedRecords, importedAnimals, skippedRecords };
}
