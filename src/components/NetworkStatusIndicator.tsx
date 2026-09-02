import { useState, useRef, useCallback, useEffect } from 'react';
import { useSyncStatus } from '@/hooks/useNetworkStatus';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const LONG_PRESS_MS = 500;
const TOOLTIP_HOLD_MS = 1500;

export function NetworkStatusIndicator() {
  const { isOnline } = useSyncStatus();
  const [open, setOpen] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const handlePointerDown = useCallback(() => {
    clearTimers();
    pressTimer.current = setTimeout(() => {
      setOpen(true);
      hideTimer.current = setTimeout(() => setOpen(false), TOOLTIP_HOLD_MS);
    }, LONG_PRESS_MS);
  }, [clearTimers]);

  const handlePointerUpLeave = useCallback(() => {
    // Cancel a pending long-press; if the tooltip is already open, let it
    // remain visible for the configured hold duration so the user can read it.
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={isOnline ? 'Online' : 'Offline'}
            className="inline-flex h-8 w-8 select-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent transition-colors"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUpLeave}
            onPointerLeave={handlePointerUpLeave}
            onPointerCancel={handlePointerUpLeave}
            onContextMenu={(e) => e.preventDefault()}
          >
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-xs">
            {isOnline
              ? 'You are online. Data will sync automatically.'
              : 'You are offline. Changes are saved locally and will sync when you reconnect.'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
