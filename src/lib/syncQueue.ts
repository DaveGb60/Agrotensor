// Sync queue for persisting failed operations that should be retried
import { FarmProject, FarmRecord, FarmAnimal } from './db';

export type QueuedOperationType = 
  | 'backup_cloud'
  | 'restore_cloud'
  | 'create_sync_share'
  | 'claim_sync_share'
  | 'update_project_details'
  | 'lock_record'
  | 'delete_record'
  | 'lock_animal'
  | 'delete_animal';

export interface QueuedOperation {
  id: string;
  type: QueuedOperationType;
  timestamp: number;
  retries: number;
  maxRetries: number;
  lastError?: string;
  lastRetry?: number;
  payload: Record<string, unknown>;
  metadata?: {
    projectId?: string;
    recordId?: string;
    animalId?: string;
    description?: string;
  };
}

const QUEUE_STORAGE_KEY = 'agrotensor-sync-queue';
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000; // Start with 5s, exponential backoff

function loadQueue(): QueuedOperation[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedOperation[]): void {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save sync queue:', e);
  }
}

export function generateQueueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function enqueueOperation(
  type: QueuedOperationType,
  payload: Record<string, unknown>,
  metadata?: QueuedOperation['metadata']
): QueuedOperation {
  const queue = loadQueue();
  const operation: QueuedOperation = {
    id: generateQueueId(),
    type,
    timestamp: Date.now(),
    retries: 0,
    maxRetries: MAX_RETRIES,
    payload,
    metadata,
  };
  queue.push(operation);
  saveQueue(queue);
  return operation;
}

export function getPendingOperations(): QueuedOperation[] {
  return loadQueue();
}

export function getPendingOperationsByType(type: QueuedOperationType): QueuedOperation[] {
  return loadQueue().filter(op => op.type === type);
}

export function getPendingOperationsForProject(projectId: string): QueuedOperation[] {
  return loadQueue().filter(op => op.metadata?.projectId === projectId);
}

export function getRetryableOperations(): QueuedOperation[] {
  const queue = loadQueue();
  const now = Date.now();
  const retryable: QueuedOperation[] = [];

  for (const op of queue) {
    if (op.retries >= op.maxRetries) continue;
    
    // Calculate exponential backoff: 5s, 10s, 20s, 40s, 80s
    const delayMs = RETRY_DELAY_MS * Math.pow(2, op.retries);
    const timeSinceLastRetry = now - (op.lastRetry || op.timestamp);
    
    if (timeSinceLastRetry >= delayMs) {
      retryable.push(op);
    }
  }

  return retryable;
}

export function updateOperationRetry(
  operationId: string,
  error?: string
): QueuedOperation | undefined {
  const queue = loadQueue();
  const op = queue.find(o => o.id === operationId);
  
  if (!op) return undefined;
  
  op.retries++;
  op.lastRetry = Date.now();
  if (error) {
    op.lastError = error.substring(0, 200); // Truncate error message
  }
  
  saveQueue(queue);
  return op;
}

export function removeOperation(operationId: string): void {
  const queue = loadQueue().filter(op => op.id !== operationId);
  saveQueue(queue);
}

export function removeOperations(operationIds: string[]): void {
  const idSet = new Set(operationIds);
  const queue = loadQueue().filter(op => !idSet.has(op.id));
  saveQueue(queue);
}

export function clearQueue(): void {
  saveQueue([]);
}

export function getQueueStats(): {
  total: number;
  retrying: number;
  failed: number;
  byType: Record<QueuedOperationType, number>;
} {
  const queue = loadQueue();
  const byType: Record<string, number> = {};
  
  let retrying = 0;
  let failed = 0;

  for (const op of queue) {
    byType[op.type] = (byType[op.type] || 0) + 1;
    
    if (op.retries > 0 && op.retries < op.maxRetries) {
      retrying++;
    } else if (op.retries >= op.maxRetries) {
      failed++;
    }
  }

  return {
    total: queue.length,
    retrying,
    failed,
    byType: byType as Record<QueuedOperationType, number>,
  };
}
