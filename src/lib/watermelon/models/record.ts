import { Model } from '@nozbe/watermelondb';
import { field, text, json } from '@nozbe/watermelondb/decorators';
import { relation } from '@nozbe/watermelondb/decorators';
import { Project } from './project';

export class RecordModel extends Model {
  static table = 'records';
  static associations = {
    project: { type: 'belongs_to' as const, key: 'project_id' },
  } as const;

  @field('project_id') projectId!: string;
  @relation('projects', 'project_id') project!: Project;
  @field('date') date!: string;
  @field('item') item?: string;
  @field('produce_amount') produceAmount!: number;
  @field('produce_revenue') produceRevenue!: number;
  @text('comment') comment!: string;
  @field('is_locked') isLocked!: boolean;
  @field('locked_at') lockedAt?: string;
  @json('custom_fields', data => JSON.parse(data)) customFields!: Record<string, string | number>;
  @field('created_at') createdAt!: string;
  @field('updated_at') updatedAt!: string;
  @field('is_batch_sale') isBatchSale?: boolean;
  @field('is_carried_balance') isCarriedBalance?: boolean;
  @json('source_record_ids', data => JSON.parse(data)) sourceRecordIds?: string[];
  @field('sold_quantity') soldQuantity?: number;
  @field('available_quantity') availableQuantity?: number;
  @field('batch_sale_id') batchSaleId?: string;
}
