/**
 * Lightweight Regex History & Pinned Presets store (Schema v1).
 * Persists recent and pinned regex patterns per workbench scope in localStorage.
 */

export type RegexScope = 'split' | 'renumber' | 'replace' | 'toc';

export type SavedRegex = {
  id: string;
  pattern: string;
  secondary?: string;
  pinned: boolean;
  usedAt: number;
};

type StorePayload = {
  version: 1;
  scopes: Record<RegexScope, SavedRegex[]>;
};

const STORAGE_KEY = 'novel-studio-regex-presets';
const MAX_PER_SCOPE = 8;

function emptyStore(): StorePayload {
  return {
    version: 1,
    scopes: { split: [], renumber: [], replace: [], toc: [] },
  };
}

function loadStore(): StorePayload {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<StorePayload>;
    if (parsed.version !== 1 || !parsed.scopes) return emptyStore();
    const base = emptyStore();
    for (const scope of ['split', 'renumber', 'replace', 'toc'] as const) {
      const list = parsed.scopes[scope];
      if (Array.isArray(list)) {
        base.scopes[scope] = list
          .filter((item) => item && typeof item.pattern === 'string' && item.pattern.length > 0)
          .slice(0, MAX_PER_SCOPE);
      }
    }
    return base;
  } catch {
    return emptyStore();
  }
}

function saveStore(store: StorePayload) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore storage quota errors
  }
}

export function listSavedRegexes(scope: RegexScope): SavedRegex[] {
  const list = loadStore().scopes[scope];
  return [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.usedAt - a.usedAt);
}

export function recordRegexUsage(scope: RegexScope, pattern: string, secondary?: string): SavedRegex[] {
  const trimmed = pattern.trim();
  if (!trimmed) return listSavedRegexes(scope);
  const store = loadStore();
  const list = store.scopes[scope];
  const existing = list.find((item) => item.pattern === trimmed && (item.secondary ?? '') === (secondary ?? ''));
  if (existing) {
    existing.usedAt = Date.now();
  } else {
    list.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      pattern: trimmed,
      secondary,
      pinned: false,
      usedAt: Date.now(),
    });
  }
  // Keep all pinned items + most recent unpinned up to MAX_PER_SCOPE
  const pinned = list.filter((i) => i.pinned);
  const recent = list
    .filter((i) => !i.pinned)
    .sort((a, b) => b.usedAt - a.usedAt)
    .slice(0, Math.max(0, MAX_PER_SCOPE - pinned.length));
  store.scopes[scope] = [...pinned, ...recent];
  saveStore(store);
  return listSavedRegexes(scope);
}

export function togglePinRegex(scope: RegexScope, id: string): SavedRegex[] {
  const store = loadStore();
  const entry = store.scopes[scope].find((item) => item.id === id);
  if (entry) {
    entry.pinned = !entry.pinned;
    saveStore(store);
  }
  return listSavedRegexes(scope);
}

export function removeSavedRegex(scope: RegexScope, id: string): SavedRegex[] {
  const store = loadStore();
  store.scopes[scope] = store.scopes[scope].filter((item) => item.id !== id);
  saveStore(store);
  return listSavedRegexes(scope);
}
