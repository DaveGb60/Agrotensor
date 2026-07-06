import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/registerSW";
import { startSyncService } from "./lib/syncService";
import { scheduleAutoSnapshot } from "./lib/dataRecovery";

createRoot(document.getElementById("root")!).render(<App />);

registerServiceWorker();

// Start the sync service for retrying offline operations
startSyncService({
  autoRetry: true,
  autoRetryInterval: 30000, // Retry every 30 seconds
  maxConcurrent: 3,
});

// Persist storage where supported so the browser is less likely to evict our
// IndexedDB across app updates and low-storage conditions.
if (typeof navigator !== "undefined" && navigator.storage?.persist) {
  navigator.storage.persist().catch(() => {
    /* ignore */
  });
}

// Write a rescue snapshot shortly after boot, then again whenever the tab is
// hidden — gives future app updates a fallback copy of the user's data in a
// separate IndexedDB (`agrotensor-db-backup`).
scheduleAutoSnapshot(5000);
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") scheduleAutoSnapshot(0);
  });
}
