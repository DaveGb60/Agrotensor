// Maps technical/system errors into calm, human-readable messages for the UI.

const PATTERNS: Array<{ test: RegExp; message: string }> = [
  { test: /locked/i, message: 'This entry is locked, so it can no longer be changed.' },
  { test: /completed/i, message: 'This project is completed and can no longer be edited.' },
  { test: /not found|no such|missing record/i, message: 'We could not find that item — it may have been removed.' },
  { test: /quota|storage|indexeddb|disk/i, message: 'Your device storage is full. Free up some space and try again.' },
  { test: /network|fetch|offline|failed to fetch|timeout|edge function|non-2xx|502|503|504/i, message: 'You appear to be offline. Your work is saved on this device and will sync later.' },
  { test: /unauthor|forbidden|401|403|jwt|token/i, message: 'You do not have permission to do that. Try signing in again.' },
  { test: /json|parse|unexpected token|invalid/i, message: 'That file or code could not be read. Please check it and try again.' },
];

export function friendlyError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  if (!raw) return fallback;

  for (const { test, message } of PATTERNS) {
    if (test.test(raw)) return message;
  }

  // Anything that looks like a stack trace, code identifier or internal error is hidden.
  const looksTechnical = /\b(TypeError|ReferenceError|SyntaxError|undefined|null|Object|Promise|at\s+\w+\.|\{|\}|=>)\b/.test(raw)
    || raw.length > 140;
  return looksTechnical ? fallback : raw;
}
