import { Model } from '@nozbe/watermelondb';
import { field, text, json } from '@nozbe/watermelondb/decorators';

export class Project extends Model {
  static table = 'projects';
  static associations = {
    records: { type: 'has_many', foreignKey: 'project_id' },
    animals: { type: 'has_many', foreignKey: 'project_id' },
  };

  @text('title') title!: string;
  @field('start_date') startDate!: string;
  @field('created_at') createdAt!: string;
  @field('updated_at') updatedAt!: string;
  @field('project_type') projectType!: string;
  @json('custom_columns') customColumns!: string[];
  @json('custom_column_types') customColumnTypes!: Record<string, string>;
  @field('record_type') recordType!: string;
  @field('is_completed') isCompleted!: boolean;
  @field('completed_at') completedAt?: string;
  @json('details') details!: Record<string, any>;
  @field('deleted_at') deletedAt?: string;
  @field('is_deleted') isDeleted!: boolean;
}
