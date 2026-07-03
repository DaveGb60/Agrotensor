// Sync service for retrying offline operations
import { 
  getPendingOperations, 
  getRetryableOperations, 
  removeOperation, 
  updateOperationRetry,
  QueuedOperation,
  QueuedOperationType 
} from './syncQueue';
import { 
  backupToCloud, 
  restoreFromCloud, 
  getStoredIdentity, 
  CloudIdentity 
} from './cloudBackup';
import { 
  createSyncShare, 
  claimSyncShare 
} from './syncShare';
import {
  lockRecord,
  deleteRecord,
  lockAnimal,
  deleteAnimal,
  getProject,
  getRecord,
  getAnimal,
} from './db';
import { isNetworkOnline } from './networkStatus';

type SyncHandler = (op: QueuedOperation) => Promise<void>;

const handlers: Record<QueuedOperationType, SyncHandler> = {
  'backup_cloud': handleBackupCloud,
  'restore_cloud': handleRestoreCloud,
  'create_sync_share': handleCreateSyncShare,
  'claim_sync_share': handleClaimSyncShare,
  'update_project_details': handleUpdateProjectDetails,
  'lock_record': handleLockRecord,
  'delete_record': handleDeleteRecord,
  'lock_animal': handleLockAnimal,
  'delete_animal': handleDeleteAnimal,
};

async function handleBackupCloud(op: QueuedOperation) {
  const identity = getStoredIdentity();
  if (!identity) throw new Error('Cloud identity not found');
  
  await backupToCloud(identity);
}

async function handleRestoreCloud(op: QueuedOperation) {
  const identity = getStoredIdentity();
  if (!identity) throw new Error('Cloud identity not found');
  
  await restoreFromCloud(identity);
}

async function handleCreateSyncShare(op: QueuedOperation) {
  const { projectIds, allProjects } = op.payload;
  if (!Array.isArray(projectIds) || !Array.isArray(allProjects)) {
    throw new Error('Invalid payload for create_sync_share');
  }
  
  await createSyncShare(projectIds as string[], allProjects as any[]);
}

async function handleClaimSyncShare(op: QueuedOperation) {
  const { shareCode } = op.payload;
  if (!shareCode || typeof shareCode !== 'string') {
    throw new Error('Invalid payload for claim_sync_share');
  }
  
  await claimSyncShare(shareCode);
}

async function handleUpdateProjectDetails(op: QueuedOperation) {
  // This operation is handled locally, mark as complete
  removeOperation(op.id);
}

async function handleLockRecord(op: QueuedOperation) {
  const { recordId } = op.payload;
  if (!recordId || typeof recordId !== 'string') {
    throw new Error('Invalid recordId');
  }
  
  const record = await getRecord(recordId as string);
  if (!record) throw new Error('Record not found');
  
  await lockRecord(recordId as string);
}

async function handleDeleteRecord(op: QueuedOperation) {
  const { recordId } = op.payload;
  if (!recordId || typeof recordId !== 'string') {
    throw new Error('Invalid recordId');
  }
  
  const record = await getRecord(recordId as string);
  if (!record) {
    // Already deleted, mark as complete
    removeOperation(op.id);
    return;
  }
  
  await deleteRecord(recordId as string);
}

async function handleLockAnimal(op: QueuedOperation) {
  const { animalId } = op.payload;
  if (!animalId || typeof animalId !== 'string') {
    throw new Error('Invalid animalId');
  }
  
  const animal = await getAnimal(animalId as string);
  if (!animal) throw new Error('Animal not found');
  
  await lockAnimal(animalId as string);
}

async function handleDeleteAnimal(op: QueuedOperation) {
  const { animalId } = op.payload;
  if (!animalId || typeof animalId !== 'string') {
    throw new Error('Invalid animalId');
  }
  
  const animal = await getAnimal(animalId as string);
  if (!animal) {
    // Already deleted, mark as complete
    removeOperation(op.id);
    return;
  }
  
  await deleteAnimal(animalId as string);
}

export async function processPendingOperation(op: QueuedOperation): Promise<void> {
  const handler = handlers[op.type];
  if (!handler) {
    throw new Error(`No handler for operation type: ${op.type}`);
  }
  
  await handler(op);
}

export interface SyncServiceOptions {
  autoRetry?: boolean;
  autoRetryInterval?: number;
  maxConcurrent?: number;
}

export class SyncService {
  private autoRetryInterval: number;
  private maxConcurrent: number;
  private retryTimer: NodeJS.Timer | null = null;
  private isProcessing = false;
  private processedCount = 0;

  constructor(options: SyncServiceOptions = {}) {
    this.autoRetryInterval = options.autoRetryInterval ?? 30000; // 30s
    this.maxConcurrent = options.maxConcurrent ?? 3;
  }

  start(): void {
    if (this.retryTimer) return;
    
    this.retryTimer = setInterval(() => {
      this.retry().catch(e => console.error('Sync service retry error:', e));
    }, this.autoRetryInterval);

    // Try immediately
    this.retry().catch(e => console.error('Sync service startup error:', e));
  }

  stop(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
    this.isProcessing = false;
  }

  async retry(): Promise<number> {
    if (this.isProcessing || !isNetworkOnline()) {
      return 0;
    }

    this.isProcessing = true;
    let processed = 0;

    try {
      const retryable = getRetryableOperations();
      
      // Process in batches to avoid overwhelming the network
      for (let i = 0; i < retryable.length; i += this.maxConcurrent) {
        const batch = retryable.slice(i, i + this.maxConcurrent);
        const results = await Promise.allSettled(
          batch.map(async (op) => {
            try {
              await processPendingOperation(op);
              removeOperation(op.id);
              processed++;
              this.processedCount++;
            } catch (error) {
              const errMsg = error instanceof Error ? error.message : String(error);
              updateOperationRetry(op.id, errMsg);
              console.warn(`Sync retry failed for ${op.type}:`, errMsg);
            }
          })
        );
      }
    } finally {
      this.isProcessing = false;
    }

    return processed;
  }

  async processImmediate(op: QueuedOperation): Promise<void> {
    try {
      await processPendingOperation(op);
      removeOperation(op.id);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      updateOperationRetry(op.id, errMsg);
      throw error;
    }
  }

  getStats() {
    return {
      isProcessing: this.isProcessing,
      processedCount: this.processedCount,
      pendingCount: getPendingOperations().length,
      retryableCount: getRetryableOperations().length,
    };
  }
}

// Global sync service instance
let syncService: SyncService | null = null;

export function initSyncService(options?: SyncServiceOptions): SyncService {
  if (!syncService) {
    syncService = new SyncService(options);
  }
  return syncService;
}

export function getSyncService(): SyncService | null {
  return syncService;
}

export function startSyncService(options?: SyncServiceOptions): void {
  const service = initSyncService(options);
  service.start();
}

export function stopSyncService(): void {
  if (syncService) {
    syncService.stop();
  }
}
