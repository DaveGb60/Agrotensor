import { Database, Q } from '@nozbe/watermelondb';
import { Project, RecordModel, Animal } from '@/lib/watermelon/models';

let dbInstance: Database | null = null;

export async function getDB(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const { createDatabase } = await import('@/lib/watermelon/database');
  dbInstance = await createDatabase();

  const { needsMigration, markMigrationComplete } = await import('@/lib/watermelon/database');
  if (await needsMigration()) {
    try {
      const { migrateFromIndexedDB } = await import('@/lib/watermelon/migration');
      await migrateFromIndexedDB(dbInstance);
      markMigrationComplete();
    } catch (e) {
      console.error('Migration from IndexedDB to WatermelonDB failed:', e);
    }
  }

  return dbInstance;
}

// Input item for project details
export interface InputItem {
  name: string;
  cost: number;
  date?: string;
  isRecurring?: boolean;
  endDate?: string;
}

export interface CostEntry {
  amount: number;
  date: string;
  description?: string;
}

export function getMonthsBetween(startDate: string, endDate: string): string[] {
  const months: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setDate(1);
  end.setDate(1);
  while (start <= end) {
    const year = start.getFullYear();
    const month = String(start.getMonth() + 1).padStart(2, '0');
    months.push(`${year}-${month}`);
    start.setMonth(start.getMonth() + 1);
  }
  return months;
}

export type ProjectType = 'produce' | 'breeding';

export interface ProjectDetails {
  capital: number;
  capitalDate?: string;
  totalItemCount: number;
  costs: number;
  costsDate?: string;
  estimatedRevenue: number;
  inputs: InputItem[];
  challengesSummary: string;
  customDetails: Record<string, string | number>;
  notes?: string;
}

export interface BreedingCostItem {
  id: string;
  label: string;
  amount: number;
  date?: string;
  category: 'feed' | 'veterinary' | 'equipment' | 'other';
}

export interface BreedingProjectDetails {
  breed?: string;
  herdSize?: number;
  breedingGoal?: string;
  capitalInvestment?: number;
  requiredInputs?: string;
  totalCosts?: number;
  operationalCosts?: BreedingCostItem[];
  operationalChallenges?: string;
  estimatedRevenue?: number;
  breedingSeasonStart?: string;
  breedingSeasonEnd?: string;
  notes?: string;
}

export type ColumnType = 'text' | 'number' | 'cash_inflow' | 'cash_outflow';
export type RecordType = 'standard' | 'delayed_revenue';

export interface FarmProject {
  id: string;
  title: string;
  startDate: string;
  createdAt: string;
  updatedAt: string;
  projectType: ProjectType;
  customColumns: string[];
  customColumnTypes: Record<string, ColumnType>;
  recordType: RecordType;
  isCompleted: boolean;
  completedAt?: string;
  details: ProjectDetails | BreedingProjectDetails;
  deletedAt?: string;
  isDeleted?: boolean;
}

export type AnimalSex = 'male' | 'female';
export type PregnancyStatus = 'not_pregnant' | 'pregnant' | 'calved';
export type HealthStatus = 'healthy' | 'sick' | 'under_treatment' | 'deceased';
export type AnimalStatus = 'active' | 'sold' | 'deceased' | 'archived';

export interface MatingRecord {
  id: string;
  animalId: string;
  mateId: string;
  date: string;
  notes?: string;
  isLocked: boolean;
  lockedAt?: string;
}

export interface PregnancyRecord {
  id: string;
  animalId: string;
  matingRecordId?: string;
  startDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status: PregnancyStatus;
  notes?: string;
  isLocked: boolean;
  lockedAt?: string;
}

export interface BirthRecord {
  id: string;
  motherId: string;
  fatherId?: string;
  birthDate: string;
  offspringIds: string[];
  notes?: string;
  isLocked: boolean;
  lockedAt?: string;
}

export interface DeathRecord {
  id: string;
  animalId: string;
  deathDate: string;
  cause?: string;
  notes?: string;
  isLocked: boolean;
  lockedAt?: string;
}

export interface SaleRecord {
  id: string;
  animalId: string;
  saleDate: string;
  price?: number;
  buyer?: string;
  notes?: string;
  isLocked: boolean;
  lockedAt?: string;
}

export interface TreatmentRecord {
  id: string;
  animalId: string;
  date: string;
  treatment?: string;
  veterinarian?: string;
  cost?: number;
  notes?: string;
  isLocked: boolean;
  lockedAt?: string;
}

