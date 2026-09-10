import { useState, useEffect } from 'react';
import { getSavedMapTheme, saveMapTheme, MapVisualTheme } from '../lib/mapThemes';
import { getProvinceChineseName } from '../lib/provinceTranslations';

export type UiLanguage = 'zh-CN' | 'zh-TW' | 'en-US' | 'de-DE';
export type GeoNamingMode = 'native_cn' | 'endonym' | 'bilingual';
export type ThemeAccent = '#6B50F0' | '#2563EB' | '#059669' | '#DC2626' | '#D97706' | '#334155';
export type ContrastMode = 'standard' | 'high';
export type SimulationFps = '60' | '30';

export interface AppSettings {
  uiLanguage: UiLanguage;
  themeAccent: ThemeAccent;
  mapTheme: MapVisualTheme;
  geoNamingMode: GeoNamingMode;
  showDebugGeoId: boolean;
  contrastMode: ContrastMode;
  simulationFps: SimulationFps;
  soundEffects: boolean;
  showGridLines: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  uiLanguage: 'zh-CN',
  themeAccent: '#6B50F0',
  mapTheme: 'white',
  geoNamingMode: 'native_cn',
  showDebugGeoId: false,
  contrastMode: 'standard',
  simulationFps: '60',
  soundEffects: true,
  showGridLines: false,
};

const STORAGE_KEY = 'virtual_world_app_settings_v3';

// Audio Context Singleton for Tactical Sound Effects
let audioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Tactical audio synthesizer: emits tactical click, toggle, and alert chimes
 */
export function playTacticalAudio(type: 'click' | 'toggle' | 'alert' | 'success' | 'test' = 'click') {
  try {
    const settings = getAppSettings();
    if (!settings.soundEffects && type !== 'test') return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'toggle') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.06);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'success' || type === 'test') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.06); // A5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch {
    // ignore audio restrictions
  }
}

/**
 * Apply settings to DOM: CSS variables, dynamic styles, html lang, contrast classes
 */
