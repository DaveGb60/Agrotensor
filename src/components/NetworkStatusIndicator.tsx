import { useState, useRef, useCallback, useEffect } from 'react';
import { useSyncStatus } from '@/hooks/useNetworkStatus';

const LONG_PRESS_MS = 500;
const TOOLTIP_HOLD_MS = 1500;

export function NetworkStatusIndicator() {
  const { isOnline } = useSyncStatus();
  const [showDescription, setShowDescription] = useState(false);
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
      setShowDescription(true);
      hideTimer.current = setTimeout(() => setShowDescription(false), TOOLTIP_HOLD_MS);
    }, LONG_PRESS_MS);
  }, [clearTimers]);

  const handlePointerUpLeave = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  return (
    <button
      type="button"
      aria-label={isOnline ? 'Online' : 'Offline'}
      className="relative inline-flex h-8 w-8 select-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent transition-colors"
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
      {showDescription && (
        <span className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
          {isOnline
            ? 'You are online. Data will sync automatically.'
            : 'You are offline. Changes are saved locally and will sync when you reconnect.'}
        </span>
      )}
    </button>
  );
}
