import { Model } from '@nozbe/watermelondb';
import { field, text, json } from '@nozbe/watermelondb/decorators';
import { relation } from '@nozbe/watermelondb/decorators';
import { Project } from './project';

export class Animal extends Model {
  static table = 'animals';
  static associations = {
    project: { type: 'belongs_to' as const, key: 'project_id' },
  } as const;

  @field('project_id') projectId!: string;
  @relation('projects', 'project_id') project!: Project;
  @field('animal_id') animalId!: string;
  @field('sex') sex!: string;
  @field('age') age?: string;
  @field('birth_date') birthDate?: string;
  @field('breed') breed?: string;
  @field('health_status') healthStatus!: string;
  @field('current_status') currentStatus?: string;
  @field('acquisition_cost') acquisitionCost?: number;
  @text('notes') notes?: string;
  @field('mother_id') motherId?: string;
  @field('father_id') fatherId?: string;
  @field('created_at') createdAt!: string;
  @field('updated_at') updatedAt!: string;
  @field('is_locked') isLocked!: boolean;
  @field('locked_at') lockedAt?: string;
  @json('mating_history', data => JSON.parse(data)) matingHistory!: MatingRecord[];
  @json('pregnancy_history', data => JSON.parse(data)) pregnancyHistory!: PregnancyRecord[];
  @json('birth_records', data => JSON.parse(data)) birthRecords!: BirthRecord[];
  @json('death_records', data => JSON.parse(data)) deathRecords!: DeathRecord[];
  @json('sale_records', data => JSON.parse(data)) saleRecords!: SaleRecord[];
  @json('treatment_history', data => JSON.parse(data)) treatmentHistory!: TreatmentRecord[];
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
