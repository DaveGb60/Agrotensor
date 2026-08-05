// Guarded service worker registration for offline support.
// Refuses to register in dev, Lovable preview, iframes, or when ?sw=off is set.
// Unregisters any matching stale registration in refused contexts.

const SW_URL = "/sw.js";

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
          const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
          return url.endsWith(SW_URL);
        })
        .map((r) => r.unregister())
    );
  } catch {
    // no-op
  }
}

export async function registerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  if (isRefusedContext()) {
    await unregisterMatching();
    return;
  }

  try {
    await navigator.serviceWorker.register(SW_URL, { scope: "/" });
  } catch (err) {
    console.warn("Service worker registration failed:", err);
  }
}
