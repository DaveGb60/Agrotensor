// Guarded service-worker registration.
// The app-shell service worker must NEVER register in dev, iframes, or Lovable
// preview hosts — otherwise stale HTML/chunks get served while building.

const SW_URL = "/sw.js";
const LEGACY_SW_URLS = ["/sw.js", "/service-worker.js"];

function isPreviewHost(hostname: string): boolean {
  return (
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev")
  );
}

function shouldRegister(): boolean {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!import.meta.env.PROD) return false;
  if (window.self !== window.top) return false;
  if (isPreviewHost(window.location.hostname)) return false;
  if (new URLSearchParams(window.location.search).has("sw")) {
    if (new URLSearchParams(window.location.search).get("sw") === "off") return false;
  }
  return true;
}

async function unregisterAppWorkers(): Promise<void> {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      registrations
        .filter((reg) => {
          const url = reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || "";
          return LEGACY_SW_URLS.some((path) => url.endsWith(path));
        })
        .map((reg) => reg.unregister()),
    );
  } catch {
    /* ignore */
  }
}

let reloading = false;

export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  if (!shouldRegister()) {
    void unregisterAppWorkers();
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(SW_URL, { scope: "/" })
      .then((registration) => {
        // Activate a waiting worker immediately so users never sit on stale code.
        const promote = () => {
          registration.waiting?.postMessage({ type: "SKIP_WAITING" });
        };
        promote();
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              promote();
            }
          });
        });

        const checkForUpdate = () => {
          if (document.visibilityState === "visible") {
            registration.update().catch(() => {
              /* offline is fine */
            });
          }
        };
        document.addEventListener("visibilitychange", checkForUpdate);
        window.addEventListener("focus", checkForUpdate);
      })
      .catch((error) => {
        console.error("Service worker registration failed:", error);
      });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
  });
}
