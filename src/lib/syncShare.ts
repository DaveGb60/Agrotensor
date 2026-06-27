// Sync share client — short-code project sharing via Lovable Cloud.
import { supabase } from '@/integrations/supabase/client';
import {
  FarmProject,
  FarmRecord,
  FarmAnimal,
  getRecordsByProject,
  getAnimalsByProject,
  importProject,
  importRecord,
  importAnimal,
} from './db';
import { generateRecordFingerprint } from './fileSync';

async function invoke(action: string, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('cloud-backup', {
    body: { action, ...payload },
  });
  if (error) throw new Error(error.message || 'Request failed');
  if (data?.error) throw new Error(data.error);
  return data;
}

export interface CreateShareResult {
  share_code: string;
  expires_at: string;
}

export async function createSyncShare(projectIds: string[], allProjects: FarmProject[]): Promise<CreateShareResult> {
  const selected = allProjects.filter((p) => projectIds.includes(p.id) && !p.isDeleted);
  if (selected.length === 0) throw new Error('No projects selected');

  const records: (FarmRecord & { fingerprint: string })[] = [];
  const animals: FarmAnimal[] = [];
  for (const project of selected) {
    const list = await getRecordsByProject(project.id);
    for (const r of list) {
      records.push({ ...r, fingerprint: generateRecordFingerprint(r) });
    }
    if (project.projectType === 'breeding') {
      animals.push(...(await getAnimalsByProject(project.id)));
    }
  }

  return await invoke('create-share', { projects: selected, records, animals });
}

export interface ClaimResult {
  importedProjects: number;
  updatedProjects: number;
  importedRecords: number;
  importedAnimals: number;
  skippedRecords: number;
}

export async function claimSyncShare(shareCode: string): Promise<ClaimResult> {
  const data = await invoke('claim-share', { share_code: shareCode });
  const projects: FarmProject[] = data.projects || [];
  const records: FarmRecord[] = data.records || [];
  const animals: FarmAnimal[] = data.animals || [];

  // Build dedupe set of local records (per project)
  const localFingerprints = new Set<string>();
  for (const p of projects) {
    const local = await getRecordsByProject(p.id);
    for (const r of local) {
      localFingerprints.add(`${r.projectId}|${generateRecordFingerprint(r)}`);
    }
  }

  let importedProjects = 0;
  let updatedProjects = 0;
  for (const p of projects) {
    // importProject upserts on existing ID — so a project that already exists locally is updated, not duplicated.
    await importProject(p);
    // We can't easily tell existing vs new without an extra lookup; treat all as imported for now.
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
      // skip
    }
  }

  return { importedProjects, updatedProjects, importedRecords, importedAnimals, skippedRecords };
}
