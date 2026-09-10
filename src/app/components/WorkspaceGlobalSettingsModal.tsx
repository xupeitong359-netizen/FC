import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Settings,
  Type,
  Palette,
  MapPin,
  Sliders,
  Check,
  RotateCcw,
  Search,
  Building2,
  Users,
  Factory,
  Layers,
  ChevronRight,
  Shield,
  Eye,
  CheckCircle2,
  Sparkles,
  Map as MapIcon,
  HelpCircle,
  Flag,
} from 'lucide-react';
import { Nation, ProvinceData, ProvinceStrategicResources } from '../types';
import {
  workspaceService,
  WorkspaceItem,
  WorkspaceGlobalSettings,
  CustomProvinceOverride,
} from '../services/workspaceService';
import { NATION_FONT_OPTIONS, NationFontOption, getNationFontOption } from '../lib/nationFonts';
import { NationFontSelector } from './NationFontSelector';
import { IntentColorPicker } from './IntentColorPicker';
import { TerritoryColorPicker } from './TerritoryColorPicker';
import { NationFlagDisplay, getAspectRatioCSS } from './NationFlagDisplay';
import { getProvinceChineseName } from '../lib/provinceTranslations';
import { ProvinceTerrainType, TERRAIN_DEFINITIONS } from '../lib/terrainEngine';
import { STRATEGIC_RESOURCES, StrategicResourceType } from '../lib/strategicCommandEngine';
import mapGeoData from '../assets/hoi4_fixed_map.json';

export interface WorkspaceGlobalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: WorkspaceItem;
  nations: Nation[];
  onUpdateNations: (updatedNations: Nation[]) => void;
  onUpdateWorkspace: (updates: Partial<WorkspaceItem>) => void;
  onLocateProvince?: (provinceId: string | number, provinceName: string) => void;
  showToast?: (message: string) => void;
}

// 经典地缘陆地底色推荐（中立领土地块底色）
const PRESET_NEUTRAL_LAND_COLORS = [
  { id: 'natural_grass', name: '经典北欧草木', color: '#DCECCF', desc: '自然温和，标准战备沙盘陆地' },
  { id: 'tactical_slate', name: '战术冷灰', color: '#CBD5E1', desc: '清爽冷冽，现代参谋战术用色' },
  { id: 'dark_obsidian', name: '黑曜夜幕', color: '#141C2B', desc: '深色暗夜沙盘高对比中立地' },
  { id: 'desert_sand', name: '大地荒原', color: '#E2D9C8', desc: '复古泛黄羊皮纸历史厚重感' },
  { id: 'arctic_frost', name: '极地冷岩', color: '#E0F2FE', desc: '冰霜清亮高透光海陆分界' },
  { id: 'muted_olive', name: '军武橄榄', color: '#D5DFD3', desc: '低饱和度战役推演专业色系' },
];

// 经典海洋水体底色推荐
const PRESET_OCEAN_COLORS = [
  { id: 'nordic_cyan', name: '北欧天青', color: '#E3EDF6', desc: '透亮天水蓝，海陆轮廓分明' },
  { id: 'deep_tactical', name: '战术深海', color: '#090E17', desc: '暗夜深邃黑蓝，现代雷达感' },
  { id: 'sepia_water', name: '复古暖水', color: '#EFEBE9', desc: '旧地图手绘水域典雅复古' },
  { id: 'steel_blue', name: '冷钢暗灰', color: '#1E293B', desc: '深石板冷灰，大洋战略推演' },
];

// 国界线推荐
const PRESET_BORDER_COLORS = [
  { id: 'classic_dark', name: '坚实深墨', color: '#53645A', desc: '深实清晰分明的主权国界' },
  { id: 'pure_silver', name: '醒目白银', color: '#FFFFFF', desc: '高亮反差，暗色或彩色领土分界' },
  { id: 'slate_edge', name: '暗曜黑界', color: '#1E293B', desc: '厚重深邃，庄严划界' },
];

const ALL_TERRAINS: { type: ProvinceTerrainType; label: string; icon: string }[] = [
  { type: 'plains', label: '平原', icon: '🌾' },
  { type: 'hills', label: '丘陵', icon: '⛰️' },
  { type: 'mountain', label: '山地', icon: '🏔️' },
  { type: 'forest', label: '森林', icon: '🌲' },
  { type: 'desert', label: '沙漠', icon: '🏜️' },
  { type: 'marsh', label: '沼泽', icon: '🌿' },
  { type: 'urban', label: '城市', icon: '🏙️' },
];

