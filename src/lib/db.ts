// IndexedDB wrapper for FarmDesk local storage
import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Input item for project details
export interface InputItem {
  name: string;
  cost: number;
  date?: string; // YYYY-MM-DD - when this cost was incurred (start date if recurring)
  isRecurring?: boolean; // Whether this cost spans multiple months
  endDate?: string; // YYYY-MM-DD - end date for recurring costs
}

// Cost entry with timestamp
export interface CostEntry {
  amount: number;
  date: string; // YYYY-MM-DD - when this cost was incurred
  description?: string;
}

// Helper to get all months between two dates
export function getMonthsBetween(startDate: string, endDate: string): string[] {
  const months: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Normalize to first of month
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

// Project Details for Produce Projects
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

// Project Details for Breeding Projects
export interface BreedingProjectDetails {
  breed?: string;
  herdSize?: number;
  breedingGoal?: string;
  capitalInvestment?: number;
  requiredInputs?: string;
  totalCosts?: number;
  operationalChallenges?: string;
  estimatedRevenue?: number;
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
  breed?: string;
  healthStatus: HealthStatus;
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

export interface FarmRecord {
  id: string;
  projectId: string;
  date: string;
  item?: string; // Optional - for projects with multiple products
  produceAmount: number;
  produceRevenue: number;
  comment: string;
  isLocked: boolean;
  lockedAt?: string;
  customFields: Record<string, string | number>;
  createdAt: string;
  updatedAt: string;
  // Delayed revenue fields
  isBatchSale?: boolean; // True when this record represents a batch sale
  isCarriedBalance?: boolean; // True when this record is unsold inventory carried forward
  sourceRecordIds?: string[]; // IDs of records that contributed to this batch sale
  soldQuantity?: number; // Quantity actually sold (for partial sales)
  availableQuantity?: number; // Remaining quantity available for sale (for delayed revenue tracking)
  batchSaleId?: string; // Links carried balance to its originating batch sale
}

export interface MonthlyAggregation {
  month: string; // YYYY-MM
  projectId: string;
  totalInputCost: number;
  totalProduceAmount: number;
  totalRevenue: number;
  grossProfit: number;
  netProfit: number;
  recordCount: number;
}

interface FarmDeskDB extends DBSchema {
  projects: {
    key: string;
    value: FarmProject;
    indexes: { 'by-title': string };
  };
  records: {
    key: string;
    value: FarmRecord;
    indexes: { 
      'by-project': string;
      'by-date': string;
      'by-project-date': [string, string];
    };
  };
  animals: {
    key: string;
    value: FarmAnimal;
    indexes: { 
      'by-project': string;
      'by-animalId': string;
      'by-mother': string;
      'by-father': string;
    };
  };
}

let dbInstance: IDBPDatabase<FarmDeskDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<FarmDeskDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<FarmDeskDB>('farmdesk-db', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        // Projects store
        const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
        projectStore.createIndex('by-title', 'title');

        // Records store
        const recordStore = db.createObjectStore('records', { keyPath: 'id' });
        recordStore.createIndex('by-project', 'projectId');
        recordStore.createIndex('by-date', 'date');
        recordStore.createIndex('by-project-date', ['projectId', 'date']);
      }

      if (oldVersion < 2) {
        // Animals store for breeding projects
        const animalStore = db.createObjectStore('animals', { keyPath: 'id' });
        animalStore.createIndex('by-project', 'projectId');
        animalStore.createIndex('by-animalId', 'animalId');
        animalStore.createIndex('by-mother', 'motherId');
        animalStore.createIndex('by-father', 'fatherId');
      }
    },
  });

  return dbInstance;
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Default project details (Produce)
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

// Default breeding project details
export function createDefaultBreedingProjectDetails(): BreedingProjectDetails {
  return {};
}

// Project operations
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
  const project: FarmProject = {
    id: existingId || generateId(),
    title,
    startDate,
    createdAt: now,
    updatedAt: now,
    projectType,
    customColumns,
    customColumnTypes: {},
    recordType,
    isCompleted: false,
    details: projectType === 'produce' ? createDefaultProjectDetails() : createDefaultBreedingProjectDetails(),
  };
  await db.put('projects', project);
  return project;
}