export interface FarmAnimal {
  id: string;
  projectId: string;
  animalId: string;
  sex: AnimalSex;
  age?: string;
  birthDate?: string;
  breed?: string;
  healthStatus: HealthStatus;
  currentStatus?: AnimalStatus;
  acquisitionCost?: number;
  notes?: string;
  motherId?: string;
  fatherId?: string;
  createdAt: string;
  updatedAt: string;
  isLocked: boolean;
  lockedAt?: string;
  matingHistory: MatingRecord[];
  pregnancyHistory: PregnancyRecord[];
  birthRecords: BirthRecord[];
  deathRecords: DeathRecord[];
  saleRecords: SaleRecord[];
  treatmentHistory: TreatmentRecord[];
}

export interface OffspringInput {
  animalId: string;
  sex: AnimalSex;
  breed?: string;
  healthStatus?: HealthStatus;
}

export interface FarmRecord {
  id: string;
  projectId: string;
  date: string;
  item?: string;
  produceAmount: number;
  produceRevenue: number;
  comment: string;
  isLocked: boolean;
  lockedAt?: string;
  customFields: Record<string, string | number>;
  createdAt: string;
  updatedAt: string;
  isBatchSale?: boolean;
  isCarriedBalance?: boolean;
  sourceRecordIds?: string[];
  soldQuantity?: number;
  availableQuantity?: number;
  batchSaleId?: string;
}

export interface MonthlyAggregation {
  month: string;
  projectId: string;
  totalInputCost: number;
  totalProduceAmount: number;
  totalRevenue: number;
  grossProfit: number;
  netProfit: number;
  recordCount: number;
}

// --- WatermelonDB model <-> plain interface helpers ---

function toProjectPlain(p: Project): FarmProject {
  return {
    id: p.id,
    title: p.title,
    startDate: p.startDate,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    projectType: p.projectType as FarmProject['projectType'],
    customColumns: p.customColumns ?? [],
    customColumnTypes: (p.customColumnTypes ?? {}) as Record<string, ColumnType>,
    recordType: p.recordType as FarmProject['recordType'],
    isCompleted: p.isCompleted,
    completedAt: p.completedAt,
    details: (p.details ?? {}) as FarmProject['details'],
    deletedAt: p.deletedAt,
    isDeleted: p.isDeleted,
  };
}

function toRecordPlain(r: RecordModel): FarmRecord {
  return {
    id: r.id,
    projectId: r.projectId,
    date: r.date,
    item: r.item,
    produceAmount: r.produceAmount,
    produceRevenue: r.produceRevenue,
    comment: r.comment,
    isLocked: r.isLocked,
    lockedAt: r.lockedAt,
    customFields: r.customFields ?? {},
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    isBatchSale: r.isBatchSale,
    isCarriedBalance: r.isCarriedBalance,
    sourceRecordIds: r.sourceRecordIds,
    soldQuantity: r.soldQuantity,
    availableQuantity: r.availableQuantity,
    batchSaleId: r.batchSaleId,
  };
}

function toAnimalPlain(a: Animal): FarmAnimal {
  return {
    id: a.id,
    projectId: a.projectId,
    animalId: a.animalId,
    sex: a.sex as FarmAnimal['sex'],
    age: a.age,
    birthDate: a.birthDate,
    breed: a.breed,
    healthStatus: a.healthStatus as FarmAnimal['healthStatus'],
    currentStatus: a.currentStatus as FarmAnimal['currentStatus'],
    acquisitionCost: a.acquisitionCost,
    notes: a.notes,
    motherId: a.motherId,
    fatherId: a.fatherId,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    isLocked: a.isLocked,
    lockedAt: a.lockedAt,
    matingHistory: a.matingHistory ?? [],
    pregnancyHistory: (a.pregnancyHistory ?? []).map((pr: any) => ({ ...pr, status: pr.status as PregnancyRecord['status'] })) as PregnancyRecord[],
    birthRecords: a.birthRecords ?? [],
    deathRecords: a.deathRecords ?? [],
    saleRecords: a.saleRecords ?? [],
    treatmentHistory: a.treatmentHistory ?? [],
  };
}

function normalizeAnimal(animal: FarmAnimal): FarmAnimal {
  return {
    ...animal,
    currentStatus: animal.currentStatus ?? 'active',
    matingHistory: animal.matingHistory ?? [],
    pregnancyHistory: animal.pregnancyHistory ?? [],
    birthRecords: animal.birthRecords ?? [],
    deathRecords: animal.deathRecords ?? [],
    saleRecords: animal.saleRecords ?? [],
    treatmentHistory: animal.treatmentHistory ?? [],
  };
}

export { normalizeAnimal };

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createDefaultProjectDetails(): ProjectDetails {
  return {
    capital: 0,
    totalItemCount: 0,
    costs: 0,
    estimatedRevenue: 0,
    inputs: [],
    challengesSummary: '',
    customDetails: {},
  };
}

export function createDefaultBreedingProjectDetails(): BreedingProjectDetails {
  return {};
}

