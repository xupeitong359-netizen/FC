import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Palette,
  Languages,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  RotateCcw,
  Check,
  Cpu,
  Trash2,
  Grid,
  X,
  Sparkles,
} from 'lucide-react';
import {
  useAppSettings,
  UiLanguage,
  GeoNamingMode,
  ThemeAccent,
  ContrastMode,
  SimulationFps,
  playTacticalAudio,
  t,
} from '../services/settingsService';

export interface SettingsPanelProps {
  showToast?: (msg: string) => void;
  isInline?: boolean;
  onClose?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  showToast = (msg) => console.log(msg),
  isInline = false,
  onClose,
}) => {
  const { settings, updateSetting, resetSettings } = useAppSettings();

  const [activeTab, setActiveTab] = useState<'interface' | 'language' | 'engine'>('interface');
  const [cacheSizeEstimate, setCacheSizeEstimate] = useState('42 KB');

  // Calculate local storage approximate size
  useEffect(() => {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          total += (localStorage.getItem(key) || '').length;
        }
      }
      const kb = Math.max(1, Math.round(total / 1024));
      setCacheSizeEstimate(`${kb} KB`);
    } catch {
      setCacheSizeEstimate('48 KB');
    }
  }, []);

  // Accent color preset list
  const ACCENT_PRESETS: { hex: ThemeAccent; name: string; note: string }[] = [
    { hex: '#6B50F0', name: '曜石紫', note: '主理旗舰' },
    { hex: '#2563EB', name: '战略蓝', note: '军机推演' },
    { hex: '#059669', name: '卫戍绿', note: '地缘防务' },
    { hex: '#DC2626', name: '铁血红', note: '战役前线' },
    { hex: '#D97706', name: '重工金', note: '营造工业' },
    { hex: '#334155', name: '玄岩黑', note: '极简战术' },
  ];

  // Geopolitical naming modes with authentic desktop list styling
  const GEO_NAMING_OPTIONS: { id: GeoNamingMode; title: string; examples: string }[] = [
    {
      id: 'native_cn',
      title: '汉语习惯通名',
      examples: '柏林、莫斯科、罗马、布达佩斯',
    },
    {
      id: 'endonym',
      title: '历史原生地名',
      examples: 'Berlin、Moskva、Roma、Budapest',
    },
    {
      id: 'bilingual',
      title: '双语对照模式',
      examples: '柏林 (Berlin) / 莫斯科 (Moscow)',
    },
  ];

  // Language options
  const LANGUAGE_OPTIONS: { id: UiLanguage; name: string; tag: string }[] = [
    { id: 'zh-CN', name: '简体中文', tag: '默认标准' },
    { id: 'zh-TW', name: '繁體中文', tag: 'Traditional' },
    { id: 'en-US', name: 'English', tag: 'Grand Strategy' },
    { id: 'de-DE', name: 'Deutsch', tag: 'Klassik HOI' },
  ];

  return (
    <div
      className={`bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col text-slate-800 ${
        isInline ? 'w-full' : 'w-full max-h-[88vh]'
      }`}
    >
      {/* Top Header */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70 shrink-0">
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs transition-colors"
            style={{ backgroundColor: settings.themeAccent }}
          >
            <Sliders className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap">
                {t('settings.modal_title', '系统设置与推演偏好')}
              </h3>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200/80 font-medium">
                SETTINGS & CONFIG
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate hidden sm:block">
              {t('settings.modal_sub', '实时配置沙盘底色、界面语言、地名译名规范与物理推演引擎参数')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Real-time sync badge */}
          <div
            className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider border"
            style={{
              color: settings.themeAccent,
              borderColor: `${settings.themeAccent}33`,
              backgroundColor: `${settings.themeAccent}0d`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: settings.themeAccent }}
            />
            LIVE SYNC
          </div>

          {/* Reset button */}
          <button
            id="settings-reset-btn"
            type="button"
            onClick={() => {
              playTacticalAudio('click');
              resetSettings();
              showToast('已恢复系统设置初始默认值');
            }}
            className="h-7 px-2.5 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="恢复所有选项为默认值"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden xs:inline">{t('settings.reset', '重置默认')}</span>
          </button>

          {/* Modal close button if not inline */}
          {!isInline && onClose && (
            <button
              id="settings-close-x-btn"
              type="button"
              onClick={() => {
                playTacticalAudio('click');
                onClose();
              }}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              title="关闭设置 (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs Strip - 3 Equal Width Columns with Crisp Active Indicator */}
      <div className="p-1.5 bg-slate-100/70 border-b border-slate-200/80 shrink-0">
        <div className="grid grid-cols-3 gap-1 bg-slate-200/60 p-1 rounded-xl">
          {[
            { id: 'interface' as const, label: t('settings.tab_interface', '界面与地图'), icon: Palette },
            { id: 'language' as const, label: t('settings.tab_language', '语言与地名'), icon: Languages },
            { id: 'engine' as const, label: t('settings.tab_engine', '推演与引擎'), icon: Cpu },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`settings-tab-${tab.id}`}
                type="button"
                onClick={() => {
                  playTacticalAudio('click');
                  setActiveTab(tab.id);
                }}
                className={`py-2 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                  isSelected
                    ? 'bg-white font-semibold text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent'
                }`}
                style={isSelected ? { color: settings.themeAccent } : {}}
              >
                <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className={`p-4 sm:p-6 space-y-6 text-slate-700 text-xs ${isInline ? '' : 'overflow-y-auto min-h-0 flex-1'}`}>
        {/* TAB 1: 界面与地图 */}
        {activeTab === 'interface' && (
          <div className="space-y-6">
            {/* 1.1 强调色调选择 */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-slate-400" />
                  <span>系统强调色 (Theme Accent)</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Current: {settings.themeAccent}
                </span>
              </div>

              {/* 2-Column Clean Option Rows */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ACCENT_PRESETS.map((item) => {
                  const isSelected = settings.themeAccent === item.hex;
                  return (
                    <button
                      key={item.hex}
                      id={`accent-btn-${item.hex.replace('#', '')}`}
                      type="button"
                      onClick={() => {
                        playTacticalAudio('toggle');
                        updateSetting('themeAccent', item.hex);
                        showToast(`强调色已实时切换为: ${item.name}`);
                      }}
                      className={`px-3 py-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-white shadow-2xs border-slate-300'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                      style={
                        isSelected
                          ? {
                              borderColor: `${item.hex}60`,
                              backgroundColor: `${item.hex}08`,
                            }
                          : {}
                      }
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-white/60"
                          style={{ backgroundColor: item.hex }}
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 text-xs truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {item.note}
                          </div>
                        </div>
                      </div>
                      {isSelected ? (
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 ml-1"
                          style={{ backgroundColor: item.hex }}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300/80 shrink-0 ml-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1.2 沙盘地图底色主题 */}
            <div className="pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-slate-400" />
                  <span>沙盘地图底色 (Cartographic Theme)</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  当前: {settings.mapTheme === 'white' ? '白纸舆图' : '战备暗夜'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 白纸舆图 */}
                <button
                  id="theme-map-white"
                  type="button"
                  onClick={() => {
                    playTacticalAudio('toggle');
                    updateSetting('mapTheme', 'white');
                    showToast('世界沙盘底图已即时切换为：白纸舆图');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    settings.mapTheme === 'white'
                      ? 'bg-white shadow-2xs border-slate-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                  style={
                    settings.mapTheme === 'white'
                      ? {
                          borderColor: `${settings.themeAccent}50`,
                          backgroundColor: `${settings.themeAccent}06`,
                        }
                      : {}
                  }
                >
                  <div className="flex items-center gap-3 min-w-0 pr-1">
                    <div className="w-8 h-8 rounded-lg border border-slate-200 bg-amber-50/60 flex items-center justify-center shrink-0">
                      <Sun className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 text-xs">
                        白纸舆图（明丽版）
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                        清爽高对比白色陆地，水墨省界与天青海洋
                      </div>
                    </div>
                  </div>
                  {settings.mapTheme === 'white' ? (
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 ml-1.5"
                      style={{ backgroundColor: settings.themeAccent }}
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300/80 shrink-0 ml-1.5" />
                  )}
                </button>

                {/* 战备暗夜 */}
                <button
                  id="theme-map-dark"
                  type="button"
                  onClick={() => {
                    playTacticalAudio('toggle');
                    updateSetting('mapTheme', 'grey');
                    showToast('世界沙盘底图已即时切换为：战备暗夜');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    settings.mapTheme === 'grey'
                      ? 'bg-white shadow-2xs border-slate-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                  style={
                    settings.mapTheme === 'grey'
                      ? {
                          borderColor: `${settings.themeAccent}50`,
                          backgroundColor: `${settings.themeAccent}06`,
                        }
                      : {}
                  }
                >
                  <div className="flex items-center gap-3 min-w-0 pr-1">
                    <div className="w-8 h-8 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center shrink-0">
                      <Moon className="w-4 h-4 text-indigo-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 text-xs">
                        战备暗夜（深色版）
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                        深石板夜间战术底图，微光国界与低照度视效
                      </div>
                    </div>
                  </div>
                  {settings.mapTheme === 'grey' ? (
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 ml-1.5"
                      style={{ backgroundColor: settings.themeAccent }}
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300/80 shrink-0 ml-1.5" />
                  )}
                </button>
              </div>
            </div>

            {/* 1.3 界面对比度 */}
            <div className="pt-5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  界面色彩对比度 (Contrast Mode)
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  增强地缘国界划分、卡片边缘与文字排版的轮廓锐度
                </span>
              </div>

              <div className="flex items-center gap-1.5 p-0.5 bg-slate-100 rounded-lg border border-slate-200/80">
                {[
                  { id: 'standard' as ContrastMode, label: '标准舒适' },
                  { id: 'high' as ContrastMode, label: '高对比度' },
                ].map((mode) => {
                  const isSelected = settings.contrastMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      id={`contrast-mode-${mode.id}`}
                      type="button"
                      onClick={() => {
                        playTacticalAudio('click');
                        updateSetting('contrastMode', mode.id);
                        showToast(`对比度模式已设为: ${mode.label}`);
                      }}
                      className={`px-3 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 语言与地名 */}
        {activeTab === 'language' && (
          <div className="space-y-6">
            {/* 2.1 系统语言 */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-slate-400" />
                  <span>界面主语言 (UI Language)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Active: {settings.uiLanguage}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LANGUAGE_OPTIONS.map((item) => {
                  const isSelected = settings.uiLanguage === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`lang-btn-${item.id}`}
                      type="button"
                      onClick={() => {
                        playTacticalAudio('click');
                        updateSetting('uiLanguage', item.id);
                        showToast(`系统语言已切换至: ${item.name}`);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white shadow-2xs border-slate-300'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                      style={
                        isSelected
                          ? {
                              borderColor: `${settings.themeAccent}60`,
                              backgroundColor: `${settings.themeAccent}08`,
                            }
                          : {}
                      }
                    >
                      <div
                        className="font-semibold text-xs"
                        style={isSelected ? { color: settings.themeAccent } : { color: '#0f172a' }}
                      >
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {item.tag}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2.2 地名注记模式 */}
            <div className="pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-slate-900">
                  地名注记模式 (Geopolitical Naming Format)
                </span>
                <span className="text-[11px] text-slate-400">
                  地图省区、首都与据点翻译规范
                </span>
              </div>

              <div className="space-y-2">
                {GEO_NAMING_OPTIONS.map((item) => {
                  const isSelected = settings.geoNamingMode === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`geo-naming-${item.id}`}
                      type="button"
                      onClick={() => {
                        playTacticalAudio('click');
                        updateSetting('geoNamingMode', item.id);
                        showToast(`地名注记模式已更新为：${item.title}`);
                      }}
                      className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-white shadow-2xs border-slate-300'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                      style={
                        isSelected
                          ? {
                              borderColor: `${settings.themeAccent}50`,
                              backgroundColor: `${settings.themeAccent}06`,
                            }
                          : {}
                      }
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900">
                            {item.title}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          示例：{item.examples}
                        </div>
                      </div>

                      {isSelected ? (
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 ml-1.5"
                          style={{ backgroundColor: settings.themeAccent }}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300/80 shrink-0 ml-1.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2.3 调试地块编号开关 */}
            <div className="pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  大战略地块调试编号 (Debug Province Codes)
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  在地图各省份地块上显示底层唯一代码标识（例如 GER_BER_01），便于定位边界
                </span>
              </div>

              <button
                id="toggle-debug-geo-id"
                type="button"
                onClick={() => {
                  playTacticalAudio('toggle');
                  const next = !settings.showDebugGeoId;
                  updateSetting('showDebugGeoId', next);
                  showToast(next ? '已开启地块调试代码显示' : '已关闭地块调试代码显示');
                }}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  settings.showDebugGeoId ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
                style={settings.showDebugGeoId ? { backgroundColor: settings.themeAccent } : {}}
                aria-label="切换地块调试编号"
              >
                <span
                  className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform duration-150 absolute top-[3px] ${
                    settings.showDebugGeoId ? 'translate-x-[18px]' : 'translate-x-[3px]'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: 推演与引擎 */}
        {activeTab === 'engine' && (
          <div className="space-y-6">
            {/* 3.1 坐标经纬辅助网格 */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                  <Grid className="w-3.5 h-3.5 text-slate-400" />
                  <span>世界沙盘经纬度辅助网格 (Coordinate Grid)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  在矢量大战略地图上绘制坐标参考网格线，辅助大洋航道与战区研判
                </p>
              </div>

              <button
                id="toggle-grid-lines"
                type="button"
                onClick={() => {
                  playTacticalAudio('toggle');
                  const next = !settings.showGridLines;
                  updateSetting('showGridLines', next);
                  showToast(next ? '已开启沙盘经纬辅助网格' : '已关闭沙盘经纬辅助网格');
                }}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  settings.showGridLines ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
                style={settings.showGridLines ? { backgroundColor: settings.themeAccent } : {}}
                aria-label="切换坐标辅助网格"
              >
                <span
                  className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform duration-150 absolute top-[3px] ${
                    settings.showGridLines ? 'translate-x-[18px]' : 'translate-x-[3px]'
                  }`}
                />
              </button>
            </div>

            {/* 3.2 战报音效与战术试听 */}
            <div className="pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                  {settings.soundEffects ? (
                    <Volume2 className="w-3.5 h-3.5 text-slate-600" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>战报与指令视听音效 (Tactical Audio)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  宣战令下达、和约签署及推演调试时的低延迟合成器提示音
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="test-sound-effect-btn"
                  type="button"
                  onClick={() => {
                    playTacticalAudio('test');
                    showToast('已播放战术提示音频');
                  }}
                  className="px-2 py-1 text-xs rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium transition cursor-pointer"
                >
                  试听
                </button>

                <button
                  id="toggle-sound-effects"
                  type="button"
                  onClick={() => {
                    const next = !settings.soundEffects;
                    updateSetting('soundEffects', next);
                    if (next) playTacticalAudio('toggle');
                    showToast(next ? '已开启战术推演音效' : '已静音全部音效');
                  }}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    settings.soundEffects ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                  style={settings.soundEffects ? { backgroundColor: settings.themeAccent } : {}}
                  aria-label="切换战术音效"
                >
                  <span
                    className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform duration-150 absolute top-[3px] ${
                      settings.soundEffects ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 3.3 推演演算刷新率 (FPS) - Sleek Segmented Option Rail */}
            <div className="pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-900">
                  推演演算刷新率 (Engine Tick Rate)
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Target: {settings.simulationFps} FPS
                </span>
              </div>

              {/* Segmented Option Rail */}
              <div className="grid grid-cols-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200/80 gap-1.5">
                {[
                  { id: '60' as SimulationFps, label: '60 FPS', tag: '推荐', sub: '高精度实时演算' },
                  { id: '30' as SimulationFps, label: '30 FPS', tag: '节能', sub: '低功耗平缓推演' },
                ].map((item) => {
                  const isSelected = settings.simulationFps === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`fps-mode-${item.id}`}
                      type="button"
                      onClick={() => {
                        playTacticalAudio('click');
                        updateSetting('simulationFps', item.id);
                        showToast(`推演帧率已设为: ${item.label}`);
                      }}
                      className={`px-3 py-2 rounded-lg text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-white shadow-2xs border border-slate-200/90'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/40 border border-transparent'
                      }`}
                      style={
                        isSelected
                          ? {
                              borderColor: `${settings.themeAccent}40`,
                              backgroundColor: `${settings.themeAccent}06`,
                            }
                          : {}
                      }
                    >
                      <div className="min-w-0 pr-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="font-mono text-xs font-bold tracking-tight"
                            style={isSelected ? { color: settings.themeAccent } : { color: '#0f172a' }}
                          >
                            {item.label}
                          </span>
                          <span
                            className={`text-[10px] px-1 py-0.2 rounded font-mono font-medium ${
                              isSelected
                                ? 'bg-slate-100 text-slate-700'
                                : 'text-slate-400 bg-slate-200/60'
                            }`}
                          >
                            {item.tag}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {item.sub}
                        </div>
                      </div>
                      {isSelected ? (
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 ml-1.5"
                          style={{ backgroundColor: settings.themeAccent }}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300/80 shrink-0 ml-1.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3.4 本地草稿与缓存管理 */}
            <div className="pt-5 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/60 p-3 rounded-xl border border-slate-200/60">
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  本地推演草稿与调试缓存
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  占用估算: {cacheSizeEstimate} · 清除临时草稿不影响已发布的势力及数据
                </span>
              </div>

              <button
                id="clear-debug-cache-btn"
                type="button"
                onClick={() => {
                  playTacticalAudio('alert');
                  try {
                    localStorage.removeItem('virtual_world_draft_state');
                    localStorage.removeItem('virtual_world_recent_events_cache');
                  } catch {}
                  setCacheSizeEstimate('36 KB');
                  showToast('已清理本地临时推演调试缓存');
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs text-rose-700 hover:bg-rose-100 bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>清除缓存</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal bottom action if not inline */}
      {!isInline && onClose && (
        <div className="px-4 sm:px-6 py-2.5 border-t border-slate-200/80 bg-slate-50/80 flex items-center justify-end shrink-0">
          <button
            id="settings-done-btn"
            type="button"
            onClick={() => {
              playTacticalAudio('success');
              showToast('推演配置已确认并生效');
              onClose();
            }}
            className="px-5 py-1.5 rounded-lg text-white text-xs font-semibold shadow-2xs hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
            style={{ backgroundColor: settings.themeAccent }}
          >
            {t('settings.close', '完成')}
          </button>
        </div>
      )}
    </div>
  );
};