// Animal operations
export async function createAnimal(projectId: string, data: Omit<FarmAnimal, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'isLocked' | 'lockedAt'>): Promise<FarmAnimal> {
  const db = await getDB();
  const now = new Date().toISOString();
  const animal: FarmAnimal = {
    id: generateId(),
    projectId,
    ...data,
    createdAt: now,
    updatedAt: now,
    isLocked: false,
    matingHistory: [],
    pregnancyHistory: [],
    birthRecords: [],
    deathRecords: [],
    saleRecords: [],
    treatmentHistory: [],
  };
  await db.put('animals', animal);
  return animal;
}

export async function getAnimalsByProject(projectId: string): Promise<FarmAnimal[]> {
  const db = await getDB();
  return db.getAllFromIndex('animals', 'by-project', projectId);
}

export async function getAnimal(id: string): Promise<FarmAnimal | undefined> {
  const db = await getDB();
  return db.get('animals', id);
}

export async function updateAnimal(animal: FarmAnimal): Promise<void> {
  const db = await getDB();
  if (animal.isLocked) {
    throw new Error('Cannot update a locked animal');
  }
  animal.updatedAt = new Date().toISOString();
  await db.put('animals', animal);
}

export async function lockAnimal(id: string): Promise<void> {
  const db = await getDB();
  const animal = await db.get('animals', id);
  if (!animal) throw new Error('Animal not found');
  animal.isLocked = true;
  animal.lockedAt = new Date().toISOString();
  animal.updatedAt = new Date().toISOString();
  await db.put('animals', animal);
}

export async function deleteAnimal(id: string): Promise<void> {
  const db = await getDB();
  const animal = await db.get('animals', id);
  if (animal?.isLocked) {
    throw new Error('Cannot delete a locked animal');
  }
  await db.delete('animals', id);
}

// Lineage tracking helpers
export async function getAnimalOffspring(animalId: string): Promise<FarmAnimal[]> {
  const db = await getDB();
  const allAnimals = await db.getAll('animals');
  return allAnimals.filter(a => a.motherId === animalId || a.fatherId === animalId);
}

export async function getAnimalLineage(animalId: string): Promise<{ ancestors: FarmAnimal[], descendants: FarmAnimal[] }> {
  const db = await getDB();
  const allAnimals = await db.getAll('animals');
  
  // Get ancestors
  const ancestors: FarmAnimal[] = [];
  const getAncestors = (id: string) => {
    const animal = allAnimals.find(a => a.id === id);
    if (animal) {
      if (animal.motherId) {
        const mother = allAnimals.find(a => a.id === animal.motherId);
        if (mother) {
          ancestors.push(mother);
          getAncestors(mother.id);
        }
      }
      if (animal.fatherId) {
        const father = allAnimals.find(a => a.id === animal.fatherId);
        if (father) {
          ancestors.push(father);
          getAncestors(father.id);
        }
      }
    }
  };
  getAncestors(animalId);

  // Get descendants
  const descendants: FarmAnimal[] = [];
  const getDescendants = (id: string) => {
    const offspring = allAnimals.filter(a => a.motherId === id || a.fatherId === id);
    for (const child of offspring) {
      descendants.push(child);
      getDescendants(child.id);
    }
  };
  getDescendants(animalId);

  return { ancestors, descendants };
}

// Import a full project with its original ID (for syncing)
export async function importProject(projectData: FarmProject): Promise<FarmProject> {
  const db = await getDB();
  const project: FarmProject = {
    ...projectData,
    // Ensure details exists (for backward compatibility)
    details: projectData.details || createDefaultProjectDetails(),
    customColumnTypes: projectData.customColumnTypes || {},
    recordType: projectData.recordType || 'standard',
    isCompleted: projectData.isCompleted || false,
    updatedAt: new Date().toISOString(),
  };
  await db.put('projects', project);
  return project;
}

// Update project details (Section 1)
export async function updateProjectDetails(projectId: string, details: ProjectDetails): Promise<void> {
  const db = await getDB();
  const project = await db.get('projects', projectId);
  if (!project) throw new Error('Project not found');
  if (project.isCompleted) throw new Error('Cannot update a completed project');
  
  project.details = details;
  project.updatedAt = new Date().toISOString();
  await db.put('projects', project);
}