function applySettingsToDOM(settings: AppSettings): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // 1. Language attribute
  root.lang = settings.uiLanguage;

  // 2. High contrast mode class
  if (settings.contrastMode === 'high') {
    root.classList.add('high-contrast-mode');
  } else {
    root.classList.remove('high-contrast-mode');
  }

  // 3. System color theme (dark/light) - 整体偏黑深色系
  const isDark = settings.mapTheme === 'grey';
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // 4. Theme accent variables
  const accent = settings.themeAccent;
  root.style.setProperty('--theme-accent', accent);
  root.style.setProperty('--color-primary', accent);
  root.style.setProperty('--primary', accent);
  root.style.setProperty('--ring', accent);

  // 5. Inject or update dynamic theme stylesheet
  let styleEl = document.getElementById('virtual-world-dynamic-accent') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'virtual-world-dynamic-accent';
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    :root {
      --theme-accent: ${accent};
      --color-primary: ${accent};
    }
    .theme-accent-bg, .bg-indigo-600 {
      background-color: ${accent} !important;
    }
    .theme-accent-text, .text-indigo-600, .text-[#6B50F0] {
      color: ${accent} !important;
    }
    .theme-accent-border, .border-indigo-600, .border-[#6B50F0] {
      border-color: ${accent} !important;
    }
    .high-contrast-mode {
      --border: rgba(0, 0, 0, 0.28);
    }
    .high-contrast-mode .border-slate-200 {
      border-color: #cbd5e1 !important;
    }

    /* 全局系统深色系 (整体偏黑战备暗色质感) */
    html.dark {
      color-scheme: dark;
      background-color: #0B0F19 !important;
    }
    html.dark body {
      background-color: #0B0F19 !important;
      color: #F1F5F9 !important;
    }
    html.dark .bg-white {
      background-color: #111827 !important;
    }
    html.dark .bg-slate-50,
    html.dark .bg-slate-50\\/70,
    html.dark .bg-slate-50\\/80,
    html.dark .bg-slate-50\\/90 {
      background-color: #0B0F19 !important;
    }
    html.dark .bg-slate-100 {
      background-color: #1A2234 !important;
    }
    html.dark .bg-slate-200 {
      background-color: #242E42 !important;
    }
    html.dark .bg-\\[\\#F7F9FC\\] {
      background-color: #151D2C !important;
    }
    html.dark .bg-\\[\\#F8F7FF\\] {
      background-color: #1C1838 !important;
    }
    html.dark .bg-white\\/95,
    html.dark .bg-white\\/90,
    html.dark .bg-white\\/80 {
      background-color: rgba(17, 24, 39, 0.94) !important;
    }
    html.dark .text-slate-900,
    html.dark .text-\\[\\#0F172A\\] {
      color: #F8FAFC !important;
    }
    html.dark .text-slate-800 {
      color: #E2E8F0 !important;
    }
    html.dark .text-slate-700 {
      color: #CBD5E1 !important;
    }
    html.dark .text-slate-600,
    html.dark .text-\\[\\#64748B\\] {
      color: #94A3B8 !important;
    }
    html.dark .text-slate-500 {
      color: #718096 !important;
    }
    html.dark .border-slate-200,
    html.dark .border-slate-200\\/90,
    html.dark .border-slate-200\\/80,
    html.dark .border-slate-100,
    html.dark .border-\\[\\#E2E8F0\\] {
      border-color: #1E293B !important;
    }
    html.dark .border-slate-300 {
      border-color: #334155 !important;
    }
    html.dark input,
    html.dark select,
    html.dark textarea {
      color: #F8FAFC !important;
    }
    html.dark input::placeholder,
    html.dark textarea::placeholder {
      color: #64748B !important;
    }
  `;

  // 6. Sync map theme
  saveMapTheme(settings.mapTheme);
}

// Global cached settings
let currentSettings: AppSettings | null = null;
const listeners = new Set<(settings: AppSettings) => void>();

export function getAppSettings(): AppSettings {
  if (currentSettings) return currentSettings;

  if (typeof window === 'undefined') return { ...DEFAULT_APP_SETTINGS };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      currentSettings = {
        ...DEFAULT_APP_SETTINGS,
        ...parsed,
        mapTheme: getSavedMapTheme() || parsed.mapTheme || 'white',
      };
      applySettingsToDOM(currentSettings);
      return currentSettings;
    }
  } catch {
    // fallback
  }

  // Check legacy keys
  try {
    const legacyLang = (localStorage.getItem('virtual_world_ui_lang') as UiLanguage) || 'zh-CN';
    const legacyAccent = (localStorage.getItem('virtual_world_theme_accent') as ThemeAccent) || '#6B50F0';
    const legacyGeo = (localStorage.getItem('virtual_world_geo_naming') as GeoNamingMode) || 'native_cn';
    const legacyDebug = localStorage.getItem('virtual_world_debug_geo_id') === 'true';
    const legacyContrast = (localStorage.getItem('virtual_world_contrast') as ContrastMode) || 'standard';
    const legacyFps = (localStorage.getItem('virtual_world_sim_fps') as SimulationFps) || '60';
    const legacySound = localStorage.getItem('virtual_world_sound') !== 'false';
    const legacyGrid = localStorage.getItem('virtual_world_grid_lines') === 'true';

    currentSettings = {
      uiLanguage: legacyLang,
      themeAccent: legacyAccent,
      mapTheme: getSavedMapTheme(),
      geoNamingMode: legacyGeo,
      showDebugGeoId: legacyDebug,
      contrastMode: legacyContrast,
      simulationFps: legacyFps,
      soundEffects: legacySound,
      showGridLines: legacyGrid,
    };
  } catch {
    currentSettings = { ...DEFAULT_APP_SETTINGS };
  }

  applySettingsToDOM(currentSettings);
  return currentSettings;
}

export function saveAppSettings(newSettings: Partial<AppSettings>): AppSettings {
  const merged: AppSettings = {
    ...getAppSettings(),
    ...newSettings,
  };

  currentSettings = merged;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    // Also save legacy keys for compatibility
    localStorage.setItem('virtual_world_ui_lang', merged.uiLanguage);
    localStorage.setItem('virtual_world_theme_accent', merged.themeAccent);
    localStorage.setItem('virtual_world_geo_naming', merged.geoNamingMode);
    localStorage.setItem('virtual_world_debug_geo_id', String(merged.showDebugGeoId));
    localStorage.setItem('virtual_world_contrast', merged.contrastMode);
    localStorage.setItem('virtual_world_sim_fps', merged.simulationFps);
    localStorage.setItem('virtual_world_sound', String(merged.soundEffects));
    localStorage.setItem('virtual_world_grid_lines', String(merged.showGridLines));
  } catch {
    // ignore
  }

  applySettingsToDOM(merged);

  // Dispatch events to notify listeners and other components (like WorldMap)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-settings-changed', { detail: merged }));
    window.dispatchEvent(new CustomEvent('virtual-world-theme-change', { detail: merged.mapTheme }));
  }

  listeners.forEach((fn) => fn(merged));
  return merged;
}

export const updateAppSettings = saveAppSettings;

/**
 * React Hook to subscribe to AppSettings updates
 */
export function useAppSettings(): {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  playTacticalSound: (type?: 'click' | 'toggle' | 'alert' | 'success' | 'test') => void;
} {
  const [settings, setSettings] = useState<AppSettings>(() => getAppSettings());

  useEffect(() => {
    // Synchronize initial state
    setSettings(getAppSettings());

    const handleUpdate = (updated: AppSettings) => {
      setSettings(updated);
    };

    listeners.add(handleUpdate);

    const handleCustomEvent = (e: any) => {
      if (e.detail) {
        setSettings({ ...e.detail });
      }
    };

    window.addEventListener('app-settings-changed', handleCustomEvent);

    return () => {
      listeners.delete(handleUpdate);
      window.removeEventListener('app-settings-changed', handleCustomEvent);
    };
  }, []);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    saveAppSettings({ [key]: value });
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    saveAppSettings(newSettings);
  };

  const resetSettings = () => {
    saveAppSettings(DEFAULT_APP_SETTINGS);
  };

  return {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
    playTacticalSound: playTacticalAudio,
  };
}

/**
 * Geopolitical naming formatter that obeys geoNamingMode and showDebugGeoId settings
 */
export function formatGeoName(
  rawName: string | number | undefined | null,
  stateId?: string | number | null,
  customMode?: GeoNamingMode,
  customShowId?: boolean
): string {
  if (rawName === undefined || rawName === null || rawName === '') return '';

  const settings = getAppSettings();
  const mode = customMode || settings.geoNamingMode;
  const showId = customShowId !== undefined ? customShowId : settings.showDebugGeoId;

  const rawStr = String(rawName).trim();
  const chineseName = getProvinceChineseName(rawStr, stateId);

  let displayName = chineseName || rawStr;

  if (mode === 'endonym') {
    displayName = rawStr;
  } else if (mode === 'bilingual') {
    if (chineseName && chineseName !== rawStr) {
      displayName = `${chineseName} (${rawStr})`;
    } else {
      displayName = rawStr;
    }
  } else {
    // native_cn
    displayName = chineseName || rawStr;
  }

  if (showId && stateId !== undefined && stateId !== null && stateId !== '') {
    displayName = `${displayName} [#${stateId}]`;
  }

  return displayName;
}