// --- Project operations ---

export async function createProject(
  title: string,
  startDate: string,
  customColumns: string[] = [],
  existingId?: string,
  recordType: RecordType = 'standard',
  projectType: ProjectType = 'produce'
): Promise<FarmProject> {
  const db = await getDB();
  const now = new Date().toISOString();
  const project = await db.get('projects').prepareCreate((proj: any) => {
    proj.id = existingId || generateId();
    proj.title = title;
    proj.startDate = startDate;
    proj.createdAt = now;
    proj.updatedAt = now;
    proj.projectType = projectType;
    proj.customColumns = customColumns;
    proj.customColumnTypes = {};
    proj.recordType = recordType;
    proj.isCompleted = false;
    proj.details = projectType === 'produce' ? createDefaultProjectDetails() : createDefaultBreedingProjectDetails();
    proj.isDeleted = false;
  });
  await db.write(async () => {});
  return toProjectPlain(project as any);
}

export async function isAnimalTagUnique(projectId: string, animalTag: string, excludeId?: string): Promise<boolean> {
  const animals = await getAnimalsByProject(projectId);
  return !animals.some((a) => a.animalId === animalTag && a.id !== excludeId);
}

export async function createAnimal(
  projectId: string,
  data: Omit<FarmAnimal, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'isLocked' | 'lockedAt' | 'matingHistory' | 'pregnancyHistory' | 'birthRecords' | 'deathRecords' | 'saleRecords' | 'treatmentHistory'>
): Promise<FarmAnimal> {
  const db = await getDB();
  const unique = await isAnimalTagUnique(projectId, data.animalId);
  if (!unique) {
    throw new Error(`Animal ID "${data.animalId}" already exists in this project`);
  }

  const now = new Date().toISOString();
  const animal = await db.get('animals').prepareCreate((ani: any) => {
    ani.id = generateId();
    ani.projectId = projectId;
    ani.animalId = data.animalId;
    ani.sex = data.sex;
    ani.healthStatus = data.healthStatus;
    if (data.age !== undefined) ani.age = data.age;
    if (data.birthDate !== undefined) ani.birthDate = data.birthDate;
    if (data.breed !== undefined) ani.breed = data.breed;
    if (data.currentStatus !== undefined) ani.currentStatus = data.currentStatus;
    if (data.acquisitionCost !== undefined) ani.acquisitionCost = data.acquisitionCost;
    if (data.notes !== undefined) ani.notes = data.notes;
    if (data.motherId !== undefined) ani.motherId = data.motherId;
    if (data.fatherId !== undefined) ani.fatherId = data.fatherId;
    ani.createdAt = now;
    ani.updatedAt = now;
    ani.isLocked = false;
    ani.matingHistory = [];
    ani.pregnancyHistory = [];
    ani.birthRecords = [];
    ani.deathRecords = [];
    ani.saleRecords = [];
    ani.treatmentHistory = [];
  });
  await db.write(async () => {});
  return toAnimalPlain(animal as any);
}

export async function importAnimal(animal: FarmAnimal): Promise<FarmAnimal> {
  const db = await getDB();
  const existing = await db.get('animals').find(animal.id).catch(() => null);
  if (existing?.isLocked) return toAnimalPlain(existing as any);

  const imported = normalizeAnimal(animal);
  await db.write(async () => {
    await db.get('animals').prepareCreate((ani: any) => {
      ani.id = imported.id;
      ani.projectId = imported.projectId;
      ani.animalId = imported.animalId;
      ani.sex = imported.sex;
      ani.healthStatus = imported.healthStatus;
      if (imported.age !== undefined) ani.age = imported.age;
      if (imported.birthDate !== undefined) ani.birthDate = imported.birthDate;
      if (imported.breed !== undefined) ani.breed = imported.breed;
      if (imported.currentStatus !== undefined) ani.currentStatus = imported.currentStatus;
      if (imported.acquisitionCost !== undefined) ani.acquisitionCost = imported.acquisitionCost;
      if (imported.notes !== undefined) ani.notes = imported.notes;
      if (imported.motherId !== undefined) ani.motherId = imported.motherId;
      if (imported.fatherId !== undefined) ani.fatherId = imported.fatherId;
      ani.createdAt = imported.createdAt;
      ani.updatedAt = new Date().toISOString();
      ani.isLocked = imported.isLocked;
      if (imported.lockedAt) ani.lockedAt = imported.lockedAt;
      ani.matingHistory = imported.matingHistory ?? [];
      ani.pregnancyHistory = imported.pregnancyHistory ?? [];
      ani.birthRecords = imported.birthRecords ?? [];
      ani.deathRecords = imported.deathRecords ?? [];
      ani.saleRecords = imported.saleRecords ?? [];
      ani.treatmentHistory = imported.treatmentHistory ?? [];
    });
  });
  return imported;
}