// Complete project (lock Section 1)
export async function completeProject(projectId: string): Promise<void> {
  const db = await getDB();
  const project = await db.get('projects', projectId);
  if (!project) throw new Error('Project not found');
  
  project.isCompleted = true;
  project.completedAt = new Date().toISOString();
  project.updatedAt = new Date().toISOString();
  await db.put('projects', project);
}

// Import a record with its original ID (for syncing)
export async function importRecord(record: FarmRecord): Promise<FarmRecord> {
  const db = await getDB();
  const existingRecord = await db.get('records', record.id);
  
  // If record already exists and is locked, don't overwrite
  if (existingRecord?.isLocked) {
    return existingRecord;
  }
  
  // Preserve the original record data including ID and lock status
  const importedRecord: FarmRecord = {
    ...record,
    updatedAt: new Date().toISOString(),
  };
  await db.put('records', importedRecord);
  return importedRecord;
}

export async function getAllProjects(): Promise<FarmProject[]> {
  const db = await getDB();
  const projects = await db.getAll('projects');
  return projects
    .filter(p => !p.isDeleted)
    .map(p => {
      const projectType = (p as any).projectType || 'produce';
      return {
        ...p,
        projectType,
        isCompleted: p.isCompleted ?? false,
        details: projectType === 'produce' 
          ? (p.details ?? createDefaultProjectDetails()) 
          : (p.details ?? createDefaultBreedingProjectDetails()),
        customColumnTypes: p.customColumnTypes ?? {},
        recordType: p.recordType ?? 'standard',
      };
    });
}

export async function getDeletedProjects(): Promise<FarmProject[]> {
  const db = await getDB();
  const projects = await db.getAll('projects');
  return projects
    .filter(p => p.isDeleted)
    .map(p => {
      const projectType = (p as any).projectType || 'produce';
      return {
        ...p,
        projectType,
        isCompleted: p.isCompleted ?? false,
        details: projectType === 'produce' 
          ? (p.details ?? createDefaultProjectDetails()) 
          : (p.details ?? createDefaultBreedingProjectDetails()),
        customColumnTypes: p.customColumnTypes ?? {},
        recordType: p.recordType ?? 'standard',
      };
    })
    .sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());
}

export async function getProject(id: string): Promise<FarmProject | undefined> {
  const db = await getDB();
  const project = await db.get('projects', id);
  if (!project) return undefined;
  const projectType = (project as any).projectType || 'produce';
  return {
    ...project,
    projectType,
    isCompleted: project.isCompleted ?? false,
    details: projectType === 'produce' 
      ? (project.details ?? createDefaultProjectDetails()) 
      : (project.details ?? createDefaultBreedingProjectDetails()),
    customColumnTypes: project.customColumnTypes ?? {},
    recordType: project.recordType ?? 'standard',
  };
}

export async function updateProject(project: FarmProject): Promise<void> {
  const db = await getDB();
  project.updatedAt = new Date().toISOString();
  await db.put('projects', project);
}

// Soft delete - moves project to trash
export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  const project = await db.get('projects', id);
  if (!project) throw new Error('Project not found');
  
  project.isDeleted = true;
  project.deletedAt = new Date().toISOString();
  project.updatedAt = new Date().toISOString();
  await db.put('projects', project);
}

// Restore project from trash
export async function restoreProject(id: string): Promise<void> {
  const db = await getDB();
  const project = await db.get('projects', id);
  if (!project) throw new Error('Project not found');
  
  project.isDeleted = false;
  project.deletedAt = undefined;
  project.updatedAt = new Date().toISOString();
  await db.put('projects', project);
}

// Permanently delete project and all its records
export async function permanentlyDeleteProject(id: string): Promise<void> {
  const db = await getDB();
  const records = await getRecordsByProject(id);
  const tx = db.transaction(['projects', 'records'], 'readwrite');
  for (const record of records) {
    await tx.objectStore('records').delete(record.id);
  }
  await tx.objectStore('projects').delete(id);
  await tx.done;
}

// Clean up projects that have been in trash for more than 30 days
export async function cleanupOldTrash(): Promise<void> {
  const db = await getDB();
  const projects = await db.getAll('projects');
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  for (const project of projects) {
    if (project.isDeleted && project.deletedAt) {
      const deletedDate = new Date(project.deletedAt);
      if (deletedDate < thirtyDaysAgo) {
        await permanentlyDeleteProject(project.id);
      }
    }
  }
}

