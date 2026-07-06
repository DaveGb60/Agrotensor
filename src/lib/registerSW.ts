// Guarded service worker registration for offline support.
// - Refuses to register in dev, Lovable preview, iframes, or when ?sw=off is set.
// - Unregisters any matching stale registration in refused contexts.
// - Persists across updates: auto-activates a waiting worker and reloads once
//   the new SW takes control so users never get stuck on stale bundles.

const SW_URL = "/sw.js";
const APP_SHELL_SW_URLS = [SW_URL, "/service-worker.js"];
const OFFLINE_SHELL_URLS = ["/", "/app", "/index.html", "/offline.html", "/manifest.webmanifest", "/favicon.png"];

function isRefusedContext(): boolean {
  try {
    if (!import.meta.env.PROD) return true;
    if (typeof window === "undefined") return true;
    if (window.top !== window.self) return true;

    const host = window.location.hostname;
    if (
      host.startsWith("id-preview--") ||
      host.startsWith("preview--") ||
      host === "lovableproject.com" ||
      host.endsWith(".lovableproject.com") ||
      host === "lovableproject-dev.com" ||
      host.endsWith(".lovableproject-dev.com") ||
      host === "beta.lovable.dev" ||
      host.endsWith(".beta.lovable.dev")
    ) {
      return true;
    }

    if (new URL(window.location.href).searchParams.get("sw") === "off") {
      return true;
    }
  } catch {
    return true;
  }
  return false;
}

async function unregisterMatching() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      regs
        .filter((r) => {
          const url =
            r.active?.scriptURL ||
            r.installing?.scriptURL ||
            r.waiting?.scriptURL ||
            "";
          return APP_SHELL_SW_URLS.some((swUrl) => url.endsWith(swUrl));
        })
        .map((r) => r.unregister())
    );
  } catch {
    // no-op
  }
}

function promptWaitingToActivate(reg: ServiceWorkerRegistration) {
  // Ask a waiting SW (from skipWaiting-capable builds) to take over immediately.
  if (reg.waiting) {
    try {
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
    } catch {
      // ignore
    }
  }
}

let reloadScheduled = false;
function scheduleControllerReload() {
  if (reloadScheduled) return;
  reloadScheduled = true;
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // Only reload once, and only if this page was already controlled — that
    // means an update took over, not a first-install. This avoids reload loops
    // on the very first visit.
    if (!hadController || !navigator.serviceWorker.controller) return;
    window.location.reload();
  });
}

function waitForController(timeoutMs = 8000): Promise<void> {
  if (navigator.serviceWorker.controller) return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", finish);
      resolve();
    };

    navigator.serviceWorker.addEventListener("controllerchange", finish);
    window.setTimeout(finish, timeoutMs);
  });
}

async function warmOfflineShell() {
  if (!navigator.onLine) return;

  try {
    await navigator.serviceWorker.ready;
    await waitForController();
    if (!navigator.serviceWorker.controller) return;

    await Promise.allSettled(
      OFFLINE_SHELL_URLS.map((url) =>
        fetch(url, {
          cache: "reload",
          credentials: "same-origin",
        })
      )
    );
  } catch {
    // Offline preparation should never block app startup.
  }
}

export async function registerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  if (isRefusedContext()) {
    await unregisterMatching();
    return;
  }

  try {
    scheduleControllerReload();

    const reg = await navigator.serviceWorker.register(SW_URL, { scope: "/" });

    // Kick any already-waiting worker.
    promptWaitingToActivate(reg);

    // When a new SW is found, wait until it's installed then activate it.
    reg.addEventListener("updatefound", () => {
      const installing = reg.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          promptWaitingToActivate(reg);
        }
      });
    });

    // Poll for updates when the tab regains focus / becomes visible.
    const checkForUpdate = () => {
      reg.update().catch(() => {
        /* offline or transient — ignore */
      });
    };
    window.addEventListener("focus", checkForUpdate);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") checkForUpdate();
    });

    void warmOfflineShell();
  } catch (err) {
    console.warn("Service worker registration failed:", err);
  }
}