export async function getAnimalsByProject(projectId: string): Promise<FarmAnimal[]> {
  const db = await getDB();
  const animals = await db.get('animals').query(Q.where('project_id', projectId)).fetch();
  return animals.map(toAnimalPlain);
}

export async function getAnimal(id: string): Promise<FarmAnimal | undefined> {
  const db = await getDB();
  const animal = await db.get('animals').find(id).catch(() => null);
  return animal ? toAnimalPlain(animal as any) : undefined;
}

export async function updateAnimal(animal: FarmAnimal): Promise<void> {
  const db = await getDB();
  if (animal.isLocked) {
    throw new Error('Cannot update a locked animal');
  }
  const unique = await isAnimalTagUnique(animal.projectId, animal.animalId, animal.id);
  if (!unique) {
    throw new Error(`Animal ID "${animal.animalId}" already exists in this project`);
  }
  await db.write(async () => {
    const existing = await db.get('animals').find(animal.id);
    await existing.update((ani: any) => {
      ani.animalId = animal.animalId;
      ani.sex = animal.sex;
      ani.healthStatus = animal.healthStatus;
      if (animal.age !== undefined) ani.age = animal.age;
      if (animal.birthDate !== undefined) ani.birthDate = animal.birthDate;
      if (animal.breed !== undefined) ani.breed = animal.breed;
      if (animal.currentStatus !== undefined) ani.currentStatus = animal.currentStatus;
      if (animal.acquisitionCost !== undefined) ani.acquisitionCost = animal.acquisitionCost;
      if (animal.notes !== undefined) ani.notes = animal.notes;
      if (animal.motherId !== undefined) ani.motherId = animal.motherId;
      if (animal.fatherId !== undefined) ani.fatherId = animal.fatherId;
      ani.updatedAt = new Date().toISOString();
    });
  });
}

export async function lockAnimal(id: string): Promise<void> {
  const db = await getDB();
  const animal = await db.get('animals').find(id).catch(() => null);
  if (!animal) throw new Error('Animal not found');
  await db.write(async () => {
    await animal.update((ani: any) => {
      ani.isLocked = true;
      ani.lockedAt = new Date().toISOString();
      ani.updatedAt = new Date().toISOString();
    });
  });
}

export async function deleteAnimal(id: string): Promise<void> {
  const db = await getDB();
  const animal = await db.get('animals').find(id).catch(() => null);
  if (animal?.isLocked) {
    throw new Error('Cannot delete a locked animal');
  }
  await db.write(async () => {
    const a = await db.get('animals').find(id);
    await a.destroyPermanently();
  });
}

export async function getAnimalOffspring(animalId: string, projectId?: string): Promise<FarmAnimal[]> {
  const db = await getDB();
  const allAnimals = projectId
    ? await db.get('animals').query(Q.where('project_id', projectId)).fetch()
    : await db.get('animals').query().fetch();
  return allAnimals
    .map(toAnimalPlain)
    .filter((a) => a.motherId === animalId || a.fatherId === animalId);
}

export async function getAnimalLineage(animalId: string, projectId?: string): Promise<{ ancestors: FarmAnimal[], descendants: FarmAnimal[] }> {
  const db = await getDB();
  const animal = await db.get('animals').find(animalId).catch(() => null);
  if (!animal) return { ancestors: [], descendants: [] };

  const scopedProjectId = projectId ?? (animal as any).projectId;
  const allAnimals = await db.get('animals').query(Q.where('project_id', scopedProjectId)).fetch();
  const animalMap = new Map(allAnimals.map((a) => [a.id, toAnimalPlain(a as any)]));

  const animalData = animalMap.get(animalId);
  if (!animalData) return { ancestors: [], descendants: [] };

  const ancestors: FarmAnimal[] = [];
  const seen = new Set<string>();
  const getAncestors = (id: string) => {
    const current = animalMap.get(id);
    if (!current) return;
    for (const parentId of [current.motherId, current.fatherId]) {
      if (!parentId || seen.has(parentId)) continue;
      const parent = animalMap.get(parentId);
      if (parent) {
        seen.add(parentId);
        ancestors.push(parent);
        getAncestors(parentId);
      }
    }
  };
  getAncestors(animalId);

  const descendants: FarmAnimal[] = [];
  const getDescendants = (id: string) => {
    const offspring = (allAnimals as any[]).filter((a) => a.motherId === id || a.fatherId === id);
    for (const child of offspring) {
      descendants.push(toAnimalPlain(child as any));
      getDescendants(child.id);
    }
  };
  getDescendants(animalId);

  return { ancestors, descendants };
}

