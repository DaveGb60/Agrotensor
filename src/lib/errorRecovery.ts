// Error recovery utilities for database and cloud operations
import { isNetworkOffline } from './networkStatus';
export { isNetworkOffline };

export class OfflineError extends Error {
  constructor(message: string, public operation: string) {
    super(message);
    this.name = 'OfflineError';
  }
}

export class StorageQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageQuotaError';
  }
}

export class DataIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataIntegrityError';
  }
}

export class OperationFailedError extends Error {
  constructor(message: string, public operation: string, public canRetry: boolean) {
    super(message);
    this.name = 'OperationFailedError';
  }
}

// Check if an error is due to being offline
export function isOfflineError(error: unknown): boolean {
  if (error instanceof OfflineError) return true;
  if (error instanceof TypeError && error.message.includes('fetch')) return true;
  if (error instanceof Error && error.message.includes('offline')) return true;
  return false;
}

// Check if an error is due to storage quota
export function isStorageQuotaError(error: unknown): boolean {
  if (error instanceof StorageQuotaError) return true;
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('quota') || 
           msg.includes('storage full') ||
           msg.includes('quota exceeded');
  }
  return false;
}

// Check if operation should be retried
export function shouldRetry(error: unknown): boolean {
  if (isNetworkOffline()) return true;
  if (isOfflineError(error)) return true;
  if (isStorageQuotaError(error)) return false; // Don't retry quota errors
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    // Retry transient errors
    return msg.includes('timeout') ||
           msg.includes('temporary') ||
           msg.includes('network') ||
           msg.includes('failed to fetch');
  }
  return false;
}

// Wrap an async operation with error handling and offline detection
export async function withErrorRecovery<T>(
  operation: () => Promise<T>,
  operationName: string,
  requiresNetwork: boolean = true
): Promise<T> {
  // Check if we're offline and this operation requires network
  if (requiresNetwork && isNetworkOffline()) {
    throw new OfflineError(`Cannot perform "${operationName}" while offline`, operationName);
  }

  try {
    return await operation();
  } catch (error) {
    // Re-throw with enhanced context
    if (isStorageQuotaError(error)) {
      throw new StorageQuotaError(
        `Storage quota exceeded during "${operationName}". Please delete some old projects to free space.`
      );
    }
    
    if (error instanceof Error && isOfflineError(error)) {
      throw new OfflineError(
        `Network error during "${operationName}": ${error.message}`,
        operationName
      );
    }

    throw error;
  }
}

// Retry operation with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if this is a permanent error
      if (!shouldRetry(error)) {
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Exponential backoff
      const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error('Unknown error');
}

// Atomically execute multiple operations (rollback on failure)
export async function withTransaction<T>(
  operations: Array<() => Promise<void>>,
  rollbacks: Array<() => Promise<void>> = []
): Promise<T | void> {
  const completed: number[] = [];

  try {
    for (let i = 0; i < operations.length; i++) {
      await operations[i]();
      completed.push(i);
    }
  } catch (error) {
    // Rollback completed operations in reverse order
    for (let i = rollbacks.length - 1; i >= 0; i--) {
      try {
        await rollbacks[i]();
      } catch (rollbackError) {
        console.error(`Rollback failed at step ${i}:`, rollbackError);
      }
    }
    throw error;
  }
}

// Batch operations with partial failure tolerance
export async function batchWithPartialFailure<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>
): Promise<{
  succeeded: Array<{ item: T; result: R }>;
  failed: Array<{ item: T; error: Error }>;
}> {
  const results = {
    succeeded: [] as Array<{ item: T; result: R }>,
    failed: [] as Array<{ item: T; error: Error }>,
  };

  for (const item of items) {
    try {
      const result = await operation(item);
      results.succeeded.push({ item, result });
    } catch (error) {
      results.failed.push({
        item,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  return results;
}
