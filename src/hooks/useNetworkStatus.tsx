// React hooks for network and sync status
import { useState, useEffect } from 'react';
import { getNetworkStatus, onNetworkStatusChange } from '@/lib/networkStatus';
import { 
  getPendingOperations, 
  getQueueStats, 
  QueuedOperation,
  getRetryableOperations 
} from '@/lib/syncQueue';

export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => getNetworkStatus());

  useEffect(() => {
    const unsubscribe = onNetworkStatusChange((online) => {
      setIsOnline(online);
    });
    return unsubscribe;
  }, []);

  return isOnline;
}

export interface SyncStatus {
  isOnline: boolean;
  isPending: boolean;
  totalPending: number;
  failedCount: number;
  retryingCount: number;
  pendingOperations: QueuedOperation[];
  lastError?: string;
}

export function useSyncStatus(): SyncStatus {
  const isOnline = useNetworkStatus();
  const [pending, setPending] = useState<QueuedOperation[]>([]);
  const [stats, setStats] = useState(getQueueStats());

  useEffect(() => {
    // Initial load
    setPending(getPendingOperations());
    setStats(getQueueStats());

    // Check for changes periodically
    const interval = setInterval(() => {
      setPending(getPendingOperations());
      setStats(getQueueStats());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const lastFailedOp = pending.find(op => op.lastError);

  return {
    isOnline,
    isPending: pending.length > 0,
    totalPending: stats.total,
    failedCount: stats.failed,
    retryingCount: stats.retrying,
    pendingOperations: pending,
    lastError: lastFailedOp?.lastError,
  };
}

export function useOfflineIndicator(): {
  isOffline: boolean;
  hasPending: boolean;
  message: string;
} {
  const isOnline = useNetworkStatus();
  const { totalPending } = useSyncStatus();

  return {
    isOffline: !isOnline,
    hasPending: totalPending > 0,
    message: !isOnline 
      ? `Offline${totalPending > 0 ? ` - ${totalPending} pending changes` : ''}`
      : totalPending > 0 
      ? `Syncing ${totalPending} changes...`
      : '',
  };
}

export function useSyncRetry(): {
  retryableCount: number;
  isRetrying: boolean;
  retry: () => Promise<void>;
} {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryable, setRetryable] = useState<QueuedOperation[]>([]);

  useEffect(() => {
    const updateRetryable = () => {
      setRetryable(getRetryableOperations());
    };
    updateRetryable();

    const interval = setInterval(updateRetryable, 1000);
    return () => clearInterval(interval);
  }, []);

  const retry = async () => {
    setIsRetrying(true);
    try {
      // This would be called by the sync service
      // For now, just update the list
      setRetryable(getRetryableOperations());
    } finally {
      setIsRetrying(false);
    }
  };

  return {
    retryableCount: retryable.length,
    isRetrying,
    retry,
  };
}
