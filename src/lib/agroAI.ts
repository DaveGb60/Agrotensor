// AgroTensor AI client: device identity, local recent-chat cache, and calls
// to the agrotensor-ai backend function (which keeps all secrets server-side).

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agrotensor-ai`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const DEVICE_KEY = 'agrotensor-ai-device-id';
const CACHE_KEY = 'agrotensor-ai-chats';
const CLOUD_ONLY_KEY = 'agrotensor-ai-cloud-only';
const LOCAL_LIMIT = 10;

export interface AIConversation {
  id: string;
  title: string | null;
  preview: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  attachments: string[];
  status: 'sent' | 'failed' | 'pending' | 'streaming';
  created_at: string;
}

export interface AIQuota {
  messagesUsed: number;
  imagesUsed: number;
  messageLimit: number;
  imageLimit: number;
}

interface CachedChat extends AIConversation {
  messages: AIMessage[];
}

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

/* ---------------- Local cache (last 10 chats) ---------------- */

export function isCloudOnly() {
  return localStorage.getItem(CLOUD_ONLY_KEY) === 'true';
}
export function setCloudOnly(v: boolean) {
  localStorage.setItem(CLOUD_ONLY_KEY, String(v));
  if (v) localStorage.removeItem(CACHE_KEY);
}

function readCache(): CachedChat[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachedChat[]) : [];
  } catch {
    return [];
  }
}
function writeCache(list: CachedChat[]) {
  if (isCloudOnly()) return;
  const sorted = [...list].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, LOCAL_LIMIT);
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(sorted));
  } catch {
    /* storage full — ignore */
  }
}

export function getLocalConversations(): AIConversation[] {
  return readCache().map(({ messages: _m, ...c }) => c);
}
export function getLocalMessages(id: string): AIMessage[] | null {
  return readCache().find((c) => c.id === id)?.messages ?? null;
}
export function saveLocalChat(conv: AIConversation, messages: AIMessage[]) {
  const list = readCache().filter((c) => c.id !== conv.id);
  list.push({ ...conv, messages: messages.filter((m) => m.status !== 'pending' && m.status !== 'streaming') });
  writeCache(list);
}
export function removeLocalChat(id: string) {
  writeCache(readCache().filter((c) => c.id !== id));
}

/* ---------------- Backend calls ---------------- */

async function call<T>(action: string, extra: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${ANON}` },
    body: JSON.stringify({ action, userId: getDeviceId(), ...extra }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) throw new Error(data?.error || 'AgroTensor AI is unavailable right now.');
  return data as T;
}

export const fetchUsage = () => call<AIQuota>('usage');
export const fetchConversations = (before?: string) =>
  call<{ conversations: AIConversation[] }>('list', { limit: 20, before }).then((r) => r.conversations);
export const fetchMessages = (conversationId: string) =>
  call<{ messages: AIMessage[] }>('messages', { conversationId }).then((r) => r.messages);
export const searchConversations = (query: string) =>
  call<{ conversations: AIConversation[] }>('search', { query }).then((r) => r.conversations);
export const deleteConversation = (conversationId: string) => call('delete', { conversationId });
export const signPaths = (paths: string[]) =>
  call<{ urls: Record<string, string> }>('sign', { paths }).then((r) => r.urls);
export const uploadImage = (dataUrl: string) => call<{ path: string; url: string }>('upload', { dataUrl });

export interface ChatMeta {
  conversationId: string;
  title: string;
  messageId: string;
  createdAt: string;
  failed: boolean;
}

/** Sends a message and streams the reply token-by-token. */
export async function sendChat(
  params: { text: string; attachments: string[]; conversationId: string | null },
  handlers: { onMeta: (m: ChatMeta) => void; onToken: (t: string) => void },
): Promise<string> {
  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${ANON}` },
    body: JSON.stringify({ action: 'chat', userId: getDeviceId(), profile: profileToText(getProfile()), ...params }),
  });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data?.error || 'AgroTensor AI could not answer just now.') as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const block = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const event = /^event: (.+)$/m.exec(block)?.[1];
      const dataLine = /^data: (.+)$/m.exec(block)?.[1];
      if (!event || !dataLine) continue;
      const data = JSON.parse(dataLine);
      if (event === 'meta') handlers.onMeta(data);
      else if (event === 'token') {
        full += data.t;
        handlers.onToken(data.t);
      } else if (event === 'done') full = data.text;
    }
  }
  return full;
}

export function fileToDataUrl(file: File, maxSide = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('Could not read that photo.'));
    img.src = url;
  });
}

/* ---------------- Optional farm profile ---------------- */
const PROFILE_KEY = 'agrotensor-ai-profile';
export interface FarmProfile { location: string; farmType: string; crops: string; size: string; notes: string }
export function getProfile(): FarmProfile | null {
  try { const r = localStorage.getItem(PROFILE_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
export function saveProfile(p: FarmProfile | null) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p ?? { location: '', farmType: '', crops: '', size: '', notes: '' }));
}
export function hasSeenProfilePrompt() { return localStorage.getItem(PROFILE_KEY) !== null; }
export function profileToText(p: FarmProfile | null): string {
  if (!p) return '';
  return [
    p.location && `Location: ${p.location}`, p.farmType && `Farming type: ${p.farmType}`,
    p.crops && `Crops/livestock: ${p.crops}`, p.size && `Farm size: ${p.size}`, p.notes && `Notes: ${p.notes}`,
  ].filter(Boolean).join('; ');
}