export async function recordBirthWithOffspring(
  projectId: string,
  motherInternalId: string,
  birthData: { birthDate: string; notes?: string },
  offspringInputs: OffspringInput[],
  fatherInternalId?: string
): Promise<{ birthRecord: BirthRecord; offspring: FarmAnimal[]; updatedMother: FarmAnimal }> {
  const db = await getDB();
  const mother = await db.get('animals').find(motherInternalId).catch(() => null);
  if (!mother) throw new Error('Mother not found');
  if (mother.isLocked) throw new Error('Cannot add birth record to a locked animal');
  if (mother.projectId !== projectId) throw new Error('Animal does not belong to this project');

  const createdOffspring: FarmAnimal[] = [];
  const offspringTags: string[] = [];

  for (const input of offspringInputs) {
    if (!input.animalId.trim()) continue;
    const offspring = await createAnimal(projectId, {
      animalId: input.animalId.trim(),
      sex: input.sex,
      breed: input.breed || mother.breed,
      healthStatus: input.healthStatus || 'healthy',
      birthDate: birthData.birthDate,
      motherId: motherInternalId,
      fatherId: fatherInternalId,
      currentStatus: 'active',
    });
    createdOffspring.push(offspring);
    offspringTags.push(offspring.animalId);
  }

  const birthRecord: BirthRecord = {
    id: generateId(),
    motherId: motherInternalId,
    fatherId: fatherInternalId,
    birthDate: birthData.birthDate,
    offspringIds: offspringTags,
    notes: birthData.notes,
    isLocked: false,
  };

  const updatedMother = await db.write(async () => {
    const m = await db.get('animals').find(motherInternalId);
    await m.update((ani: any) => {
      ani.birthRecords = [...(ani.birthRecords ?? []), birthRecord];
      ani.updatedAt = new Date().toISOString();
    });
    return toAnimalPlain(m as any);
  });

  return { birthRecord, offspring: createdOffspring, updatedMother };
}

// --- Import helpers (for sync/recovery) ---

export async function importProject(projectData: FarmProject): Promise<FarmProject> {
  const db = await getDB();
  await db.write(async () => {
    await db.get('projects').prepareCreate((proj: any) => {
      proj.id = projectData.id;
      proj.title = projectData.title;
      proj.startDate = projectData.startDate;
      proj.createdAt = projectData.createdAt || new Date().toISOString();
      proj.updatedAt = new Date().toISOString();
      proj.projectType = projectData.projectType || 'produce';
      proj.customColumns = projectData.customColumns ?? [];
      proj.customColumnTypes = projectData.customColumnTypes ?? {};
      proj.recordType = projectData.recordType || 'standard';
      proj.isCompleted = projectData.isCompleted || false;
      proj.details = projectData.details || (projectData.projectType === 'breeding' ? createDefaultBreedingProjectDetails() : createDefaultProjectDetails());
      proj.isDeleted = projectData.isDeleted || false;
      if (projectData.deletedAt) proj.deletedAt = projectData.deletedAt;
      if (projectData.completedAt) proj.completedAt = projectData.completedAt;
    });
  });
  return projectData;
}

export async function updateProjectDetails(projectId: string, details: ProjectDetails): Promise<void> {
  const db = await getDB();
  const project = await db.get('projects').find(projectId).catch(() => null);
  if (!project) throw new Error('Project not found');
  if (project.isCompleted) throw new Error('Cannot update a completed project');

  await db.write(async () => {
    await project.update((p: any) => {
      p.details = details;
      p.updatedAt = new Date().toISOString();
    });
  });
}

export async function completeProject(projectId: string): Promise<void> {
  const db = await getDB();
  const project = await db.get('projects').find(projectId).catch(() => null);
  if (!project) throw new Error('Project not found');

  await db.write(async () => {
    await project.update((p: any) => {
      p.isCompleted = true;
      p.completedAt = new Date().toISOString();
      p.updatedAt = new Date().toISOString();
    });
  });
}

export async function importRecord(record: FarmRecord): Promise<FarmRecord> {
  const db = await getDB();
  const existingRecord = await db.get('records').find(record.id).catch(() => null);

  if (existingRecord?.isLocked) {
    return toRecordPlain(existingRecord);
  }

  await db.write(async () => {
    await db.get('records').prepareCreate((rec: any) => {
      rec.id = record.id;
      rec.projectId = record.projectId;
      rec.date = record.date;
      if (record.item !== undefined) rec.item = record.item;
      rec.produceAmount = record.produceAmount;
      rec.produceRevenue = record.produceRevenue;
      rec.comment = record.comment;
      rec.isLocked = record.isLocked;
      if (record.lockedAt) rec.lockedAt = record.lockedAt;
      rec.customFields = record.customFields ?? {};
      rec.createdAt = record.createdAt;
      rec.updatedAt = new Date().toISOString();
      if (record.isBatchSale !== undefined) rec.isBatchSale = record.isBatchSale;
      if (record.isCarriedBalance !== undefined) rec.isCarriedBalance = record.isCarriedBalance;
      if (record.sourceRecordIds !== undefined) rec.sourceRecordIds = record.sourceRecordIds;
      if (record.soldQuantity !== undefined) rec.soldQuantity = record.soldQuantity;
      if (record.availableQuantity !== undefined) rec.availableQuantity = record.availableQuantity;
      if (record.batchSaleId !== undefined) rec.batchSaleId = record.batchSaleId;
    });
  });
  return record;
}