/**
 * Lightweight localization dictionary for UI terms
 */
export const I18N_DICT: Record<string, Record<UiLanguage, string>> = {
  // Navigation tabs
  'nav.lobby': { 'zh-CN': '国家大厅', 'zh-TW': '國家大廳', 'en-US': 'Grand Lobby', 'de-DE': 'Große Lobby' },
  'nav.my_nation': { 'zh-CN': '创作者中心', 'zh-TW': '創作者中心', 'en-US': 'Creator Studio', 'de-DE': 'Schöpfer-Zentrum' },
  'nav.world_map': { 'zh-CN': '世界沙盘', 'zh-TW': '世界沙盤', 'en-US': 'World Map', 'de-DE': 'Weltkarte' },
  'nav.focus_tree': { 'zh-CN': '战略国策', 'zh-TW': '戰略國策', 'en-US': 'National Focus', 'de-DE': 'Schwerpunkt' },
  'nav.army': { 'zh-CN': '陆军指挥', 'zh-TW': '陸軍指揮', 'en-US': 'Army Command', 'de-DE': 'Armeekommando' },
  'nav.research': { 'zh-CN': '国家科研', 'zh-TW': '國家科研', 'en-US': 'Research & Tech', 'de-DE': 'Forschung' },
  'nav.workspace': { 'zh-CN': '推演矩阵', 'zh-TW': '推演矩陣', 'en-US': 'Scenarios', 'de-DE': 'Szenarien' },
  'nav.admin': { 'zh-CN': '管理控制', 'zh-TW': '管理控制', 'en-US': 'Admin Panel', 'de-DE': 'Admin-Bereich' },
  
  // Settings modal terms
  'settings.modal_title': { 'zh-CN': '系统设置', 'zh-TW': '系統設定', 'en-US': 'System Settings', 'de-DE': 'Systemeinstellungen' },
  'settings.modal_sub': { 'zh-CN': '实时调试语言、强调色调、地图渲染与引擎推演参数', 'zh-TW': '即時調試語言、強調色調、地圖渲染與引擎推演參數', 'en-US': 'Live debugging for language, accent colors, map rendering and engine', 'de-DE': 'Live-Debugging für Sprache, Akzentfarben, Kartendesign und Engine' },
  'settings.tab_interface': { 'zh-CN': '界面与地图', 'zh-TW': '介面與地圖', 'en-US': 'Interface & Map', 'de-DE': 'Oberfläche' },
  'settings.tab_language': { 'zh-CN': '语言与地名', 'zh-TW': '語言與地名', 'en-US': 'Language', 'de-DE': 'Sprache' },
  'settings.tab_engine': { 'zh-CN': '推演与引擎', 'zh-TW': '推演與引擎', 'en-US': 'Simulation', 'de-DE': 'Simulation' },
  'settings.apply': { 'zh-CN': '立即生效', 'zh-TW': '立即生效', 'en-US': 'Apply Now', 'de-DE': 'Jetzt anwenden' },
  'settings.close': { 'zh-CN': '完成', 'zh-TW': '完成', 'en-US': 'Done', 'de-DE': 'Fertig' },
  'settings.reset': { 'zh-CN': '重置', 'zh-TW': '重設', 'en-US': 'Reset', 'de-DE': 'Reset' },
  'settings.current_config': { 'zh-CN': '当前配置', 'zh-TW': '目前配置', 'en-US': 'Config', 'de-DE': 'Konfiguration' },
};

export function t(key: string, defaultText?: string): string {
  const settings = getAppSettings();
  const lang = settings.uiLanguage;
  if (I18N_DICT[key] && I18N_DICT[key][lang]) {
    return I18N_DICT[key][lang];
  }
  return defaultText || key;
}

// Ensure initial run applies settings immediately on script load in browser
if (typeof window !== 'undefined') {
  setTimeout(() => {
    getAppSettings();
  }, 0);
}
