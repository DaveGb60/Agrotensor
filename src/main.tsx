import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/registerSW";
import { startSyncService } from "./lib/syncService";

createRoot(document.getElementById("root")!).render(<App />);

registerServiceWorker();

// Start the sync service for retrying offline operations
startSyncService({
  autoRetry: true,
  autoRetryInterval: 30000, // Retry every 30 seconds
  maxConcurrent: 3,
});