export async function getAllProjects(): Promise<FarmProject[]> {
  const db = await getDB();
  const projects = await db.get('projects').query().fetch() as any as Project[];
  return projects
    .filter((p) => !p.isDeleted)
    .map(toProjectPlain)
    .map((p) => {
      const projectType = p.projectType || 'produce';
      return {
        ...p,
        projectType,
        isCompleted: p.isCompleted ?? false,
        details: projectType === 'produce'
          ? (p.details ?? createDefaultProjectDetails())
          : (p.details ?? createDefaultBreedingProjectDetails()),
        customColumnTypes: (p.customColumnTypes ?? {}) as Record<string, ColumnType>,
        recordType: p.recordType ?? 'standard',
      };
    });
}

export async function getDeletedProjects(): Promise<FarmProject[]> {
  const db = await getDB();
  const projects = await db.get('projects').query(Q.where('is_deleted', true)).fetch();
  return projects
    .map(toProjectPlain)
    .map((p) => {
      const projectType = p.projectType || 'produce';
      return {
        ...p,
        projectType,
        isCompleted: p.isCompleted ?? false,
        details: projectType === 'produce'
          ? (p.details ?? createDefaultProjectDetails())
          : (p.details ?? createDefaultBreedingProjectDetails()),
        customColumnTypes: (p.customColumnTypes ?? {}) as Record<string, ColumnType>,
        recordType: p.recordType ?? 'standard',
      };
    })
    .sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());
}

export async function getProject(id: string): Promise<FarmProject | undefined> {
  const db = await getDB();
  const project = await db.get('projects').find(id).catch(() => null);
  if (!project) return undefined;
  const plain = toProjectPlain(project);
  const projectType = plain.projectType || 'produce';
  return {
    ...plain,
    projectType,
    isCompleted: plain.isCompleted ?? false,
    details: projectType === 'produce'
      ? (plain.details ?? createDefaultProjectDetails())
      : (plain.details ?? createDefaultBreedingProjectDetails()),
    customColumnTypes: plain.customColumnTypes ?? {},
    recordType: plain.recordType ?? 'standard',
  };
}

export async function updateProject(project: FarmProject): Promise<void> {
  const db = await getDB();
  await db.write(async () => {
    const existing = await db.get('projects').find(project.id);
    await existing.update((p: any) => {
      p.title = project.title;
      p.startDate = project.startDate;
      p.projectType = project.projectType;
      p.customColumns = project.customColumns;
      p.customColumnTypes = project.customColumnTypes;
      p.recordType = project.recordType;
      p.isCompleted = project.isCompleted;
      if (project.completedAt != null) p.completedAt = project.completedAt;
      p.details = project.details;
      if (project.deletedAt != null) p.deletedAt = project.deletedAt;
      p.isDeleted = project.isDeleted;
      p.updatedAt = new Date().toISOString();
    });
  });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  const project = await db.get('projects').find(id).catch(() => null);
  if (!project) throw new Error('Project not found');

  await db.write(async () => {
    await project.update((p: any) => {
      p.isDeleted = true;
      p.deletedAt = new Date().toISOString();
      p.updatedAt = new Date().toISOString();
    });
  });
}

export async function restoreProject(id: string): Promise<void> {
  const db = await getDB();
  const project = await db.get('projects').find(id).catch(() => null);
  if (!project) throw new Error('Project not found');

  await db.write(async () => {
    await project.update((p: any) => {
      p.isDeleted = false;
      p.deletedAt = undefined;
      p.updatedAt = new Date().toISOString();
    });
  });
}

export async function permanentlyDeleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.write(async () => {
    const records = await db.get('records').query(Q.where('project_id', id)).fetch();
    const animals = await db.get('animals').query(Q.where('project_id', id)).fetch();
    for (const r of records) await r.destroyPermanently();
    for (const a of animals) await a.destroyPermanently();
    const project = await db.get('projects').find(id);
    await project.destroyPermanently();
  });
}

