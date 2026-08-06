import { Model } from '@nozbe/watermelondb';
import { field, text, json } from '@nozbe/watermelondb/decorators';
import { relation } from '@nozbe/watermelondb/decorators';
import { Project } from './project';

const jsonObject = (raw: unknown) => (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {});
const jsonArray = (raw: unknown) => (Array.isArray(raw) ? raw : []);


export class RecordModel extends Model {
  static table = 'records';
  static associations = {
    project: { type: 'belongs_to' as const, key: 'project_id' },
  } as const;

  @field('project_id') declare projectId: string;
  @relation('projects', 'project_id') declare project: Project;
  @field('date') declare date: string;
  @field('item') declare item?: string;
  @field('produce_amount') declare produceAmount: number;
  @field('produce_revenue') declare produceRevenue: number;
  @text('comment') declare comment: string;
  @field('is_locked') declare isLocked: boolean;
  @field('locked_at') declare lockedAt?: string;
  @json('custom_fields', jsonObject) declare customFields: Record<string, string | number>;
  @field('created_at_iso') declare createdAtIso: string;
  @field('updated_at_iso') declare updatedAtIso: string;
  @field('is_batch_sale') declare isBatchSale?: boolean;
  @field('is_carried_balance') declare isCarriedBalance?: boolean;
  @json('source_record_ids', jsonArray) declare sourceRecordIds?: string[];
  @field('sold_quantity') declare soldQuantity?: number;
  @field('available_quantity') declare availableQuantity?: number;
  @field('batch_sale_id') declare batchSaleId?: string;
}
