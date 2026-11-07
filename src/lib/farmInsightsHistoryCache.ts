export const FARM_INSIGHT_CACHE_KEY = 'agrotensor-farm-insights-latest-v1';
export const FARM_INSIGHT_CACHE_TTL_MS = 48 * 60 * 60 * 1000;

export interface FarmInsightHistoryItem {
  id: string;
  project_id: string;
  project_title: string;
  question: string;
  answer: string;
  created_at: string;
}

interface CachedInsight {
  deviceId: string;
  expiresAt: number;
  insight: FarmInsightHistoryItem;
}

export function readLatestInsightCache(
  storage: Pick<Storage, 'getItem' | 'removeItem'>,
  deviceId: string,
  now = Date.now(),
): FarmInsightHistoryItem | null {
  try {
    const raw = storage.getItem(FARM_INSIGHT_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedInsight;
    if (cached.deviceId !== deviceId || !Number.isFinite(cached.expiresAt) || cached.expiresAt <= now) {
      storage.removeItem(FARM_INSIGHT_CACHE_KEY);
      return null;
    }
    return cached.insight;
  } catch {
    storage.removeItem(FARM_INSIGHT_CACHE_KEY);
    return null;
  }
}

export function cacheLatestInsight(
  storage: Pick<Storage, 'setItem'>,
  deviceId: string,
  insight: FarmInsightHistoryItem,
  now = Date.now(),
): void {
  try {
    const cached: CachedInsight = {
      deviceId,
      expiresAt: now + FARM_INSIGHT_CACHE_TTL_MS,
      insight,
    };
    storage.setItem(FARM_INSIGHT_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Local caching is best-effort; online history remains authoritative.
  }
}