export async function cleanupOldTrash(): Promise<void> {
  const db = await getDB();
  const projects = await db.get('projects').query(Q.where('is_deleted', true)).fetch() as any as Project[];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const toDelete: string[] = [];
  for (const p of projects) {
    if (p.deletedAt && new Date(p.deletedAt) < thirtyDaysAgo) {
      toDelete.push(p.id);
    }
  }

  if (toDelete.length > 0) {
    await db.write(async () => {
      for (const id of toDelete) {
        const project = await db.get('projects').find(id).catch(() => null);
        if (project) await project.destroyPermanently();
      }
    });
  }
}

// --- Record operations ---

export async function createRecord(
  projectId: string,
  data: Omit<FarmRecord, 'id' | 'projectId' | 'isLocked' | 'createdAt' | 'updatedAt'>
): Promise<FarmRecord> {
  const db = await getDB();
  const now = new Date().toISOString();
  const record = await db.get('records').prepareCreate((rec: any) => {
    rec.id = generateId();
    rec.projectId = projectId;
    rec.date = data.date;
    if (data.item !== undefined) rec.item = data.item;
    rec.produceAmount = data.produceAmount;
    rec.produceRevenue = data.produceRevenue;
    rec.comment = data.comment;
    rec.isLocked = false;
    if (data.lockedAt) rec.lockedAt = data.lockedAt;
    rec.customFields = data.customFields ?? {};
    rec.createdAt = now;
    rec.updatedAt = now;
    if (data.isBatchSale !== undefined) rec.isBatchSale = data.isBatchSale;
    if (data.isCarriedBalance !== undefined) rec.isCarriedBalance = data.isCarriedBalance;
    if (data.sourceRecordIds !== undefined) rec.sourceRecordIds = data.sourceRecordIds;
    if (data.soldQuantity !== undefined) rec.soldQuantity = data.soldQuantity;
    if (data.availableQuantity !== undefined) rec.availableQuantity = data.availableQuantity;
    if (data.batchSaleId !== undefined) rec.batchSaleId = data.batchSaleId;
  });
  await db.write(async () => {});
  return toRecordPlain(record as any);
}

export async function getRecordsByProject(projectId: string): Promise<FarmRecord[]> {
  const db = await getDB();
  const records = await db.get('records').query(Q.where('project_id', projectId)).fetch() as any as RecordModel[];
  return records.map(toRecordPlain);
}

export async function getAllRecords(): Promise<FarmRecord[]> {
  const db = await getDB();
  const records = await db.get('records').query().fetch();
  return records.map(toRecordPlain);
}

export async function getAllAnimals(): Promise<FarmAnimal[]> {
  const db = await getDB();
  const animals = await db.get('animals').query().fetch();
  return animals.map(toAnimalPlain);
}

export async function getRecord(id: string): Promise<FarmRecord | undefined> {
  const db = await getDB();
  const record = await db.get('records').find(id).catch(() => null);
  return record ? toRecordPlain(record) : undefined;
}

export async function updateRecord(record: FarmRecord): Promise<void> {
  const db = await getDB();
  if (record.isLocked) {
    throw new Error('Cannot update a locked record');
  }
  await db.write(async () => {
    const existing = await db.get('records').find(record.id);
    await existing.update((rec: any) => {
      if (record.date) rec.date = record.date;
      if (record.item !== undefined) rec.item = record.item;
      rec.produceAmount = record.produceAmount;
      rec.produceRevenue = record.produceRevenue;
      rec.comment = record.comment;
      rec.customFields = record.customFields ?? {};
      if (record.isBatchSale !== undefined) rec.isBatchSale = record.isBatchSale;
      if (record.isCarriedBalance !== undefined) rec.isCarriedBalance = record.isCarriedBalance;
      if (record.sourceRecordIds !== undefined) rec.sourceRecordIds = record.sourceRecordIds;
      if (record.soldQuantity !== undefined) rec.soldQuantity = record.soldQuantity;
      if (record.availableQuantity !== undefined) rec.availableQuantity = record.availableQuantity;
      if (record.batchSaleId !== undefined) rec.batchSaleId = record.batchSaleId;
      rec.updatedAt = new Date().toISOString();
    });
  });
}

export async function lockRecord(id: string): Promise<void> {
  const db = await getDB();
  const record = await db.get('records').find(id).catch(() => null);
  if (!record) throw new Error('Record not found');
  await db.write(async () => {
    await record.update((rec: any) => {
      rec.isLocked = true;
      rec.lockedAt = new Date().toISOString();
      rec.updatedAt = new Date().toISOString();
    });
  });
}

export async function deleteRecord(id: string): Promise<void> {
  const db = await getDB();
  const record = await db.get('records').find(id).catch(() => null);
  if (record?.isLocked) {
    throw new Error('Cannot delete a locked record');
  }
  await db.write(async () => {
    const r = await db.get('records').find(id);
    await r.destroyPermanently();
  });
}

