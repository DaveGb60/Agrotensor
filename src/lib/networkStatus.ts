// Network status detection and management
type StatusListener = (online: boolean) => void;

let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
const listeners = new Set<StatusListener>();

// Initialize network listeners
if (typeof window !== 'undefined') {
  const handleOnline = () => {
    if (!isOnline) {
      isOnline = true;
      notifyListeners();
    }
  };

  const handleOffline = () => {
    if (isOnline) {
      isOnline = false;
      notifyListeners();
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Periodic check for network (fallback)
  setInterval(() => {
    const wasOnline = isOnline;
    const currentOnline = navigator.onLine;
    if (wasOnline !== currentOnline) {
      isOnline = currentOnline;
      notifyListeners();
    }
  }, 5000);
}

function notifyListeners() {
  listeners.forEach(listener => {
    try {
      listener(isOnline);
    } catch (e) {
      console.error('Network status listener error:', e);
    }
  });
}

export function getNetworkStatus(): boolean {
  return isOnline;
}

export function onNetworkStatusChange(listener: StatusListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isNetworkOnline(): boolean {
  return isOnline;
}

export function isNetworkOffline(): boolean {
  return !isOnline;
}
