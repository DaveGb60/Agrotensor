import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { startSyncService } from "./lib/syncService";
import { scheduleAutoSnapshot } from "./lib/dataRecovery";
import { getDB } from "./lib/db";

createRoot(document.getElementById("root")!).render(<App />);


startSyncService({
  autoRetry: true,
  autoRetryInterval: 30000,
  maxConcurrent: 3,
});

if (typeof navigator !== "undefined" && navigator.storage?.persist) {
  navigator.storage.persist().catch(() => {
    /* ignore */
  });
}

getDB().catch((error) => {
  console.error("Failed to initialize database:", error);
});

scheduleAutoSnapshot(5000);
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") scheduleAutoSnapshot(0);
  });
}