// 提取全图省份原始元数据
interface RawProvinceItem {
  id: string | number;
  rawName: string;
  cnName: string;
  defaultManpower: number;
}

const ALL_RAW_PROVINCES: RawProvinceItem[] = (() => {
  try {
    const list = (mapGeoData as any).features || [];
    return list.map((f: any) => {
      const props = f.properties || {};
      const id = props.stateId ?? props.id ?? 0;
      const rawName = String(props.name || `Province_${id}`);
      const cnName = getProvinceChineseName(rawName || id);
      const defaultManpower = Number(props.manpower || 1200000);
      return { id, rawName, cnName, defaultManpower };
    });
  } catch (e) {
    console.error('Failed to parse mapGeoData', e);
    return [];
  }
})();

export const WorkspaceGlobalSettingsModal: React.FC<WorkspaceGlobalSettingsModalProps> = ({
  isOpen,
  onClose,
  workspace,
  nations,
  onUpdateNations,
  onUpdateWorkspace,
  onLocateProvince,
  showToast = (_msg: string) => {},
}) => {
  // 当前激活的 Tab
  const [activeTab, setActiveTab] = useState<'typography' | 'territory_colors' | 'provinces' | 'display'>('typography');

  // 当前全局设置状态 (由 workspace.globalSettings 读取)
  const currentGlobalSettings = useMemo<WorkspaceGlobalSettings>(() => {
    return workspace.globalSettings || {
      nationFontFamily: 'condensed',
      neutralTerritoryColor: '#DCECCF',
      oceanColor: '#E3EDF6',
      borderStrokeColor: '#53645A',
      showProvinceLabels: false,
      showNationLabels: true,
      mapTheme: 'white',
      nationFontScale: 1.0,
    };
  }, [workspace.globalSettings]);

  // 更新全局设置方法
  const handleUpdateSettings = useCallback((updates: Partial<WorkspaceGlobalSettings>) => {
    const next = workspaceService.updateGlobalSettings(workspace.id, updates);
    onUpdateWorkspace({ globalSettings: next });
    showToast('全局设置已更新并实时生效');
  }, [workspace.id, onUpdateWorkspace, showToast]);

  // 一键将全局字体应用到全图所有国家
  const handleApplyFontToAllNations = useCallback((fontId: string) => {
    const updated = nations.map((n) => ({
      ...n,
      nameFont: fontId,
    }));
    onUpdateNations(updated);
    handleUpdateSettings({ nationFontFamily: fontId });
    showToast(`已成功将【${getNationFontOption(fontId).name}】批量应用至全部 ${nations.length} 个国家！`);
  }, [nations, onUpdateNations, handleUpdateSettings, showToast]);

  // 单独更新某国家的字体
  const handleUpdateSingleNationFont = useCallback((nationId: string, fontId: string) => {
    const updated = nations.map((n) => (n.id === nationId ? { ...n, nameFont: fontId } : n));
    onUpdateNations(updated);
    showToast('国家字体已更新');
  }, [nations, onUpdateNations, showToast]);

  // 单独更新某国家代表色（领土地块颜色）
  const handleUpdateSingleNationColor = useCallback((nationId: string, newColor: string) => {
    const target = nations.find((n) => n.id === nationId);
    const updated = nations.map((n) => (n.id === nationId ? { ...n, flagColor: newColor } : n));
    onUpdateNations(updated);
    showToast(`已更新【${target?.name || '国家'}】的疆域地块代表色`);
  }, [nations, onUpdateNations, showToast]);

  // ========= 省份管理状态与逻辑 =========
  const [provinceSearchQuery, setProvinceSearchQuery] = useState('');
  const [provinceFilter, setProvinceFilter] = useState<'all' | 'assigned' | 'neutral' | 'modified'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 16;

  // 正在编辑的省份
  const [editingProvinceId, setEditingProvinceId] = useState<string | number | null>(null);

  // 省份临时编辑表单
  const [editFormName, setEditFormName] = useState('');
  const [editFormOwnerId, setEditFormOwnerId] = useState<string>('');
  const [editFormColor, setEditFormColor] = useState<string>('');
  const [editFormUseCustomColor, setEditFormUseCustomColor] = useState(false);
  const [editFormManpower, setEditFormManpower] = useState(1500000);
  const [editFormCivFactories, setEditFormCivFactories] = useState(1);
  const [editFormMilFactories, setEditFormMilFactories] = useState(0);
  const [editFormTerrain, setEditFormTerrain] = useState<ProvinceTerrainType>('plains');
  const [editFormIsCore, setEditFormIsCore] = useState(true);
  const [editFormResources, setEditFormResources] = useState<ProvinceStrategicResources>({
    oil: 0,
    steel: 0,
    aluminium: 0,
    rubber: 0,
    tungsten: 0,
    chromium: 0,
  });

  // 查找省份所属国家映射
  const provinceOwnerMap = useMemo(() => {
    const map = new Map<string, { nation: Nation; provinceRecord: ProvinceData }>();
    nations.forEach((nation) => {
      nation.provinces?.forEach((p) => {
        map.set(String(p.id), { nation, provinceRecord: p });
        if (p.name) map.set(p.name.trim().toLowerCase(), { nation, provinceRecord: p });
      });
    });
    return map;
  }, [nations]);

  // 打开某个省份进行行内编辑
  const handleOpenEditProvince = (item: RawProvinceItem) => {
    const ownerInfo = provinceOwnerMap.get(String(item.id)) || provinceOwnerMap.get(item.rawName.toLowerCase());
    const override = workspace.provinceOverrides?.[String(item.id)];
    const pRecord = ownerInfo?.provinceRecord;

    setEditingProvinceId(item.id);
    setEditFormName(override?.name || pRecord?.customName || pRecord?.name || item.cnName || item.rawName);
    setEditFormOwnerId(ownerInfo?.nation.id || '');
    setEditFormColor(override?.colorHex || pRecord?.colorHex || ownerInfo?.nation.flagColor || '#3B82F6');
    setEditFormUseCustomColor(Boolean(override?.colorHex || pRecord?.colorHex));
    setEditFormManpower(override?.manpower ?? pRecord?.manpower ?? item.defaultManpower);
    setEditFormCivFactories(override?.civilianFactories ?? pRecord?.civilianFactories ?? 1);
    setEditFormMilFactories(override?.militaryFactories ?? pRecord?.militaryFactories ?? 0);
    setEditFormTerrain((override?.terrainType || pRecord?.terrain || 'plains') as ProvinceTerrainType);
    setEditFormIsCore(override?.isCore ?? pRecord?.isCore ?? true);
    setEditFormResources(
      override?.resources ||
        pRecord?.resources || {
          oil: 0,
          steel: 0,
          aluminium: 0,
          rubber: 0,
          tungsten: 0,
          chromium: 0,
        }
    );
  };

  // 保存省份编辑
  const handleSaveProvinceEdit = () => {
    if (!editingProvinceId) return;
    const pid = editingProvinceId;
    const rawMatch = ALL_RAW_PROVINCES.find((p) => String(p.id) === String(pid));
    const rawName = rawMatch?.rawName || `Province_${pid}`;

    const overridePayload: Partial<CustomProvinceOverride> = {
      id: pid,
      name: editFormName.trim() || rawMatch?.cnName || rawName,
      colorHex: editFormUseCustomColor ? editFormColor : undefined,
      manpower: editFormManpower,
      civilianFactories: editFormCivFactories,
      militaryFactories: editFormMilFactories,
      isCore: editFormIsCore,
      ownerNationId: editFormOwnerId || undefined,
      terrainType: editFormTerrain,
      resources: editFormResources,
    };

    // 保存到 workspaceService.provinceOverrides
    workspaceService.setProvinceOverride(workspace.id, pid, overridePayload);

    // 同步到 nations.provinces
    const updatedNations = nations.map((nation) => {
      const belongsToThis = nation.id === editFormOwnerId;
      const isAlreadyInThis = nation.provinces?.some(
        (p) => String(p.id) === String(pid) || p.name.trim().toLowerCase() === rawName.toLowerCase()
      );

      if (belongsToThis) {
        const provinceRecord: ProvinceData = {
          id: pid,
          name: rawName,
          customName: editFormName.trim() || rawMatch?.cnName || rawName,
          colorHex: editFormUseCustomColor ? editFormColor : undefined,
          population: editFormManpower,
          manpower: editFormManpower,
          civilianFactories: editFormCivFactories,
          militaryFactories: editFormMilFactories,
          terrain: editFormTerrain,
          isCore: editFormIsCore,
          resources: editFormResources,
        };

        const nextProvinces = isAlreadyInThis
          ? (nation.provinces || []).map((p) =>
              String(p.id) === String(pid) || p.name.trim().toLowerCase() === rawName.toLowerCase()
                ? provinceRecord
                : p
            )
          : [...(nation.provinces || []), provinceRecord];

        return {
          ...nation,
          provinces: nextProvinces,
          totalPopulation: nextProvinces.reduce((sum, p) => sum + (p.population || 1200000), 0),
        };
      } else {
        // 从其他国家剥离该省份
        if (isAlreadyInThis) {
          const nextProvinces = (nation.provinces || []).filter(
            (p) => !(String(p.id) === String(pid) || p.name.trim().toLowerCase() === rawName.toLowerCase())
          );
          return {
            ...nation,
            provinces: nextProvinces,
            totalPopulation: nextProvinces.reduce((sum, p) => sum + (p.population || 1200000), 0),
          };
        }
        return nation;
      }
    });

    onUpdateNations(updatedNations);
    setEditingProvinceId(null);
    showToast(`省份【${editFormName || rawMatch?.cnName}】数据已更新并同步至大地图`);
  };

  // 重置指定省份数据
  const handleResetProvince = (pid: string | number) => {
    workspaceService.resetProvinceOverride(workspace.id, pid);
    const rawMatch = ALL_RAW_PROVINCES.find((p) => String(p.id) === String(pid));
    const rawName = rawMatch?.rawName || `Province_${pid}`;

    const updatedNations = nations.map((nation) => {
      const nextProvinces = (nation.provinces || []).map((p) => {
        if (String(p.id) === String(pid) || p.name.trim().toLowerCase() === rawName.toLowerCase()) {
          return {
            ...p,
            customName: undefined,
            colorHex: undefined,
          };
        }
        return p;
      });
      return { ...nation, provinces: nextProvinces };
    });

    onUpdateNations(updatedNations);
    showToast(`已重置省份 #${pid} 的自定义数据`);
  };

  // 过滤后的省份列表
  const filteredProvinces = useMemo(() => {
    let list = ALL_RAW_PROVINCES;

    if (provinceFilter === 'assigned') {
      list = list.filter((p) => provinceOwnerMap.has(String(p.id)) || provinceOwnerMap.has(p.rawName.toLowerCase()));
    } else if (provinceFilter === 'neutral') {
      list = list.filter((p) => !provinceOwnerMap.has(String(p.id)) && !provinceOwnerMap.has(p.rawName.toLowerCase()));
    } else if (provinceFilter === 'modified') {
      const overrides = workspace.provinceOverrides || {};
      list = list.filter((p) => Boolean(overrides[String(p.id)]));
    }

    if (provinceSearchQuery.trim()) {
      const q = provinceSearchQuery.trim().toLowerCase();
      list = list.filter((p) => {
        const idStr = String(p.id);
        const raw = p.rawName.toLowerCase();
        const cn = p.cnName.toLowerCase();
        const custom = workspace.provinceOverrides?.[String(p.id)]?.name?.toLowerCase() || '';
        return idStr.includes(q) || raw.includes(q) || cn.includes(q) || custom.includes(q);
      });
    }

    return list;
  }, [provinceFilter, provinceSearchQuery, provinceOwnerMap, workspace.provinceOverrides]);

  // 当前分页列表
  const paginatedProvinces = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProvinces.slice(start, start + pageSize);
  }, [filteredProvinces, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredProvinces.length / pageSize));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2.5 sm:p-5 bg-slate-950/75 backdrop-blur-xs select-none font-sans text-slate-800">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: 'spring', damping: 28, stiffness: 360 }}
        className="w-full max-w-4xl h-[92vh] max-h-[780px] bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* 顶部标题栏 */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#6C4FF6]/10 border border-[#6C4FF6]/20 flex items-center justify-center text-[#6C4FF6] shrink-0">
              <Settings className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 whitespace-nowrap">全局设置</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#6C4FF6]/10 text-[#6C4FF6] font-semibold shrink-0 whitespace-nowrap">
                  创作者
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate hidden sm:block">
                统一配置国家标绘字体、地块底图配色与全图 1048 个省份数据
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer shrink-0"
            title="关闭设置"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* 核心 Tab 导航栏 */}
        <div className="px-3 sm:px-6 border-b border-slate-100 flex items-center gap-1 sm:gap-2 shrink-0 bg-white overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('typography')}
            className={`py-2.5 px-3 border-b-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'typography'
                ? 'border-[#6C4FF6] text-[#6C4FF6]'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>字体设置</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('territory_colors')}
            className={`py-2.5 px-3 border-b-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'territory_colors'
                ? 'border-[#6C4FF6] text-[#6C4FF6]'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>地图配色</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('provinces')}
            className={`py-2.5 px-3 border-b-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'provinces'
                ? 'border-[#6C4FF6] text-[#6C4FF6]'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>省份数据</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-500 text-[10px] font-mono">
              1048
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('display')}
            className={`py-2.5 px-3 border-b-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'display'
                ? 'border-[#6C4FF6] text-[#6C4FF6]'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>沙盘标绘</span>
          </button>
        </div>

        {/* Tab 内容区 */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 custom-scrollbar bg-slate-50/50">
          {/* ===================== 1. 国家字体全局设置 ===================== */}
          {activeTab === 'typography' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              {/* 全局字体规范选择 */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 whitespace-nowrap">
                      <Type className="w-3.5 h-3.5 text-[#6C4FF6]" />
                      <span>国家名称标绘字体</span>
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyFontToAllNations(currentGlobalSettings.nationFontFamily || 'condensed')}
                    className="h-8 px-2.5 sm:px-3 rounded-xl bg-[#6C4FF6]/10 hover:bg-[#6C4FF6]/20 text-[#6C4FF6] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>应用到全部国家 ({nations.length})</span>
                  </button>
                </div>

                {/* 字体网格选择器 */}
                <NationFontSelector
                  value={currentGlobalSettings.nationFontFamily || 'condensed'}
                  onChange={(fontId) => handleUpdateSettings({ nationFontFamily: fontId })}
                  hideHeader={true}
                />
              </div>

              {/* 国家独立字体精细化微调 */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 whitespace-nowrap">
                    <Flag className="w-3.5 h-3.5 text-[#6C4FF6]" />
                    <span>国家专属字体微调</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                    为特殊文明政权赋予专属历史风格字体
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                  {nations.map((nation) => {
                    const nationFont = nation.nameFont || currentGlobalSettings.nationFontFamily || 'condensed';
                    const fontOpt = getNationFontOption(nationFont);

                    return (
                      <div
                        key={nation.id}
                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            style={{ aspectRatio: getAspectRatioCSS(nation.flagRatio) }}
                            className="h-6 max-w-10 rounded-xs overflow-hidden border border-slate-200 shrink-0 shadow-2xs flex items-center justify-center bg-slate-100"
                          >
                            <NationFlagDisplay
                              flagUrl={nation.flagUrl}
                              flagColor={nation.flagColor}
                              name={nation.name}
                              ratio={nation.flagRatio}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 truncate block">
                              {nation.name}
                            </span>
                            <span
                              className="text-[11px] text-slate-500 font-bold block truncate"
                              style={{ fontFamily: fontOpt.fontFamily }}
                            >
                              {nation.name} · {fontOpt.name}
                            </span>
                          </div>
                        </div>

                        {/* 字体下拉微调 */}
                        <select
                          value={nationFont}
                          onChange={(e) => handleUpdateSingleNationFont(nation.id, e.target.value)}
                          className="h-7 px-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-[#6C4FF6] cursor-pointer"
                        >
                          {NATION_FONT_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ===================== 2. 地块与底图配色 ===================== */}
          {activeTab === 'territory_colors' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              {/* 未占领中立地块底色配置 */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MapIcon className="w-3.5 h-3.5 text-[#6C4FF6]" />
                    <span>未勘定中立地块底色</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    沙盘上尚未被任何国家划拨占领的自然地块颜色
                  </p>
                </div>

                {/* 经典推荐色板快速选择 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_NEUTRAL_LAND_COLORS.map((preset) => {
                    const isSelected =
                      (currentGlobalSettings.neutralTerritoryColor || '#DCECCF').toLowerCase() ===
                      preset.color.toLowerCase();

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleUpdateSettings({ neutralTerritoryColor: preset.color })}
                        className={`p-2 sm:p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'border-[#6C4FF6] bg-[#6C4FF6]/5 ring-1 ring-[#6C4FF6]/30 shadow-2xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                        }`}
                      >
                        <span
                          className="w-4.5 h-4.5 rounded-md border border-black/10 shrink-0 shadow-2xs"
                          style={{ backgroundColor: preset.color }}
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 truncate block">
                            {preset.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {preset.color}
                          </span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#6C4FF6] ml-auto shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* 自定义精确色彩选择 */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-700 block mb-2">
                    自定义色值
                  </span>
                  <IntentColorPicker
                    color={currentGlobalSettings.neutralTerritoryColor || '#DCECCF'}
                    onChange={(newHex) => handleUpdateSettings({ neutralTerritoryColor: newHex })}
                    onReset={() => handleUpdateSettings({ neutralTerritoryColor: '#DCECCF' })}
                  />
                </div>
              </div>

              {/* 海洋与边界线条配色 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 海洋颜色 */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span>海洋水域底色</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_OCEAN_COLORS.map((p) => {
                      const isSel = (currentGlobalSettings.oceanColor || '#E3EDF6').toLowerCase() === p.color.toLowerCase();
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleUpdateSettings({ oceanColor: p.color })}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition ${
                            isSel ? 'border-[#6C4FF6] bg-[#6C4FF6]/5 ring-1 ring-[#6C4FF6]/25 font-bold' : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="w-3.5 h-3.5 rounded-md border border-black/10 shrink-0" style={{ backgroundColor: p.color }} />
                          <span className="text-xs font-medium text-slate-800 truncate">{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 国界线颜色 */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                    <span>国界与省界线条</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_BORDER_COLORS.map((p) => {
                      const isSel = (currentGlobalSettings.borderStrokeColor || '#53645A').toLowerCase() === p.color.toLowerCase();
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleUpdateSettings({ borderStrokeColor: p.color })}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition ${
                            isSel ? 'border-[#6C4FF6] bg-[#6C4FF6]/5 ring-1 ring-[#6C4FF6]/25 font-bold' : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="w-3.5 h-3.5 rounded-md border border-black/10 shrink-0" style={{ backgroundColor: p.color }} />
                          <span className="text-xs font-medium text-slate-800 truncate">{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 全图国家领土地块颜色批量修改 */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 whitespace-nowrap">
                    <Palette className="w-3.5 h-3.5 text-[#6C4FF6]" />
                    <span>国家疆域地块颜色统一调配</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                    直接修改国家代表色，地图对应地块即刻同步
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                  {nations.map((nation) => {
                    const provCount = nation.provinces?.length || 0;

                    return (
                      <div
                        key={nation.id}
                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            style={{ aspectRatio: getAspectRatioCSS(nation.flagRatio) }}
                            className="h-5 max-w-8 rounded-xs overflow-hidden border border-slate-200 shrink-0 shadow-2xs flex items-center justify-center bg-slate-100"
                          >
                            <NationFlagDisplay
                              flagUrl={nation.flagUrl}
                              flagColor={nation.flagColor}
                              name={nation.name}
                              ratio={nation.flagRatio}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 truncate block">
                              {nation.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {provCount} 个省份
                            </span>
                          </div>
                        </div>

                        {/* 专属 TerritoryColorPicker */}
                        <TerritoryColorPicker
                          color={nation.flagColor || '#3B82F6'}
                          nationName={nation.name}
                          onChange={(newColor) => handleUpdateSingleNationColor(nation.id, newColor)}
                          variant="compact"
                          placement="bottom-end"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ===================== 3. 省份数据与名称管理 ===================== */}
          {activeTab === 'provinces' && (
            <div className="space-y-3.5 max-w-5xl mx-auto">
              {/* 搜索与过滤工具栏 */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-2">
                {/* 搜索框 */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={provinceSearchQuery}
                    onChange={(e) => {
                      setProvinceSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="输入省份 ID、中文名检索 (如: 843, 北京)..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#6C4FF6]"
                  />
                  {provinceSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setProvinceSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 过滤胶囊 */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-xs font-semibold overflow-x-auto no-scrollbar shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setProvinceFilter('all');
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 ${
                      provinceFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    全部 ({ALL_RAW_PROVINCES.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProvinceFilter('assigned');
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 ${
                      provinceFilter === 'assigned' ? 'bg-white text-[#6C4FF6] shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    已建国
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProvinceFilter('neutral');
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 ${
                      provinceFilter === 'neutral' ? 'bg-white text-emerald-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    中立未定
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProvinceFilter('modified');
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 ${
                      provinceFilter === 'modified' ? 'bg-white text-amber-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    已自定义
                  </button>
                </div>
              </div>

              {/* 省份列表条目 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {paginatedProvinces.map((prov) => {
                  const ownerInfo = provinceOwnerMap.get(String(prov.id)) || provinceOwnerMap.get(prov.rawName.toLowerCase());
                  const override = workspace.provinceOverrides?.[String(prov.id)];
                  const pRecord = ownerInfo?.provinceRecord;

                  const displayName = override?.name || pRecord?.customName || prov.cnName || prov.rawName;
                  const isModified = Boolean(override);
                  const effectiveColor = override?.colorHex || pRecord?.colorHex || ownerInfo?.nation.flagColor || '#94A3B8';
                  const manpower = override?.manpower ?? pRecord?.manpower ?? prov.defaultManpower;
                  const civs = override?.civilianFactories ?? pRecord?.civilianFactories ?? 1;
                  const mils = override?.militaryFactories ?? pRecord?.militaryFactories ?? 0;

                  return (
                    <div
                      key={prov.id}
                      className={`p-3 rounded-2xl border transition bg-white flex flex-col justify-between gap-2 shadow-2xs hover:shadow-xs ${
                        isModified ? 'border-amber-300 ring-1 ring-amber-200/50' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-4 h-4 rounded-full shrink-0 border border-black/10 shadow-2xs"
                            style={{ backgroundColor: effectiveColor }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {displayName}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                                #{prov.id}
                              </span>
                              {isModified && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
                                  自定义
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 truncate block">
                              原名: {prov.rawName}
                            </span>
                          </div>
                        </div>

                        {/* 所属国徽章 */}
                        {ownerInfo ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.8 rounded-lg bg-slate-50 border border-slate-200 shrink-0">
                            <span className="text-[10px] font-bold text-slate-700">
                              {ownerInfo.nation.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] px-2 py-0.8 rounded-lg bg-emerald-50 text-emerald-700 font-medium shrink-0">
                            中立地块
                          </span>
                        )}
                      </div>

                      {/* 属性微统计条 */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100 flex-wrap gap-1">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            <span>{(manpower / 10000).toFixed(0)}万</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Factory className="w-3 h-3 text-slate-400" />
                            <span>民{civs} / 军{mils}</span>
                          </span>
                        </div>

                        {/* 操作按钮组 */}
                        <div className="flex items-center gap-1.5">
                          {onLocateProvince && (
                            <button
                              type="button"
                              onClick={() => onLocateProvince(prov.id, prov.rawName)}
                              className="px-2 py-0.8 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition cursor-pointer"
                              title="在地图上高亮此省份"
                            >
                              定位
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditProvince(prov)}
                            className="px-2.5 py-0.8 rounded-md bg-[#6C4FF6] hover:bg-[#5B3EE4] text-white text-[10px] font-bold transition cursor-pointer shadow-2xs"
                          >
                            编辑数据与名称
                          </button>

                          {isModified && (
                            <button
                              type="button"
                              onClick={() => handleResetProvince(prov.id)}
                              className="p-1 rounded-md hover:bg-rose-50 text-rose-500 transition cursor-pointer"
                              title="恢复默认省份数据"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 分页控制栏 */}
              <div className="flex items-center justify-between px-2 py-2 text-xs text-slate-500">
                <span>
                  共找到 {filteredProvinces.length} 个省份 (第 {currentPage} / {totalPages} 页)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer font-medium"
                  >
                    上一页
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer font-medium"
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================== 4. 沙盘演示与标注开关 ===================== */}
          {activeTab === 'display' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#6C4FF6]" />
                  <span>沙盘标注与视图呈现配置</span>
                </h3>

                <div className="space-y-3">
                  {/* 国家名称大字标绘 */}
                  <label className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        显示国家大战略主权大字标绘
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        基于国土纵深与骨干曲线，随缩放动态微调大战略主权名称
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentGlobalSettings.showNationLabels !== false}
                      onChange={(e) => handleUpdateSettings({ showNationLabels: e.target.checked })}
                      className="w-4 h-4 text-[#6C4FF6] rounded accent-[#6C4FF6] cursor-pointer"
                    />
                  </label>

                  {/* 全图省份名称标绘 */}
                  <label className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        显示全图各省份名称标绘
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        在每个地块质心处标绘省份中文名或自定义命名（建议放大推演时开启）
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(currentGlobalSettings.showProvinceLabels)}
                      onChange={(e) => handleUpdateSettings({ showProvinceLabels: e.target.checked })}
                      className="w-4 h-4 text-[#6C4FF6] rounded accent-[#6C4FF6] cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* 剧本元信息概览 */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#6C4FF6]" />
                  <span>剧本工坊环境信息</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-400 block">当前剧本</span>
                    <strong className="text-sm font-bold text-slate-900 truncate block mt-0.5">
                      {workspace.name}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-400 block">推演纪元</span>
                    <strong className="text-sm font-bold text-slate-900 truncate block mt-0.5">
                      {workspace.era}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-400 block">已确立国家</span>
                    <strong className="text-sm font-bold text-[#6C4FF6] block mt-0.5">
                      {nations.length} 国
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-400 block">自定义省份</span>
                    <strong className="text-sm font-bold text-amber-600 block mt-0.5">
                      {Object.keys(workspace.provinceOverrides || {}).length} 个
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部保存与完成操作栏 */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
          <div className="flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span className="truncate">设置已实时保存至沙盘剧本</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8.5 px-5 rounded-xl bg-[#6C4FF6] hover:bg-[#5B3EE4] text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-98 whitespace-nowrap shrink-0"
          >
            完成
          </button>
        </div>
      </motion.div>

      {/* ===================== 行内省份数据完整编辑弹层 ===================== */}
      <AnimatePresence>
        {editingProvinceId && (
          <div
            className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setEditingProvinceId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-5 text-slate-800 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#6C4FF6]/10 text-[#6C4FF6] flex items-center justify-center">
                    <MapPin className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      编辑省份地块数据 · #{editingProvinceId}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      更改省份中文名、独立地块颜色、所属政权、人口与产能
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProvinceId(null)}
                  className="w-7 h-7 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* 表单字段 */}
              <div className="space-y-3.5">
                {/* 1. 省份自定义名称 */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    省份名称
                  </label>
                  <input
                    type="text"
                    value={editFormName}
                    onChange={(e) => setEditFormName(e.target.value)}
                    placeholder="输入自定义省份名称..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium outline-none focus:border-[#6C4FF6]"
                  />
                </div>

                {/* 2. 所属国家划拨 */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    所属主权国家
                  </label>
                  <select
                    value={editFormOwnerId}
                    onChange={(e) => setEditFormOwnerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium outline-none focus:border-[#6C4FF6] cursor-pointer"
                  >
                    <option value="">-- 设为中立待勘定地块 (无所属国) --</option>
                    {nations.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name} ({n.provinces?.length || 0} 省份)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. 独立地块颜色定制 */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      独立地块自选颜色
                    </span>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editFormUseCustomColor}
                        onChange={(e) => setEditFormUseCustomColor(e.target.checked)}
                        className="rounded text-[#6C4FF6] accent-[#6C4FF6]"
                      />
                      <span>启用独立色</span>
                    </label>
                  </div>

                  {editFormUseCustomColor && (
                    <div className="pt-2 border-t border-slate-200/80">
                      <IntentColorPicker
                        color={editFormColor}
                        onChange={(hex) => setEditFormColor(hex)}
                      />
                    </div>
                  )}
                </div>

                {/* 4. 人口数量 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      人口与人力
                    </label>
                    <span className="text-xs text-[#6C4FF6] font-mono font-bold">
                      {(editFormManpower / 10000).toFixed(0)} 万人
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100000"
                    max="15000000"
                    step="100000"
                    value={editFormManpower}
                    onChange={(e) => setEditFormManpower(Number(e.target.value))}
                    className="w-full accent-[#6C4FF6] cursor-pointer"
                  />
                </div>

                {/* 5. 工厂工业产能 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      民用工厂 (0-15)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={editFormCivFactories}
                      onChange={(e) => setEditFormCivFactories(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-medium outline-none focus:border-[#6C4FF6]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      军用工厂 (0-15)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={editFormMilFactories}
                      onChange={(e) => setEditFormMilFactories(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-medium outline-none focus:border-[#6C4FF6]"
                    />
                  </div>
                </div>

                {/* 6. 地形属性 */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    地貌与地形
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {ALL_TERRAINS.map((t) => (
                      <button
                        key={t.type}
                        type="button"
                        onClick={() => setEditFormTerrain(t.type)}
                        className={`py-1 px-2 rounded-lg border text-xs font-medium transition flex items-center justify-center gap-1 cursor-pointer ${
                          editFormTerrain === t.type
                            ? 'border-[#6C4FF6] bg-[#F0ECFF] text-[#6C4FF6] font-bold'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 弹窗底部操作 */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProvinceId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveProvinceEdit}
                  className="px-5 py-2 rounded-xl bg-[#6C4FF6] hover:bg-[#5B3EE4] text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-98"
                >
                  保存并应用省份数据
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
