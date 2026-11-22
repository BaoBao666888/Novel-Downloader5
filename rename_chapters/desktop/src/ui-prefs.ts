/**
 * UI & Motion Customization Foundation (Schema v1).
 *
 * Chừa đường cho tính năng tùy chỉnh giao diện và hiệu ứng chuyển động (theme, accent,
 * surface/glass, density, animation intensity) mà không phải refactor component về sau.
 * Các component chỉ đọc CSS custom properties (--motion-*, --accent*, --radius*, --surface*)
 * được điều khiển tập trung bởi `applyUiPrefs()`.
 */

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentPreset = 'ocean' | 'forest' | 'indigo' | 'amber' | 'rose';
export type SurfaceStyle = 'editorial' | 'glass' | 'crisp';
export type DensityMode = 'comfortable' | 'compact';
export type MotionMode = 'full' | 'reduced' | 'none';
export type AppLocale = 'vi' | 'en';

export type UiPrefs = {
  version: 1;
  locale: AppLocale;
  theme: ThemeMode;
  accent: AccentPreset;
  surface: SurfaceStyle;
  density: DensityMode;
  motion: MotionMode;
};

const STORAGE_KEY = 'novel-studio-ui-prefs';
const LEGACY_THEME_KEY = 'novel-studio-theme';

export const DEFAULT_UI_PREFS: UiPrefs = {
  version: 1,
  locale: 'vi',
  theme: 'system',
  accent: 'ocean',
  surface: 'editorial',
  density: 'comfortable',
  motion: 'full',
};

export function loadUiPrefs(): UiPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UiPrefs>;
      return {
        version: 1,
        locale: isOneOf(parsed.locale, ['vi', 'en']) ? parsed.locale : DEFAULT_UI_PREFS.locale,
        theme: isOneOf(parsed.theme, ['light', 'dark', 'system']) ? parsed.theme : DEFAULT_UI_PREFS.theme,
        accent: isOneOf(parsed.accent, ['ocean', 'forest', 'indigo', 'amber', 'rose']) ? parsed.accent : DEFAULT_UI_PREFS.accent,
        surface: isOneOf(parsed.surface, ['editorial', 'glass', 'crisp']) ? parsed.surface : DEFAULT_UI_PREFS.surface,
        density: isOneOf(parsed.density, ['comfortable', 'compact']) ? parsed.density : DEFAULT_UI_PREFS.density,
        motion: isOneOf(parsed.motion, ['full', 'reduced', 'none']) ? parsed.motion : DEFAULT_UI_PREFS.motion,
      };
    }
    const legacy = localStorage.getItem(LEGACY_THEME_KEY);
    if (legacy === 'dark' || legacy === 'light') {
      return { ...DEFAULT_UI_PREFS, theme: legacy };
    }
  } catch {
    // Ignore storage access errors in restricted environments.
  }
  return { ...DEFAULT_UI_PREFS };
}

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'light' || mode === 'dark') return mode;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyUiPrefs(prefs: UiPrefs): 'light' | 'dark' {
  const resolved = resolveTheme(prefs.theme);
  const root = document.documentElement;
  root.lang = prefs.locale;
  root.dataset.theme = resolved;
  root.dataset.accent = prefs.accent;
  root.dataset.surface = prefs.surface;
  root.dataset.density = prefs.density;
  root.dataset.motion = prefs.motion;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    localStorage.setItem(LEGACY_THEME_KEY, resolved);
  } catch {
    // Ignore storage write failures.
  }
  return resolved;
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}