// --- Aggregation helpers ---

export function getMonthFromDate(dateStr: string): string {
  return dateStr.substring(0, 7);
}

export function calculateTotalProjectCosts(details: ProjectDetails): number {
  const inputsCost = details.inputs?.reduce((sum, input) => sum + (input.cost || 0), 0) || 0;
  return inputsCost + (details.costs || 0);
}

export async function getMonthlyAggregation(
  projectId: string,
  projectDetails?: ProjectDetails,
  customColumnTypes?: Record<string, ColumnType>
): Promise<MonthlyAggregation[]> {
  const records = await getRecordsByProject(projectId);
  const monthlyData: Record<string, MonthlyAggregation> = {};

  const calculateNetRevenue = (record: FarmRecord) => {
    let netRevenue = record.produceRevenue || 0;

    if (customColumnTypes) {
      for (const col in record.customFields) {
        const colType = customColumnTypes[col];
        const value = record.customFields[col];
        const numValue = typeof value === 'number' ? value : parseFloat(value as string) || 0;

        if (colType === 'cash_inflow') {
          netRevenue += numValue;
        } else if (colType === 'cash_outflow') {
          netRevenue -= numValue;
        }
      }
    }

    return netRevenue;
  };

  for (const record of records) {
    const month = getMonthFromDate(record.date);
    if (!monthlyData[month]) {
      monthlyData[month] = {
        month,
        projectId,
        totalInputCost: 0,
        totalProduceAmount: 0,
        totalRevenue: 0,
        grossProfit: 0,
        netProfit: 0,
        recordCount: 0,
      };
    }
    monthlyData[month].totalProduceAmount += record.produceAmount || 0;
    monthlyData[month].totalRevenue += calculateNetRevenue(record);
    monthlyData[month].recordCount += 1;
  }

  if (projectDetails) {
    if (projectDetails.capital > 0) {
      const capitalMonth = projectDetails.capitalDate
        ? getMonthFromDate(projectDetails.capitalDate)
        : Object.keys(monthlyData).sort()[0];

      if (capitalMonth && monthlyData[capitalMonth]) {
        monthlyData[capitalMonth].totalInputCost += projectDetails.capital;
      } else if (capitalMonth) {
        monthlyData[capitalMonth] = {
          month: capitalMonth,
          projectId,
          totalInputCost: projectDetails.capital,
          totalProduceAmount: 0,
          totalRevenue: 0,
          grossProfit: 0,
          netProfit: 0,
          recordCount: 0,
        };
      }
    }

    if (projectDetails.costs > 0) {
      const costsMonth = projectDetails.costsDate
        ? getMonthFromDate(projectDetails.costsDate)
        : Object.keys(monthlyData).sort()[0];

      if (costsMonth && monthlyData[costsMonth]) {
        monthlyData[costsMonth].totalInputCost += projectDetails.costs;
      } else if (costsMonth) {
        monthlyData[costsMonth] = {
          month: costsMonth,
          projectId,
          totalInputCost: projectDetails.costs,
          totalProduceAmount: 0,
          totalRevenue: 0,
          grossProfit: 0,
          netProfit: 0,
          recordCount: 0,
        };
      }
    }

    for (const input of projectDetails.inputs || []) {
      if (input.cost > 0) {
        if (input.isRecurring && input.date && input.endDate) {
          const months = getMonthsBetween(input.date, input.endDate);
          const costPerMonth = input.cost / months.length;

          for (const month of months) {
            if (monthlyData[month]) {
              monthlyData[month].totalInputCost += costPerMonth;
            } else {
              monthlyData[month] = {
                month,
                projectId,
                totalInputCost: costPerMonth,
                totalProduceAmount: 0,
                totalRevenue: 0,
                grossProfit: 0,
                netProfit: 0,
                recordCount: 0,
              };
            }
          }
        } else {
          const inputMonth = input.date
            ? getMonthFromDate(input.date)
            : Object.keys(monthlyData).sort()[0];

          if (inputMonth && monthlyData[inputMonth]) {
            monthlyData[inputMonth].totalInputCost += input.cost;
          } else if (inputMonth) {
            monthlyData[inputMonth] = {
              month: inputMonth,
              projectId,
              totalInputCost: input.cost,
              totalProduceAmount: 0,
              totalRevenue: 0,
              grossProfit: 0,
              netProfit: 0,
              recordCount: 0,
            };
          }
        }
      }
    }
  }

  for (const month in monthlyData) {
    const data = monthlyData[month];
    data.grossProfit = data.totalRevenue;
    data.netProfit = data.totalRevenue - data.totalInputCost;
  }

  return Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month));
}
