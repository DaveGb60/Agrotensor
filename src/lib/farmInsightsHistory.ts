import { getDeviceId } from '@/lib/agroAI';
import type { FarmInsightHistoryItem } from '@/lib/farmInsightsHistoryCache';

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/farm-insights`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export interface FarmInsightHistorySummary extends Omit<FarmInsightHistoryItem, 'answer'> {}

async function request<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch(FN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${ANON}` },
    body: JSON.stringify({ ...body, deviceId: getDeviceId() }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.error) throw new Error(data?.error || 'Farm Insights history is unavailable.');
  return data as T;
}

export function fetchFarmInsightHistory() {
  return request<{ items: FarmInsightHistorySummary[] }>({ action: 'history-list' }).then((result) => result.items);
}

export function fetchFarmInsightHistoryItem(id: string) {
  return request<{ item: FarmInsightHistoryItem }>({ action: 'history-get', id }).then((result) => result.item);
}