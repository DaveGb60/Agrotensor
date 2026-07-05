// Stable per-browser device identifier + active-session token for admins.
// Stored in localStorage. The device_id is a random opaque value (no PII)
// that lets the server recognise this browser on future visits.

const DEVICE_KEY = 'farmdeck.admin.device_id';
const SESSION_KEY = 'farmdeck.admin.session_id';

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function newSessionId(): string {
  const id = uuid();
  localStorage.setItem(SESSION_KEY, id);
  return id;
}

export function getSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function clearSessionId() {
  localStorage.removeItem(SESSION_KEY);
}

export function describeDevice(): string {
  return typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
}
