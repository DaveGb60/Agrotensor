import { Model } from '@nozbe/watermelondb';
import { field, text, json } from '@nozbe/watermelondb/decorators';

export class Project extends Model {
  static table = 'projects';
  static associations = {
    records: { type: 'has_many' as const, foreignKey: 'project_id' },
    animals: { type: 'has_many' as const, foreignKey: 'project_id' },
  } as const;

  @text('title') title!: string;
  @field('start_date') startDate!: string;
  @field('created_at') createdAt!: string;
  @field('updated_at') updatedAt!: string;
  @field('project_type') projectType!: string;
  @json('custom_columns', data => JSON.parse(data)) customColumns!: string[];
  @json('custom_column_types', data => JSON.parse(data)) customColumnTypes!: Record<string, string>;
  @field('record_type') recordType!: string;
  @field('is_completed') isCompleted!: boolean;
  @field('completed_at') completedAt?: string;
  @json('details', data => JSON.parse(data)) details!: Record<string, any>;
  @field('deleted_at') deletedAt?: string;
  @field('is_deleted') isDeleted!: boolean;
}
