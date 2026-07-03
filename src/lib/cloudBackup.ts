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
import { 
  withErrorRecovery, 
  withRetry, 
  batchWithPartialFailure,
  isNetworkOffline 
} from './errorRecovery';
import { 
  enqueueOperation, 
  removeOperation,
  updateOperationRetry,
  getPendingOperationsByType 
} from './syncQueue';

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
  const operationType = 'backup_cloud';
  
  try {
    // If offline, queue this operation
    if (isNetworkOffline()) {
      enqueueOperation(
        operationType,
        { cloudId: identity.cloudId, recoveryCode: identity.recoveryCode },
        { description: 'Backup projects and records to cloud' }
      );
      throw new Error('Offline - backup queued for later');
    }

    return await withRetry(
      async () => {
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
      },
      3,
      2000
    );
  } catch (error) {
    // If this is a retryable error and we don't already have it queued
    if ((error instanceof Error && (error.message.includes('network') || error.message.includes('Offline'))) ||
        (isNetworkOffline())) {
      const existing = getPendingOperationsByType(operationType);
      if (!existing.length) {
        enqueueOperation(
          operationType,
          { cloudId: identity.cloudId, recoveryCode: identity.recoveryCode },
          { description: 'Backup projects and records to cloud' }
        );
      }
    }
    throw error;
  }
}

export interface RestoreResult {
  importedProjects: number;
  importedRecords: number;
  importedAnimals: number;
  skippedRecords: number;
  errors?: Array<{ item: string; error: string }>;
}

export async function restoreFromCloud(identity: CloudIdentity): Promise<RestoreResult> {
  const operationType = 'restore_cloud';
  
  try {
    if (isNetworkOffline()) {
      enqueueOperation(
        operationType,
        { cloudId: identity.cloudId, recoveryCode: identity.recoveryCode },
        { description: 'Restore projects and records from cloud' }
      );
      throw new Error('Offline - restore queued for later');
    }

    return await withRetry(
      async () => {
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

        const errors: Array<{ item: string; error: string }> = [];

        // Import projects (use batch with partial failure tolerance)
        const projectResults = await batchWithPartialFailure(projects, importProject);
        const importedProjects = projectResults.succeeded.length;
        projectResults.failed.forEach(f => {
          errors.push({ item: `Project: ${f.item.title}`, error: f.error.message });
        });

        // Import records (filter duplicates first)
        const uniqueRecords = records.filter(r => {
          const key = `${r.projectId}|${generateRecordFingerprint(r)}`;
          return !localFingerprints.has(key);
        });

        const recordResults = await batchWithPartialFailure(uniqueRecords, importRecord);
        const importedRecords = recordResults.succeeded.length;
        const skippedRecords = records.length - uniqueRecords.length;
        recordResults.failed.forEach(f => {
          errors.push({ item: `Record: ${f.item.projectId}/${f.item.id}`, error: f.error.message });
        });

        // Import animals (best effort)
        const animalResults = await batchWithPartialFailure(animals, importAnimal);
        const importedAnimals = animalResults.succeeded.length;
        animalResults.failed.forEach(f => {
          errors.push({ item: `Animal: ${f.item.projectId}/${f.item.animalId}`, error: f.error.message });
        });

        return { 
          importedProjects, 
          importedRecords, 
          importedAnimals, 
          skippedRecords,
          errors: errors.length > 0 ? errors : undefined,
        };
      },
      3,
      2000
    );
  } catch (error) {
    // If this is a retryable error
    if ((error instanceof Error && (error.message.includes('network') || error.message.includes('Offline'))) ||
        (isNetworkOffline())) {
      const existing = getPendingOperationsByType(operationType);
      if (!existing.length) {
        enqueueOperation(
          operationType,
          { cloudId: identity.cloudId, recoveryCode: identity.recoveryCode },
          { description: 'Restore projects and records from cloud' }
        );
      }
    }
    throw error;
  }
}
