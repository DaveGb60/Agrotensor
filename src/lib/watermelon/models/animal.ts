import { Model } from '@nozbe/watermelondb';
import { field, text, json } from '@nozbe/watermelondb/decorators';
import { relation } from '@nozbe/watermelondb/decorators';
import { Project } from './project';

const jsonObject = (raw: unknown) => (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {});
const jsonArray = (raw: unknown) => (Array.isArray(raw) ? raw : []);


export class Animal extends Model {
  static table = 'animals';
  static associations = {
    project: { type: 'belongs_to' as const, key: 'project_id' },
  } as const;

  @field('project_id') declare projectId: string;
  @relation('projects', 'project_id') declare project: Project;
  @field('animal_id') declare animalId: string;
  @field('sex') declare sex: string;
  @field('age') declare age?: string;
  @field('birth_date') declare birthDate?: string;
  @field('breed') declare breed?: string;
  @field('health_status') declare healthStatus: string;
  @field('current_status') declare currentStatus?: string;
  @field('acquisition_cost') declare acquisitionCost?: number;
  @text('notes') declare notes?: string;
  @field('mother_id') declare motherId?: string;
  @field('father_id') declare fatherId?: string;
  @field('created_at_iso') declare createdAt: string;
  @field('updated_at_iso') declare updatedAt: string;
  @field('is_locked') declare isLocked: boolean;
  @field('locked_at') declare lockedAt?: string;
  @json('mating_history', jsonArray) declare matingHistory: MatingRecord[];
  @json('pregnancy_history', jsonArray) declare pregnancyHistory: PregnancyRecord[];
  @json('birth_records', jsonArray) declare birthRecords: BirthRecord[];
  @json('death_records', jsonArray) declare deathRecords: DeathRecord[];
  @json('sale_records', jsonArray) declare saleRecords: SaleRecord[];
  @json('treatment_history', jsonArray) declare treatmentHistory: TreatmentRecord[];
}

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
  status: string;
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
