import { Model } from '@nozbe/watermelondb';
import { field, text, json } from '@nozbe/watermelondb/decorators';

export class Project extends Model {
  static table = 'projects';
  static associations = {
    records: { type: 'has_many' as const, foreignKey: 'project_id' },
    animals: { type: 'has_many' as const, foreignKey: 'project_id' },
  } as const;

  @text('title') declare title: string;
  @field('start_date') declare startDate: string;
  @field('created_at_iso') declare createdAt: string;
  @field('updated_at_iso') declare updatedAt: string;
  @field('project_type') declare projectType: string;
  @json('custom_columns', data => JSON.parse(data)) declare customColumns: string[];
  @json('custom_column_types', data => JSON.parse(data)) declare customColumnTypes: Record<string, string>;
  @field('record_type') declare recordType: string;
  @field('is_completed') declare isCompleted: boolean;
  @field('completed_at') declare completedAt?: string;
  @json('details', data => JSON.parse(data)) declare details: Record<string, any>;
  @field('deleted_at') declare deletedAt?: string;
  @field('is_deleted') declare isDeleted: boolean;
}