// Record operations
export async function createRecord(
  projectId: string,
  data: Omit<FarmRecord, 'id' | 'projectId' | 'isLocked' | 'createdAt' | 'updatedAt'>
): Promise<FarmRecord> {
  const db = await getDB();
  const now = new Date().toISOString();
  const record: FarmRecord = {
    id: generateId(),
    projectId,
    ...data,
    isLocked: false,
    createdAt: now,
    updatedAt: now,
  };
  await db.put('records', record);
  return record;
}

export async function getRecordsByProject(projectId: string): Promise<FarmRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex('records', 'by-project', projectId);
}

export async function updateRecord(record: FarmRecord): Promise<void> {
  const db = await getDB();
  if (record.isLocked) {
    throw new Error('Cannot update a locked record');
  }
  record.updatedAt = new Date().toISOString();
  await db.put('records', record);
}

export async function lockRecord(id: string): Promise<void> {
  const db = await getDB();
  const record = await db.get('records', id);
  if (!record) throw new Error('Record not found');
  record.isLocked = true;
  record.lockedAt = new Date().toISOString();
  record.updatedAt = new Date().toISOString();
  await db.put('records', record);
}

export async function deleteRecord(id: string): Promise<void> {
  const db = await getDB();
  const record = await db.get('records', id);
  if (record?.isLocked) {
    throw new Error('Cannot delete a locked record');
  }
  await db.delete('records', id);
}

// Aggregation helpers
export function getMonthFromDate(dateStr: string): string {
  return dateStr.substring(0, 7); // YYYY-MM
}

// Calculate total project costs (inputs + costs from project details)
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

  // Helper to calculate net revenue for a record (apply cash inflows/outflows)
  // Records already have precalculated revenue with cash flows from the records environment
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

  // First pass: aggregate record data by month
  for (const record of records) {
    const month = getMonthFromDate(record.date);
    if (!monthlyData[month]) {
      monthlyData[month] = {
        month,
        projectId,
        totalInputCost: 0, // Will hold month-specific costs
        totalProduceAmount: 0,
        totalRevenue: 0, // This is net revenue from records (already includes cash flows)
        grossProfit: 0,
        netProfit: 0,
        recordCount: 0,
      };
    }
    monthlyData[month].totalProduceAmount += record.produceAmount || 0;
    // Revenue already includes cash inflows/outflows from record-level custom columns
    monthlyData[month].totalRevenue += calculateNetRevenue(record);
    monthlyData[month].recordCount += 1;
  }

  // Second pass: add project-level costs to their specific months
  if (projectDetails) {
    // Add capital to its specific month (or first month if not specified)
    if (projectDetails.capital > 0) {
      const capitalMonth = projectDetails.capitalDate 
        ? getMonthFromDate(projectDetails.capitalDate)
        : Object.keys(monthlyData).sort()[0]; // First month as fallback
      
      if (capitalMonth && monthlyData[capitalMonth]) {
        monthlyData[capitalMonth].totalInputCost += projectDetails.capital;
      } else if (capitalMonth) {
        // Create month entry if it doesn't exist
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

    // Add general costs to their specific month
    if (projectDetails.costs > 0) {
      const costsMonth = projectDetails.costsDate 
        ? getMonthFromDate(projectDetails.costsDate)
        : Object.keys(monthlyData).sort()[0]; // First month as fallback
      
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

    // Add input costs to their specific months (with recurring cost support)
    for (const input of projectDetails.inputs || []) {
      if (input.cost > 0) {
        // Check if this is a recurring cost
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
          // Single month cost (existing logic)
          const inputMonth = input.date 
            ? getMonthFromDate(input.date)
            : Object.keys(monthlyData).sort()[0]; // First month as fallback
          
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

  // Third pass: calculate profits (month-specific, no carry-over)
  for (const month in monthlyData) {
    const data = monthlyData[month];
    // Gross profit = revenue from records (already net of record-level cash flows)
    data.grossProfit = data.totalRevenue;
    // Net profit = Gross profit - Month-specific project costs
    // Each month stands alone, no costs carried from other months
    data.netProfit = data.totalRevenue - data.totalInputCost;
  }

  return Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month));
}
