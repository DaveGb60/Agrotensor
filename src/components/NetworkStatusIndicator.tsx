import { useOfflineIndicator, useSyncStatus } from '@/hooks/useNetworkStatus';
import { AlertCircle, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function NetworkStatusIndicator() {
  const { isOffline, hasPending, message } = useOfflineIndicator();
  const { totalPending, failedCount, retryingCount } = useSyncStatus();

  if (!isOffline && !hasPending) {
    return null; // Don't show anything when everything is fine
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium ${
            failedCount > 0
              ? 'bg-destructive/10 text-destructive border border-destructive/20'
              : isOffline
              ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'
              : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800'
          }`}>
            {failedCount > 0 ? (
              <AlertCircle className="h-3.5 w-3.5" />
            ) : isOffline ? (
              <WifiOff className="h-3.5 w-3.5" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            )}
            <span>{message}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <p>Status: {isOffline ? 'Offline' : 'Online'}</p>
            {totalPending > 0 && (
              <>
                <p>Pending changes: {totalPending}</p>
                {retryingCount > 0 && <p>Retrying: {retryingCount}</p>}
                {failedCount > 0 && <p className="text-destructive">Failed: {failedCount}</p>}
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function SyncStatusBadge() {
  const { isOnline, isPending, totalPending, failedCount } = useSyncStatus();

  if (!isPending && isOnline) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
      {failedCount > 0 ? (
        <>
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive font-medium">{failedCount} sync error(s)</span>
        </>
      ) : isPending ? (
        <>
          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
          <span className="text-sm text-blue-600 font-medium">Syncing {totalPending} changes...</span>
        </>
      ) : !isOnline ? (
        <>
          <WifiOff className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-600 font-medium">Offline mode</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-600 font-medium">Synced</span>
        </>
      )}
    </div>
  );
}
