export type ReaderPrefs = {
  font: 'serif' | 'sans';
  size: number;
  spacing: 'normal' | 'relaxed';
  width: 'narrow' | 'normal' | 'wide';
  paper: 'app' | 'sepia' | 'night';
};

const key = 'novel-studio-reader-prefs';
export const defaultReaderPrefs: ReaderPrefs = {
  font: 'serif', size: 20, spacing: 'normal', width: 'normal', paper: 'app',
};

export function loadReaderPrefs(): ReaderPrefs {
  try {
    const data = JSON.parse(localStorage.getItem(key) ?? 'null') as Partial<ReaderPrefs> | null;
    if (data) return {
      font: data.font === 'sans' ? 'sans' : 'serif',
      size: typeof data.size === 'number' && Number.isFinite(data.size)
        ? Math.min(32, Math.max(15, Math.round(data.size))) : defaultReaderPrefs.size,
      spacing: data.spacing === 'relaxed' ? 'relaxed' : 'normal',
      width: data.width === 'narrow' || data.width === 'wide' ? data.width : 'normal',
      paper: data.paper === 'sepia' || data.paper === 'night' ? data.paper : 'app',
    };
  } catch {
    // Appearance remains usable when storage is unavailable.
  }
  return { ...defaultReaderPrefs };
}

export function saveReaderPrefs(prefs: ReaderPrefs) {
  try { localStorage.setItem(key, JSON.stringify(prefs)); }
  catch { /* Allow reading with the current preferences for this session. */ }
}
