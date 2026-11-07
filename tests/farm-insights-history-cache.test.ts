import { describe, expect, test } from 'bun:test';
import {
  cacheLatestInsight,
  FARM_INSIGHT_CACHE_KEY,
  FARM_INSIGHT_CACHE_TTL_MS,
  readLatestInsightCache,
  type FarmInsightHistoryItem,
} from '../src/lib/farmInsightsHistoryCache';

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
    has: (key: string) => values.has(key),
  };
}

const insight: FarmInsightHistoryItem = {
  id: 'history-1',
  project_id: 'project-1',
  project_title: 'Maize season',
  question: 'Review costs',
  answer: 'Feed costs were highest.',
  created_at: '2026-11-07T00:00:00.000Z',
};

describe('Farm Insights latest-entry cache', () => {
  test('expires at exactly 48 hours', () => {
    const storage = createStorage();
    const savedAt = 1_800_000_000_000;
    cacheLatestInsight(storage, 'device-a', insight, savedAt);
    expect(readLatestInsightCache(storage, 'device-a', savedAt + FARM_INSIGHT_CACHE_TTL_MS - 1)).toEqual(insight);
    expect(readLatestInsightCache(storage, 'device-a', savedAt + FARM_INSIGHT_CACHE_TTL_MS)).toBeNull();
    expect(storage.has(FARM_INSIGHT_CACHE_KEY)).toBe(false);
  });

  test('retains only one latest insight', () => {
    const storage = createStorage();
    cacheLatestInsight(storage, 'device-a', insight, 100);
    const latest = { ...insight, id: 'history-2', question: 'Review yields' };
    cacheLatestInsight(storage, 'device-a', latest, 200);
    expect(readLatestInsightCache(storage, 'device-a', 201)).toEqual(latest);
  });

  test('does not expose a cached insight to another device identity', () => {
    const storage = createStorage();
    cacheLatestInsight(storage, 'device-a', insight, 100);
    expect(readLatestInsightCache(storage, 'device-b', 101)).toBeNull();
    expect(storage.has(FARM_INSIGHT_CACHE_KEY)).toBe(false);
  });
});