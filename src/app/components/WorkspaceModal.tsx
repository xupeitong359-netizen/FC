import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Globe2,
  Flag,
  RotateCcw,
  Download,
  Maximize2,
  Minimize2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  BoxSelect,
  MousePointer,
  Landmark,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Check,
  ZoomIn,
  ZoomOut,
  MapPin,
  Compass,
  SlidersHorizontal,
  MoreHorizontal,
  MoreVertical,
  Pencil,
  Settings,
  Users,
  Shield,
  TrendingUp,
  Building2,
  Crosshair,
  ExternalLink,
  Activity,
  ArrowRight,
  Trophy,
  Award,
} from 'lucide-react';
import {
  workspaceService,
  WorkspaceItem,
  MAX_CREATOR_WORKSPACES,
} from '../services/workspaceService';
import { Nation, ProvinceData, RegimeType, IdeologyType } from '../types';
import { WorldMap } from './WorldMap';
import { WorkspaceCreationWizard } from './WorkspaceCreationWizard';
import { getProvinceChineseName } from '../lib/provinceTranslations';
import { NationFlagDisplay, getAspectRatioCSS } from './NationFlagDisplay';
import { QuickNationCreateModal } from './QuickNationCreateModal';
import { EditNationDataModal } from './EditNationDataModal';
import { TerritoryColorPicker } from './TerritoryColorPicker';
import { WorkspaceGlobalSettingsModal } from './WorkspaceGlobalSettingsModal';
import { exportRankingToPng } from '../utils/exportImage';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onWorkspaceSelected?: (workspace: WorkspaceItem) => void;
  variant?: 'modal' | 'page';
  nations?: Nation[];
  myNation?: Nation | null;
  onSelectNation?: (nation: Nation) => void;
}

// 默认的初始虚拟国家集
const DEFAULT_WORKSPACE_NATIONS: Nation[] = [
  {
    id: 'nation_china',
    ownerId: 'creator_workspace',
    ownerUsername: '沙盘统帅',
    ownerDouyinName: '虚拟国家',
    name: '中国',
    shortName: 'CHN',
    flagUrl: 'flag_cn',
    flagColor: '#dc2626',
    nationType: '民主共和国',
    capital: '待勘定',
    territory: '0 个省份',
    description: '历史悠久的大陆文明国家，具备深厚的人口与战略纵深。',
    regime: '民主议会制',
    ideology: '自由民主主义',
    language: '华夏通用语',
    currency: '法币',
    emblemIcon: 'flag',
    createdAt: '1936-01-01T00:00:00.000Z',
    updatedAt: '1936-01-01T00:00:00.000Z',
    provinces: [],
    totalPopulation: 0,
  },
  {
    id: 'nation_britain',
    ownerId: 'creator_workspace',
    ownerUsername: '沙盘统帅',
    ownerDouyinName: '虚拟国家',
    name: '英国',
    shortName: 'GBR',
    flagUrl: 'flag_gb',
    flagColor: '#1d4ed8',
    nationType: '君主立宪国',
    capital: '待勘定',
    territory: '0 个省份',
    description: '传统海洋帝国，拥有成熟的工业体系与全球航运航道。',
    regime: '君主立宪制',
    ideology: '自由民主主义',
    language: '英语',
    currency: '英镑',
    emblemIcon: 'crown',
    createdAt: '1936-01-01T00:00:00.000Z',
    updatedAt: '1936-01-01T00:00:00.000Z',
    provinces: [],
    totalPopulation: 0,
  },
  {
    id: 'nation_france',
    ownerId: 'creator_workspace',
    ownerUsername: '沙盘统帅',
    ownerDouyinName: '虚拟国家',
    name: '法国',
    shortName: 'FRA',
    flagUrl: 'flag_fr',
    flagColor: '#2563eb',
    nationType: '民主共和国',
    capital: '待勘定',
    territory: '0 个省份',
    description: '西欧大陆强权，平原富饶，拥有高度集约的工业基础。',
    regime: '民主议会制',
    ideology: '自由民主主义',
    language: '法语',
    currency: '法郎',
    emblemIcon: 'shield',
    createdAt: '1936-01-01T00:00:00.000Z',
    updatedAt: '1936-01-01T00:00:00.000Z',
    provinces: [],
    totalPopulation: 0,
  },
];

// 人口量级格式化
const formatPopulation = (pop: number): string => {
  if (pop >= 100000000) {
    return `${(pop / 100000000).toFixed(2)} 亿`;
  }
  if (pop >= 10000) {
    return `${(pop / 10000).toFixed(1)} 万`;
  }
  return `${pop.toLocaleString()} 人`;
};

// 计算国家总人口
const calculateNationTotalPop = (nation: Nation): number => {
  if (!nation.provinces || nation.provinces.length === 0) return 0;
  return nation.provinces.reduce((sum, p) => {
    const pop = p.population || p.manpower || (1200000 + (Math.abs(Number(p.id || 1) * 3821) % 4500000));
    return sum + pop;
  }, 0);
};

// 计算国家总国土面积 (km²)
const calculateNationTotalArea = (nation: Nation): number => {
  if (!nation.provinces || nation.provinces.length === 0) return 0;
  return nation.provinces.reduce((sum, p) => {
    const area = (p as any).area_km2 || (p as any).area || Math.round(22000 + Math.abs(Number(p.id || 1) * 317) % 55000);
    return sum + area;
  }, 0);
};

// 获取国家规范英文名称或副代号
const getNationEnglishName = (nation: Nation): string => {
  if (nation.shortName && nation.shortName !== nation.name && /^[a-zA-Z\s]+$/.test(nation.shortName)) {
    return nation.shortName;
  }
  const dict: Record<string, string> = {
    '英国': 'United Kingdom',
    '法国': 'France',
    '德国': 'Germany',
    '第二帝国': 'Second Reich',
    '苏联': 'Soviet Union',
    '日本': 'Japan',
    '美国': 'United States',
    '中国': 'China',
    '意大利': 'Italy',
    '西班牙': 'Spain',
    '波兰': 'Poland',
  };
  return dict[nation.name] || nation.shortName || nation.nationType || 'Sovereign Nation';
};

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
  onWorkspaceSelected,
  variant = 'modal',
}) => {
  // 当前工作区与剧本状态
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceItem | null>(null);
  const [workspacesList, setWorkspacesList] = useState<WorkspaceItem[]>([]);
  const [showScenarioSwitchModal, setShowScenarioSwitchModal] = useState(false);
  const [showCreationWizard, setShowCreationWizard] = useState(false);

  // 工作区模式：'create'（新建国家模式） | 'territory'（分配疆域模式）
  const [activeMode, setActiveMode] = useState<'create' | 'territory'>('territory');

  // 虚拟国家列表
  const [workspaceNations, setWorkspaceNations] = useState<Nation[]>([]);
  // 当前正在分配疆域或选中的国家 ID
  const [selectedNationId, setSelectedNationId] = useState<string | null>(null);
  // 搜索关键字（桌面端）
  const [searchKeyword, setSearchKeyword] = useState('');

  // 移动端国家侧栏抽屉开关
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 快速建国弹窗控制（核心需求）
  const [isQuickNationModalOpen, setIsQuickNationModalOpen] = useState(false);

  // 🌟 侧滑抽屉状态（按需唤出，默认全部隐藏，确保地图绝对主角）
  const [isNationListOpen, setIsNationListOpen] = useState(false); // 左侧国家列表卡片展开状态
  const [isSearchExpanded, setIsSearchExpanded] = useState(false); // 国家列表内搜索展开状态
  const nationCardRef = useRef<HTMLDivElement | null>(null);

  // 展开国家列表卡片时，点击外部自动收起
  useEffect(() => {
    if (!isNationListOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (nationCardRef.current && !nationCardRef.current.contains(e.target as Node)) {
        setIsNationListOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isNationListOpen]);

  const [isNationDetailOpen, setIsNationDetailOpen] = useState(false); // 右侧国家详情抽屉
  const [detailNationId, setDetailNationId] = useState<string | null>(null); // 当前详情查看的国家 ID
  const [detailTab, setDetailTab] = useState<'overview' | 'economy' | 'military' | 'diplomacy'>('overview');

  // 🌟 国家排行弹窗状态与排序维度
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);
  // 🌟 全局设置弹窗状态（字体、地块颜色、省份数据与名称）
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);
  const [rankingSortField, setRankingSortField] = useState<'power' | 'provinces' | 'population' | 'industry'>('power');
  const [isExportingRanking, setIsExportingRanking] = useState(false);
  const [isExportingMap, setIsExportingMap] = useState(false);
  const [mapExportResolution, setMapExportResolution] = useState<'4k' | '2k' | '1080p' | '8k'>('4k');

  // 🌟 右上角地图工具箱收起与展开（默认收起为小按钮）
  const [isMapToolsExpanded, setIsMapToolsExpanded] = useState(false);

  // 🌟 地图图层弹窗
  const [isLayerModalOpen, setIsLayerModalOpen] = useState(false);
  const [mapMode, setMapMode] = useState<'political' | 'terrain' | 'population' | 'industrial' | 'resources'>('political');
  const [layerSettings, setLayerSettings] = useState({
    showCountryName: true,
    showProvinceName: false,
    showGrid: false,
    showLegend: false,
  });

  // 🌟 完整国家档案编辑大弹窗
  const [isEditFullDataOpen, setIsEditFullDataOpen] = useState(false);
  const [editingNationForFullData, setEditingNationForFullData] = useState<Nation | null>(null);

  // 快捷重命名与三点操作菜单
  const [activeNationMenuId, setActiveNationMenuId] = useState<string | null>(null);
  const [isRenamingNation, setIsRenamingNation] = useState(false);
  const [renameNationInput, setRenameNationInput] = useState('');

  // 更多操作下拉菜单
  const [showMoreActions, setShowMoreActions] = useState(false);

  // 框选模式开关（核心需求：可以框选，取消仅相邻限制）
  const [isBoxSelectMode, setIsBoxSelectMode] = useState(false);

  // 定都模式开关（点击地图省份直接设为当前选中国家的法定都城）
  const [isSetCapitalMode, setIsSetCapitalMode] = useState(false);

  // 通用确认对话框
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    isDangerous?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '确认',
    onConfirm: () => {},
  });

  // 轻量级 Toast 提示
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3200);
  }, []);

  // 全屏状态
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 初始化加载工作区与国家数据
  useEffect(() => {
    const currentActive = workspaceService.getActiveWorkspace();
    const allWs = workspaceService.getWorkspaces();
    setWorkspacesList(allWs);

    if (currentActive) {
      setActiveWorkspace(currentActive);
      if (currentActive.customNations && currentActive.customNations.length > 0) {
        setWorkspaceNations(currentActive.customNations);
        setSelectedNationId(currentActive.customNations[0].id);
      } else {
        setWorkspaceNations(DEFAULT_WORKSPACE_NATIONS);
        setSelectedNationId(DEFAULT_WORKSPACE_NATIONS[0].id);
        workspaceService.updateWorkspace(currentActive.id, {
          customNations: DEFAULT_WORKSPACE_NATIONS,
        });
      }
    } else if (allWs.length > 0) {
      const first = allWs[0];
      workspaceService.setActiveWorkspaceId(first.id);
      setActiveWorkspace(first);
      const nations = first.customNations && first.customNations.length > 0
        ? first.customNations
        : DEFAULT_WORKSPACE_NATIONS;
      setWorkspaceNations(nations);
      setSelectedNationId(nations.length > 0 ? nations[0].id : null);
    }
  }, []);

  // 当前选中的国家对象
  const selectedNation = useMemo(() => {
    if (!selectedNationId) return null;
    return workspaceNations.find((n) => n.id === selectedNationId) || null;
  }, [selectedNationId, workspaceNations]);

  // 正在查看详情的国家对象（如果没指定 detailNationId，则使用当前选中国家）
  const viewingNation = useMemo(() => {
    if (detailNationId) {
      return workspaceNations.find((n) => n.id === detailNationId) || selectedNation;
    }
    return selectedNation;
  }, [detailNationId, selectedNation, workspaceNations]);
  const detailNation = viewingNation;

  // 全局统计数据
  const globalStats = useMemo(() => {
    let totalAssignedProvinces = 0;
    let totalGlobalPop = 0;
    workspaceNations.forEach((n) => {
      totalAssignedProvinces += n.provinces?.length || 0;
      totalGlobalPop += calculateNationTotalPop(n);
    });
    return {
      totalNations: workspaceNations.length,
      totalAssignedProvinces,
      totalGlobalPop,
    };
  }, [workspaceNations]);

  // 搜索过滤国家列表
  const filteredNations = useMemo(() => {
    if (!searchKeyword.trim()) return workspaceNations;
    const kw = searchKeyword.toLowerCase();
    return workspaceNations.filter(
      (n) =>
        n.name.toLowerCase().includes(kw) ||
        (n.shortName && n.shortName.toLowerCase().includes(kw)) ||
        (n.nationType && n.nationType.toLowerCase().includes(kw))
    );
  }, [workspaceNations, searchKeyword]);

  // 🌟 计算国家综合排行数据（综合国力、领土省份、总人口、工业产能）
  const rankingList = useMemo(() => {
    const list = workspaceNations.map((nation) => {
      const provinceCount = nation.provinces?.length || 0;
      const totalPop = calculateNationTotalPop(nation);
      const totalArea = calculateNationTotalArea(nation);
      let civFactories = 0;
      let milFactories = 0;
      (nation.provinces || []).forEach((p) => {
        civFactories += p.civilianFactories || 0;
        milFactories += p.militaryFactories || 0;
      });
      const totalFactories = civFactories + milFactories;
      const divisionsCount = nation.army?.divisions?.length || 0;

      // 综合国力评分：综合考量省份领土、总人口规模、工业基底（民工+军工）、常备军力
      const powerScore = Math.round(
        provinceCount * 25 +
        (totalPop / 1000000) * 1.5 +
        civFactories * 32 +
        milFactories * 48 +
        divisionsCount * 24 +
        (nation.stabilityIndex || 70) * 2
      );

      return {
        nation,
        provinceCount,
        totalPop,
        totalArea,
        civFactories,
        milFactories,
        totalFactories,
        divisionsCount,
        powerScore,
      };
    });

    return list.sort((a, b) => {
      if (rankingSortField === 'power') return b.powerScore - a.powerScore;
      if (rankingSortField === 'provinces') {
        if (b.provinceCount !== a.provinceCount) return b.provinceCount - a.provinceCount;
        return b.totalArea - a.totalArea;
      }
      if (rankingSortField === 'population') return b.totalPop - a.totalPop;
      if (rankingSortField === 'industry') return b.totalFactories - a.totalFactories;
      return 0;
    });
  }, [workspaceNations, rankingSortField]);

  // 🌟 下载当前视角下的无UI纯净世界地图 .png (支持 4K 极清 / 2K 超清 / 8K 巨幅 / 1080P 高清)
  const handleDownloadPureMapPng = useCallback((resolution?: '4k' | '2k' | '1080p' | '8k') => {
    const targetRes = resolution || mapExportResolution;
    setIsExportingMap(true);
    const resLabels: Record<string, string> = {
      '8k': '8K巨幅 (7680px)',
      '4k': '4K极清 (3840px)',
      '2k': '2K超清 (2560px)',
      '1080p': '1080P高清 (1920px)',
    };
    const resName = resLabels[targetRes] || '4K极清';
    showToast(`正在生成 ${resName} 纯净世界地图...`);
    window.dispatchEvent(
      new CustomEvent('map-download-current-view', {
        detail: {
          resolution: targetRes,
          resolutionName: resName,
          fileName: `纯净世界地图_${targetRes.toUpperCase()}_${activeWorkspace?.name || '沙盘推演'}_${new Date().toISOString().slice(0, 10)}.png`,
        },
      })
    );
  }, [mapExportResolution, activeWorkspace?.name, showToast]);

  useEffect(() => {
    const handleDownloadFinished = (e: any) => {
      setIsExportingMap(false);
      if (e?.detail?.success !== false) {
        const resTitle = e?.detail?.resolutionName || (e?.detail?.width ? `${e.detail.width}×${e.detail.height}` : '4K极清');
        showToast(`无UI纯净地图（${resTitle}）已成功下载为 PNG`);
      } else {
        showToast(e?.detail?.error || '地图生成失败，请重试');
      }
    };
    window.addEventListener('map-download-finished', handleDownloadFinished);
    return () => {
      window.removeEventListener('map-download-finished', handleDownloadFinished);
    };
  }, [showToast]);

  // 🌟 下载国家排行长图 .png
  const handleDownloadRankingPng = useCallback(async () => {
    try {
      setIsExportingRanking(true);
      showToast('正在生成国家实力排行长图 (.png)...');
      const dimTitleMap: Record<string, string> = {
        power: '综合国力排行榜',
        provinces: '领土省份排行榜',
        population: '总人口排行榜',
        industry: '工业产能排行榜',
      };

      const topScore = rankingList[0]?.powerScore || 1;
      const topProvs = rankingList[0]?.provinceCount || 1;
      const topPop = rankingList[0]?.totalPop || 1;
      const topFact = rankingList[0]?.totalFactories || 1;

      const items = rankingList.map((item, idx) => {
        let primaryVal = '';
        if (rankingSortField === 'power') primaryVal = `${item.powerScore.toLocaleString()} 分`;
        else if (rankingSortField === 'provinces') primaryVal = `${item.provinceCount} 省`;
        else if (rankingSortField === 'population') primaryVal = formatPopulation(item.totalPop);
        else if (rankingSortField === 'industry') primaryVal = `${item.totalFactories} 厂`;

        const sub =
          rankingSortField === 'power'
            ? `${item.provinceCount}省 · 人口${formatPopulation(item.totalPop)} · ${item.totalFactories}厂`
            : rankingSortField === 'provinces'
            ? `面积约 ${(item.totalArea / 10000).toFixed(1)}万 km²`
            : rankingSortField === 'population'
            ? `占世界 ${globalStats.totalGlobalPop > 0 ? ((item.totalPop / globalStats.totalGlobalPop) * 100).toFixed(1) : 0}%`
            : `民用 ${item.civFactories} · 军工 ${item.milFactories}`;

        let pct = 100;
        if (rankingSortField === 'power') pct = Math.round((item.powerScore / Math.max(1, topScore)) * 100);
        else if (rankingSortField === 'provinces') pct = Math.round((item.provinceCount / Math.max(1, topProvs)) * 100);
        else if (rankingSortField === 'population') pct = Math.round((item.totalPop / Math.max(1, topPop)) * 100);
        else if (rankingSortField === 'industry') pct = Math.round((item.totalFactories / Math.max(1, topFact)) * 100);

        return {
          rank: idx + 1,
          name: item.nation.name,
          regime: item.nation.regime || item.nation.nationType || '主权国家',
          flagColor: item.nation.flagColor || '#3B82F6',
          primaryValueText: primaryVal,
          subText: sub,
          percentage: pct,
        };
      });

      const fileName = await exportRankingToPng({
        scenarioName: activeWorkspace?.name || '全球推演沙盘',
        dimensionTitle: dimTitleMap[rankingSortField] || '国家排行榜',
        items,
        totalNations: workspaceNations.length,
        totalProvinces: workspaceNations.reduce((acc, n) => acc + (n.provinces?.length || 0), 0),
        totalPopulationText: formatPopulation(globalStats.totalGlobalPop),
      });
      showToast(`已成功下载【${fileName}】`);
    } catch (err) {
      console.error('Export ranking error:', err);
      showToast('下载国家排行长图失败，请重试');
    } finally {
      setIsExportingRanking(false);
    }
  }, [
    rankingList,
    rankingSortField,
    activeWorkspace?.name,
    workspaceNations,
    globalStats.totalGlobalPop,
    showToast,
  ]);

  // 持久化国家数据至工作区
  const persistNationsUpdate = useCallback((updatedNations: Nation[]) => {
    setWorkspaceNations(updatedNations);
    if (activeWorkspace) {
      workspaceService.updateWorkspace(activeWorkspace.id, {
        customNations: updatedNations,
      });
    }
  }, [activeWorkspace]);

  // 地图上单点点击省份进行划拨或移出（彻底取消相邻限制）
  const handleMapProvinceClick = useCallback((provinceInfo: {
    id: string | number;
    name: string;
    properties: any;
    ownerNation?: Nation | null;
  }) => {
    if (!selectedNationId) {
      showToast('请先在下方卡片中选择一个国家');
      return;
    }

    const currentSelected = workspaceNations.find((n) => n.id === selectedNationId);
    if (!currentSelected) return;

    const provId = provinceInfo.id;
    const provName = provinceInfo.name;
    const cnName = getProvinceChineseName(provName || provId);

    // 🌟 定都模式：将点击的省份直接确立为该国的法定都城，并确保该省份归属于该国
    if (isSetCapitalMode) {
      const isAlreadyOwned = currentSelected.provinces?.some(
        (p) => String(p.id) === String(provId) || p.name.trim().toLowerCase() === provName.trim().toLowerCase()
      );

      const provPop = (provinceInfo.properties?.manpower as number) ??
        (provinceInfo.properties?.population as number) ??
        (1200000 + (Math.abs(Number(provId || 1) * 3821) % 4500000));

      const newProvinceData: ProvinceData = {
        id: provId,
        name: provName,
        population: provPop,
        civilianFactories: 1,
        militaryFactories: 0,
        isCore: true,
      };

      const updatedNations = workspaceNations.map((n) => {
        if (n.id === currentSelected.id) {
          const nextProvinces = isAlreadyOwned
            ? (n.provinces || [])
            : [...(n.provinces || []), newProvinceData];
          return {
            ...n,
            capital: cnName,
            capitalId: provId,
            provinces: nextProvinces,
            totalPopulation: nextProvinces.reduce((sum, p) => sum + (p.population || 1500000), 0),
          };
        } else {
          // 若该省份原本属于其他国家，从其他国家剥离
          const nextProvinces = (n.provinces || []).filter(
            (p) => !(String(p.id) === String(provId) || p.name.trim().toLowerCase() === provName.trim().toLowerCase())
          );
          return {
            ...n,
            provinces: nextProvinces,
            totalPopulation: nextProvinces.reduce((sum, p) => sum + (p.population || 1500000), 0),
          };
        }
      });

      persistNationsUpdate(updatedNations);
      setIsSetCapitalMode(false);
      showToast(`已成功将【${cnName}】确立为【${currentSelected.name}】的法定都城！`);
      return;
    }

    // 检查此省份是否已在当前选中国家名下
    const isAlreadyOwnedByCurrent = currentSelected.provinces?.some(
      (p) => String(p.id) === String(provId) || p.name.trim().toLowerCase() === provName.trim().toLowerCase()
    );

    let updatedNations: Nation[] = [];

    if (isAlreadyOwnedByCurrent) {
      // 移出当前国家
      updatedNations = workspaceNations.map((n) => {
        if (n.id === currentSelected.id) {
          const nextProvinces = (n.provinces || []).filter(
            (p) => !(String(p.id) === String(provId) || p.name.trim().toLowerCase() === provName.trim().toLowerCase())
          );
          return {
            ...n,
            provinces: nextProvinces,
            totalPopulation: nextProvinces.reduce((sum, p) => sum + (p.population || 1500000), 0),
          };
        }
        return n;
      });
      showToast(`已将【${cnName}】从【${currentSelected.name}】疆域移出`);
    } else {
      // 划入当前国家；若属于其他国家，则自动剥离（无需相邻限制）
      const provPop = (provinceInfo.properties?.manpower as number) ??
        (provinceInfo.properties?.population as number) ??
        (1200000 + (Math.abs(Number(provId || 1) * 3821) % 4500000));

      const newProvinceData: ProvinceData = {
        id: provId,
        name: provName,
        population: provPop,
        civilianFactories: 1,
        militaryFactories: 0,
        isCore: true,
      };

      updatedNations = workspaceNations.map((n) => {
        if (n.id === currentSelected.id) {
          const nextProvinces = [...(n.provinces || []), newProvinceData];
          return {
            ...n,
            provinces: nextProvinces,
            totalPopulation: nextProvinces.reduce((sum, p) => sum + (p.population || 1500000), 0),
          };
        } else {
          const nextProvinces = (n.provinces || []).filter(
            (p) => !(String(p.id) === String(provId) || p.name.trim().toLowerCase() === provName.trim().toLowerCase())
          );
          return {
            ...n,
            provinces: nextProvinces,
            totalPopulation: nextProvinces.reduce((sum, p) => sum + (p.population || 1500000), 0),
          };
        }
      });
      showToast(`已划入【${cnName}】至【${currentSelected.name}】`);
    }

    persistNationsUpdate(updatedNations);
  }, [selectedNationId, workspaceNations, persistNationsUpdate, showToast, isSetCapitalMode]);

  // 框选批量划拨省份（核心需求：支持框选，取消相邻限制）
  const handleBoxSelectProvinces = useCallback((selectedProvs: { id: string | number; name: string; properties?: any }[]) => {
    if (!selectedNationId) {
      showToast('请先选择要分配疆域的国家实体');
      return;
    }

    const currentSelected = workspaceNations.find((n) => n.id === selectedNationId);
    if (!currentSelected || selectedProvs.length === 0) return;

    const selectedProvIdsSet = new Set(selectedProvs.map((p) => String(p.id)));

    // 新增省份集合
    const newlyAddedList: ProvinceData[] = [];
    selectedProvs.forEach((p) => {
      const alreadyHas = currentSelected.provinces?.some((cp) => String(cp.id) === String(p.id));
      if (!alreadyHas) {
        const provPop = (p.properties?.manpower as number) ??
          (p.properties?.population as number) ??
          (1200000 + (Math.abs(Number(p.id || 1) * 3821) % 4500000));
        newlyAddedList.push({
          id: p.id,
          name: p.name,
          population: provPop,
          civilianFactories: 1,
          militaryFactories: 0,
          isCore: true,
        });
      }
    });

    if (newlyAddedList.length === 0) {
      showToast('框选区域内所有省份已属于当前国家');
      return;
    }

    // 批量归并至当前国家，并从其他国家名下移出
    const updatedNations = workspaceNations.map((n) => {
      if (n.id === currentSelected.id) {
        const nextProvs = [...(n.provinces || []), ...newlyAddedList];
        return {
          ...n,
          provinces: nextProvs,
          totalPopulation: nextProvs.reduce((sum, p) => sum + (p.population || 1500000), 0),
        };
      } else {
        const nextProvs = (n.provinces || []).filter((p) => !selectedProvIdsSet.has(String(p.id)));
        return {
          ...n,
          provinces: nextProvs,
          totalPopulation: nextProvs.reduce((sum, p) => sum + (p.population || 1500000), 0),
        };
      }
    });

    persistNationsUpdate(updatedNations);
    showToast(`框选成功：已将 ${newlyAddedList.length} 个省份批量划入【${currentSelected.name}】`);
  }, [selectedNationId, workspaceNations, persistNationsUpdate, showToast]);

  // 清空某国家的全部疆域
  const handleClearNationProvinces = (nationId: string) => {
    const targetNation = workspaceNations.find((n) => n.id === nationId);
    if (!targetNation) return;

    setConfirmDialog({
      isOpen: true,
      title: '清空疆域划分',
      message: `确定要清空【${targetNation.name}】已分配的全部 ${targetNation.provinces?.length || 0} 个省份领土吗？`,
      confirmText: '确认清空',
      isDangerous: true,
      onConfirm: () => {
        const updated = workspaceNations.map((n) =>
          n.id === nationId ? { ...n, provinces: [], totalPopulation: 0 } : n
        );
        persistNationsUpdate(updated);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast(`已清空【${targetNation.name}】的全部疆域`);
      },
    });
  };

  // 清空所有国家的疆域划分
  const handleResetAllProvinces = () => {
    setConfirmDialog({
      isOpen: true,
      title: '重置全图疆域',
      message: '确定要清空当前沙盘内所有国家的疆域划定吗？所有省份将重置为中立未占领状态。',
      confirmText: '清空全图',
      isDangerous: true,
      onConfirm: () => {
        const updated = workspaceNations.map((n) => ({
          ...n,
          provinces: [],
          totalPopulation: 0,
        }));
        persistNationsUpdate(updated);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast('已重置全图省份归属');
      },
    });
  };

  // 删除某个国家
  const handleDeleteNation = (nationId: string) => {
    const target = workspaceNations.find((n) => n.id === nationId);
    if (!target) return;

    setConfirmDialog({
      isOpen: true,
      title: '解散国家实体',
      message: `确定要解散国家【${target.name}】吗？其所属省份将重新释放为中立领土。`,
      confirmText: '确认解散',
      isDangerous: true,
      onConfirm: () => {
        const updated = workspaceNations.filter((n) => n.id !== nationId);
        persistNationsUpdate(updated);
        if (selectedNationId === nationId) {
          setSelectedNationId(updated.length > 0 ? updated[0].id : null);
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast(`国家实体【${target.name}】已解散`);
      },
    });
  };

  // 接收快速建国弹窗创建的新国家
  const handleQuickNationCreated = (newNation: Nation) => {
    const updated = [...workspaceNations, newNation];
    persistNationsUpdate(updated);
    setSelectedNationId(newNation.id);
    showToast(`新国家【${newNation.name}】建立成功！已设为当前编辑国家`);
  };

  // 快速修改国家名称
  const handleStartRenameNation = () => {
    if (!selectedNation) return;
    setRenameNationInput(selectedNation.name);
    setIsRenamingNation(true);
  };

  const handleSaveRenameNation = () => {
    if (!selectedNation) {
      setIsRenamingNation(false);
      return;
    }
    const newName = renameNationInput.trim();
    if (!newName) {
      setIsRenamingNation(false);
      return;
    }
    const updated = workspaceNations.map((n) =>
      n.id === selectedNation.id ? { ...n, name: newName } : n
    );
    persistNationsUpdate(updated);
    setIsRenamingNation(false);
    showToast(`已更新国家名称为【${newName}】`);
  };

  // 快捷更新国家疆域代表色（地图即刻实时重绘并持久化）
  const handleUpdateNationColor = useCallback(
    (nationId: string, newColor: string) => {
      const targetNation = workspaceNations.find((n) => n.id === nationId);
      const updated = workspaceNations.map((n) =>
        n.id === nationId ? { ...n, flagColor: newColor } : n
      );
      persistNationsUpdate(updated);
      showToast(`已更新【${targetNation?.name || '国家'}】的疆域代表色`);
    },
    [workspaceNations, persistNationsUpdate, showToast]
  );

  // 创作者删除自建剧本（释放创建配额，最多3个）
  const handleDeleteWorkspace = (ws: WorkspaceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (ws.id === 'ws_default_1936') {
      showToast('系统基础剧本不可删除');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: '删除自建剧本',
      message: `确定要删除自建剧本【${ws.name}】吗？删除后将彻底移除该剧本及其所有国家实体，并释放 1 个剧本创建配额。`,
      confirmText: '确认删除并释放配额',
      isDangerous: true,
      onConfirm: () => {
        const result = workspaceService.deleteWorkspace(ws.id);
        const updatedList = workspaceService.getWorkspaces();
        setWorkspacesList(updatedList);

        if (activeWorkspace?.id === ws.id) {
          const fallback = updatedList[0];
          if (fallback) {
            setActiveWorkspace(fallback);
            setWorkspaceNations(fallback.customNations || []);
            setSelectedNationId(fallback.customNations?.[0]?.id || null);
          }
        }

        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast(result.message || '已成功删除剧本并释放配额');
      },
    });
  };

  // 切换工作区剧本
  const handleSwitchWorkspace = (ws: WorkspaceItem) => {
    workspaceService.setActiveWorkspaceId(ws.id);
    setActiveWorkspace(ws);
    const nations = ws.customNations && ws.customNations.length > 0 ? ws.customNations : [];
    setWorkspaceNations(nations);
    setSelectedNationId(nations.length > 0 ? nations[0].id : null);
    setShowScenarioSwitchModal(false);
    showToast(`已切换至剧本【${ws.name}】`);
  };

  // 新建剧本向导完成（先展示剧本设置，再展示国家建立页，全部流程在向导内无缝闭环）
  const handleWizardSuccess = (created: WorkspaceItem) => {
    setShowCreationWizard(false);
    const all = workspaceService.getWorkspaces();
    setWorkspacesList(all);
    setActiveWorkspace(created);
    const nations = created.customNations || [];
    setWorkspaceNations(nations);
    if (nations.length > 0) {
      setSelectedNationId(nations[0].id);
      showToast(`剧本【${created.name}】与参演国家构筑完成，已自动激活，可直接划拔疆域！`);
      setIsQuickNationModalOpen(false);
    } else {
      setSelectedNationId(null);
      showToast(`新推演剧本【${created.name}】创建成功！`);
      setIsQuickNationModalOpen(true);
    }
  };

  // 导出剧本 JSON
  const handleExportScenarioJSON = () => {
    if (!activeWorkspace) return;
    const exportData = {
      ...activeWorkspace,
      customNations: workspaceNations,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenario_${activeWorkspace.id}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('沙盘剧本已导出为 JSON 配置文件');
  };

  // 地图缩放与重置控制
  const handleMapZoomIn = () => {
    window.dispatchEvent(new CustomEvent('map-zoom-in'));
  };

  const handleMapZoomOut = () => {
    window.dispatchEvent(new CustomEvent('map-zoom-out'));
  };

  const handleMapReset = () => {
    window.dispatchEvent(new CustomEvent('map-reset-view'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#F1F5F9] overflow-hidden select-none font-sans text-slate-800">
      {/* 🌟 顶部悬浮导航栏：轻、薄、悬浮于地图上方 */}
      <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 right-2.5 sm:right-3 z-30 pointer-events-none flex items-center justify-between gap-1.5 sm:gap-2">
        {/* 左侧：返回按钮 + 分配疆域胶囊下拉 + 历史时代标记 */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-md flex items-center justify-center text-slate-700 hover:text-slate-950 transition active:scale-95 cursor-pointer shrink-0"
            title="退出工作台并返回沙盘"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* 分配疆域胶囊下拉 */}
          <button
            type="button"
            onClick={() => setShowScenarioSwitchModal(true)}
            className="h-8.5 sm:h-9 px-2.5 sm:px-3 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-md flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <MapPin className="w-3.5 h-3.5 text-[#6C4FF6] stroke-[2.4] shrink-0" />
            <span className="whitespace-nowrap">分配疆域</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {/* 剧本与纪元副标题 */}
          <span className="text-[11px] text-slate-500 font-medium hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/85 backdrop-blur-md border border-slate-200/70 shadow-2xs shrink-0 whitespace-nowrap">
            <span>{activeWorkspace?.name || '粉陆纪元'}</span>
            <span className="text-slate-300">·</span>
            <span>{activeWorkspace?.era ? `${activeWorkspace.era}年` : '1936年'}</span>
          </span>
        </div>

        {/* 右侧：全局设置 + 国家排行唤起按钮 + 更多操作 */}
        <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 shrink-0 relative">
          <button
            type="button"
            onClick={() => setIsGlobalSettingsOpen(true)}
            className="h-8.5 sm:h-9 px-2.5 sm:px-3 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-md flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#6C4FF6] hover:bg-slate-50 transition active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
            title="沙盘全局设置：国家字体 / 地块底图颜色 / 省份数据与名称"
          >
            <Settings className="w-3.5 h-3.5 text-[#6C4FF6] shrink-0" />
            <span className="whitespace-nowrap">全局设置</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRankingModalOpen(true)}
            className="h-8.5 sm:h-9 px-2.5 sm:px-3 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-md flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#6C4FF6] hover:bg-slate-50 transition active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
            title="查看国家排行"
          >
            <Trophy className="w-3.5 h-3.5 text-[#6C4FF6] shrink-0" />
            <span className="whitespace-nowrap">国家排行</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono shrink-0">
              {workspaceNations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowMoreActions(!showMoreActions)}
            className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-md flex items-center justify-center text-slate-600 hover:text-slate-900 transition active:scale-95 cursor-pointer shrink-0"
            title="更多操作"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* 更多操作浮层菜单 */}
          {showMoreActions && (
            <div className="absolute right-0 top-11 w-44 bg-white/98 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-2xl p-1.5 z-40 text-xs text-slate-700 animate-fadeIn">
              <button
                type="button"
                onClick={() => {
                  setShowMoreActions(false);
                  setIsGlobalSettingsOpen(true);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer text-left font-semibold text-slate-800"
              >
                <Settings className="w-3.5 h-3.5 text-[#6C4FF6]" />
                <span>沙盘全局设置</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMoreActions(false);
                  setShowScenarioSwitchModal(true);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer text-left"
              >
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>切换推演剧本</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMoreActions(false);
                  handleExportScenarioJSON();
                }}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer text-left"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>导出剧本 JSON</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMoreActions(false);
                  handleResetAllProvinces();
                }}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-rose-50 text-rose-600 flex items-center gap-2 transition cursor-pointer text-left"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                <span>清空全图疆域</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 🌟 1. 地图主体：绝对视觉主角，100% 铺满视口全屏 */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
            <WorldMap
              nations={workspaceNations}
              workspaceHighlightNationId={selectedNationId}
              onProvinceClick={handleMapProvinceClick}
              isBoxSelectMode={isBoxSelectMode}
              onBoxSelectProvinces={handleBoxSelectProvinces}
              onSelectNation={(n) => {
                setSelectedNationId(n.id);
                setActiveMode('territory');
                showToast(`已切换至【${n.name}】进行疆域划拨`);
              }}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              isWorkspaceEditor={true}
              mapMode={mapMode}
              layerSettings={layerSettings}
              globalSettings={activeWorkspace?.globalSettings}
            />
      </div>

      {/* 🌟 2. 左上角悬浮当前国家卡片：点击以非线性动画展开为国家列表卡片（图二样式） */}
      <div ref={nationCardRef} className="absolute top-14 sm:top-15 left-3 z-30 pointer-events-auto flex items-center gap-1.5">
        <AnimatePresence mode="wait">
          {!isNationListOpen ? (
            /* 图一：极简药丸徽章 */
            <motion.div
              key="nation-collapsed-pill"
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -4 }}
              transition={{ type: 'spring', stiffness: 420, damping: 26, mass: 0.8 }}
              style={{ transformOrigin: 'top left' }}
              onClick={() => {
                setIsNationListOpen(true);
                setIsSearchExpanded(false);
              }}
              className="px-2.5 py-1.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2.5 min-w-[145px] max-w-[230px] group select-none"
              title="点击展开国家列表"
            >
              <div
                style={{ aspectRatio: getAspectRatioCSS(selectedNation?.flagRatio) }}
                className="h-5.5 max-w-10 rounded-md overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0 shadow-2xs flex items-center justify-center"
              >
                <NationFlagDisplay
                  flagUrl={selectedNation?.flagUrl}
                  flagColor={selectedNation?.flagColor}
                  name={selectedNation?.name || '国家'}
                  ratio={selectedNation?.flagRatio}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-xs text-slate-900 truncate">
                    {selectedNation ? selectedNation.name : '未选择国家'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 shrink-0 transition" />
                </div>
                <p className="text-[10px] text-slate-500 font-medium truncate">
                  {selectedNation
                    ? `${selectedNation.provinces?.length || 0}省 · 人口${formatPopulation(calculateNationTotalPop(selectedNation))}`
                    : '点击选择国家'}
                </p>
              </div>
            </motion.div>
          ) : (
            /* 图二：非线性展开的国家列表浮动面板 */
            <motion.div
              key="nation-expanded-card"
              initial={{ opacity: 0, scale: 0.88, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: -8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25, mass: 0.8 }}
              style={{ transformOrigin: 'top left' }}
              className="w-56 sm:w-60 bg-white/98 backdrop-blur-2xl border border-slate-200/90 rounded-2xl shadow-2xl p-2.5 flex flex-col gap-2 select-none"
            >
              {/* 头部：标题 + 数量小徽章，右侧搜索与关闭按钮 */}
              <div className="flex items-center justify-between pb-1 border-b border-slate-100/90">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-900">国家列表</span>
                  <span className="w-4.5 h-4.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold flex items-center justify-center">
                    {workspaceNations.length}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-slate-400">
                  <button
                    type="button"
                    onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                    className={`p-1 rounded-lg transition cursor-pointer ${
                      isSearchExpanded ? 'bg-slate-100 text-slate-700' : 'hover:bg-slate-100 hover:text-slate-700'
                    }`}
                    title="搜索国家"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNationListOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                    title="收起列表"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 展开的搜索框 */}
              <AnimatePresence>
                {isSearchExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.16 }}
                    className="overflow-hidden"
                  >
                    <div className="relative">
                      <input
                        type="text"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        placeholder="搜索国家..."
                        autoFocus
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#6C4FF6]"
                      />
                      {searchKeyword && (
                        <button
                          type="button"
                          onClick={() => setSearchKeyword('')}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 国家列表项 */}
              <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
                {filteredNations.map((nation) => {
                  const isSelected = selectedNationId === nation.id;
                  const provCount = nation.provinces?.length || 0;

                  return (
                    <div
                      key={nation.id}
                      onClick={() => {
                        setSelectedNationId(nation.id);
                        setActiveMode('territory');
                        showToast(`已选中【${nation.name}】进行疆域划拨`);
                      }}
                      className={`px-2 py-1.5 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition text-left group ${
                        isSelected
                          ? 'bg-[#F0ECFF] text-[#6C4FF6]'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          style={{ aspectRatio: getAspectRatioCSS(nation.flagRatio) }}
                          className="h-5 max-w-9 rounded-xs overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs flex items-center justify-center"
                        >
                          <NationFlagDisplay
                            flagUrl={nation.flagUrl}
                            flagColor={nation.flagColor}
                            name={nation.name}
                            ratio={nation.flagRatio}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span
                          className={`text-xs truncate ${
                            isSelected ? 'font-bold text-[#6C4FF6]' : 'font-medium text-slate-800'
                          }`}
                        >
                          {nation.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`text-[11px] font-medium ${
                            isSelected ? 'text-[#6C4FF6]' : 'text-slate-400'
                          }`}
                        >
                          {provCount} 省
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailNationId(nation.id);
                            setIsNationDetailOpen(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition"
                          title="查看国家档案"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredNations.length === 0 && (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    未找到匹配国家
                  </div>
                )}
              </div>

              {/* 底部大按钮：+ 新建国家 */}
              <button
                type="button"
                onClick={() => {
                  setIsNationListOpen(false);
                  setIsQuickNationModalOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-[#F0ECFF] hover:bg-[#E4DAFF] text-[#6C4FF6] font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>新建国家</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 优美不占空间的疆域代表色收纳器 */}
        {!isNationListOpen && selectedNation && (
          <TerritoryColorPicker
            color={selectedNation.flagColor || '#3b82f6'}
            nationName={selectedNation.name}
            onChange={(newColor) => handleUpdateNationColor(selectedNation.id, newColor)}
            variant="compact"
            placement="bottom-end"
          />
        )}
      </div>

      {/* 🌟 3. 右上角悬浮地图工具箱：默认收起为圆角小按钮，点击展开 */}
      <div className="absolute top-14 sm:top-15 right-3 z-20 pointer-events-auto flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-1.5">
          {/* 一键下载纯净地图快捷按钮 */}
          <button
            type="button"
            onClick={() => handleDownloadPureMapPng(mapExportResolution)}
            disabled={isExportingMap}
            className="h-9 px-2.5 rounded-2xl border shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer bg-white/95 backdrop-blur-xl border-slate-200/90 text-slate-700 hover:text-slate-950 text-xs font-semibold disabled:opacity-50"
            title={`下载当前视角 ${mapExportResolution.toUpperCase()} 纯净世界地图 (.png)`}
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">
              {isExportingMap ? '导出中...' : `下载地图 (${mapExportResolution.toUpperCase()})`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsMapToolsExpanded(!isMapToolsExpanded)}
            className={`w-9 h-9 rounded-2xl border shadow-md flex items-center justify-center transition active:scale-95 cursor-pointer ${
              isMapToolsExpanded
                ? 'bg-[#6C4FF6] border-[#6C4FF6] text-white shadow-indigo-500/20'
                : 'bg-white/95 backdrop-blur-xl border-slate-200/90 text-slate-700 hover:text-slate-950'
            }`}
            title={isMapToolsExpanded ? '收起地图工具' : '展开地图工具与分辨率设置'}
          >
            <Crosshair className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* 展开的垂直工具箱 */}
        <AnimatePresence>
          {isMapToolsExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              className="w-44 bg-white/98 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl p-2 flex flex-col gap-1.5 text-xs text-slate-700"
            >
              {/* 分辨率分段切换器 */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 px-0.5">
                  <span>导出分辨率</span>
                  <span className="text-[#6C4FF6] font-mono font-bold">
                    {mapExportResolution === '8k' ? '7680px' : mapExportResolution === '4k' ? '3840px' : mapExportResolution === '2k' ? '2560px' : '1920px'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-0.5 p-0.5 bg-slate-100 rounded-lg">
                  {(['1080p', '2k', '4k', '8k'] as const).map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setMapExportResolution(res)}
                      className={`py-1 text-[10px] font-bold rounded-md transition cursor-pointer text-center ${
                        mapExportResolution === res
                          ? 'bg-white text-[#6C4FF6] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title={res === '8k' ? '8K巨幅 (7680px)' : res === '4k' ? '4K极清 (3840px)' : res === '2k' ? '2K超清 (2560px)' : '1080P高清 (1920px)'}
                    >
                      {res.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadPureMapPng(mapExportResolution)}
                disabled={isExportingMap}
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#6C4FF6] hover:bg-[#5B3EE4] text-white flex items-center justify-center gap-1.5 transition cursor-pointer text-xs font-semibold disabled:opacity-50 shadow-xs active:scale-98"
                title="导出当前视角的无UI纯净世界地图"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>{isExportingMap ? '正在导出...' : `下载 ${mapExportResolution.toUpperCase()} 纯净地图`}</span>
              </button>

              <div className="w-full h-px bg-slate-100 my-0.5" />

              <button
                type="button"
                onClick={handleMapZoomIn}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer text-left"
              >
                <ZoomIn className="w-3.5 h-3.5 text-slate-500" />
                <span>放大</span>
              </button>
              <button
                type="button"
                onClick={handleMapZoomOut}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer text-left"
              >
                <ZoomOut className="w-3.5 h-3.5 text-slate-500" />
                <span>缩小</span>
              </button>
              <button
                type="button"
                onClick={handleMapReset}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer text-left"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>重置视角</span>
              </button>

              <div className="w-full h-px bg-slate-100 my-0.5" />

              <button
                type="button"
                onClick={() => setIsLayerModalOpen(true)}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer text-left"
              >
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>地图图层</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMapToolsExpanded(false);
                  setIsGlobalSettingsOpen(true);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-[#F0ECFF] flex items-center gap-2 transition cursor-pointer text-left text-slate-800 font-semibold"
              >
                <Settings className="w-3.5 h-3.5 text-[#6C4FF6]" />
                <span>沙盘全局设置</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = !isSetCapitalMode;
                  setIsSetCapitalMode(next);
                  if (next) {
                    setIsBoxSelectMode(false);
                    showToast(`已开启定都模式：请在地图上点击省份设为【${selectedNation?.name || '当前国家'}】的法定都城`);
                  } else {
                    showToast('已退出定都模式');
                  }
                }}
                className={`w-full px-2.5 py-1.5 rounded-xl flex items-center gap-2 transition cursor-pointer text-left ${
                  isSetCapitalMode
                    ? 'bg-[#F0ECFF] text-[#6C4FF6] font-bold'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>定都模式</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen?.().catch(() => {});
                    setIsFullscreen(true);
                  } else {
                    document.exitFullscreen?.().catch(() => {});
                    setIsFullscreen(false);
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer text-left"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-slate-500" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-500" />}
                <span>{isFullscreen ? '退出全屏' : '全屏'}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🌟 4. 地图图层悬浮弹窗（单选5模式 + 复选4项） */}
      <AnimatePresence>
        {isLayerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-2xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xs bg-white/98 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-2xl p-4 text-slate-800"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">地图图层</h3>
                <button
                  type="button"
                  onClick={() => setIsLayerModalOpen(false)}
                  className="w-6 h-6 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 单选模式列表 */}
              <div className="py-2.5 space-y-1">
                {[
                  { id: 'political', label: '政治（默认）' },
                  { id: 'terrain', label: '地形' },
                  { id: 'population', label: '人口' },
                  { id: 'industrial', label: '工业' },
                  { id: 'resources', label: '区域' },
                ].map((item) => {
                  const isSelected = mapMode === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setMapMode(item.id as any);
                        window.dispatchEvent(new CustomEvent('map-set-layer', { detail: { mode: item.id, settings: layerSettings } }));
                        showToast(`已切换至【${item.label}】图层`);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl flex items-center gap-2.5 cursor-pointer text-xs transition ${
                        isSelected ? 'bg-slate-100/90 text-slate-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected ? 'border-slate-900 bg-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-slate-900" />}
                      </div>
                      <span className={isSelected ? 'font-bold text-slate-900' : 'text-slate-700'}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="w-full h-px bg-slate-100 my-1" />

              {/* 复选开关 */}
              <div className="pt-2 space-y-1 text-xs">
                {[
                  { key: 'showCountryName', label: '显示国家名称' },
                  { key: 'showProvinceName', label: '显示省份名称' },
                  { key: 'showGrid', label: '显示网格' },
                  { key: 'showLegend', label: '显示图例' },
                ].map((item) => {
                  const checked = Boolean((layerSettings as any)[item.key]);
                  return (
                    <div
                      key={item.key}
                      onClick={() => {
                        const nextSettings = {
                          ...layerSettings,
                          [item.key]: !checked,
                        };
                        setLayerSettings(nextSettings);
                        window.dispatchEvent(new CustomEvent('map-set-layer-settings', { detail: nextSettings }));
                      }}
                      className="px-2.5 py-1.5 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer transition"
                    >
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                        checked ? 'bg-slate-900 border-slate-900 text-white shadow-2xs' : 'border-slate-300 bg-white hover:border-slate-400'
                      }`}>
                        {checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span className={checked ? 'text-slate-900 font-medium' : 'text-slate-700'}>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* 🌟 5. 底部悬浮操作栏：居中极简药丸（单点、框选、新建国家） */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto select-none">
        <div className="flex items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-2xl">
          {/* 单点模式 */}
          <button
            type="button"
            onClick={() => {
              setIsSetCapitalMode(false);
              if (isBoxSelectMode) {
                setIsBoxSelectMode(false);
                showToast('已切换至单点划拨模式');
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
              !isBoxSelectMode && !isSetCapitalMode
                ? 'bg-[#F0ECFF] text-[#6C4FF6] border border-[#6C4FF6]/25 font-bold shadow-2xs'
                : 'bg-transparent hover:bg-slate-100 text-slate-700 font-medium'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>单点</span>
          </button>

          {/* 框选模式 */}
          <button
            type="button"
            onClick={() => {
              setIsSetCapitalMode(false);
              if (!isBoxSelectMode) {
                setIsBoxSelectMode(true);
                showToast('已开启框选分配模式');
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
              isBoxSelectMode
                ? 'bg-[#6C4FF6] text-white font-bold shadow-2xs'
                : 'bg-transparent hover:bg-slate-100 text-slate-700 font-medium'
            }`}
          >
            <BoxSelect className="w-3.5 h-3.5" />
            <span>框选</span>
          </button>

          <div className="w-px h-4 bg-slate-200 mx-0.5" />

          {/* 新建国家按钮 */}
          <button
            type="button"
            onClick={() => setIsQuickNationModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#6C4FF6] hover:bg-[#5737D9] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>新建国家</span>
          </button>
        </div>
      </div>



      {/* 🌟 7. 右侧国家详情档案抽屉 (Slide-in Drawer) */}
      <AnimatePresence>
        {isNationDetailOpen && detailNation && (
          <div className="fixed inset-0 z-40 flex justify-end pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNationDetailOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-2xs"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="relative w-84 max-w-[85vw] h-full bg-white/98 backdrop-blur-2xl border-l border-slate-200/90 shadow-2xl flex flex-col z-10 text-slate-800"
            >
              {/* 头部：国旗、国名、修改与关闭 */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                  <div
                    style={{ aspectRatio: getAspectRatioCSS(detailNation.flagRatio) }}
                    className="h-6 max-w-11 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs flex items-center justify-center"
                  >
                    <NationFlagDisplay
                      flagUrl={detailNation.flagUrl}
                      flagColor={detailNation.flagColor}
                      name={detailNation.name}
                      ratio={detailNation.flagRatio}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    {isRenamingNation && selectedNationId === detailNation.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={renameNationInput}
                          onChange={(e) => setRenameNationInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRenameNation();
                            if (e.key === 'Escape') setIsRenamingNation(false);
                          }}
                          autoFocus
                          className="w-full h-6 px-1.5 text-xs font-bold bg-white border border-[#6C4FF6] rounded-md outline-none text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={handleSaveRenameNation}
                          className="p-1 rounded bg-[#6C4FF6] text-white hover:bg-[#5737D9] transition cursor-pointer shrink-0"
                          title="确认修改"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <h3 className="font-bold text-sm text-slate-900 truncate">{detailNation.name}</h3>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedNationId(detailNation.id);
                            handleStartRenameNation();
                          }}
                          className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0"
                          title="修改名称"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNationDetailOpen(false)}
                  className="w-7 h-7 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 核心指标统计 */}
              <div className="p-4 border-b border-slate-100 grid grid-cols-3 gap-2 text-center bg-slate-50/50">
                <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-medium">省份数量</div>
                  <div className="font-bold text-sm text-slate-800 mt-0.5">
                    {detailNation.provinces?.length || 0}
                  </div>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-medium">都城</div>
                  <div className="font-bold text-xs text-slate-800 mt-0.5 truncate">
                    {detailNation.capital || '待勘定'}
                  </div>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-medium">总人口</div>
                  <div className="font-bold text-xs text-slate-800 mt-0.5 truncate">
                    {formatPopulation(calculateNationTotalPop(detailNation))}
                  </div>
                </div>
              </div>

              {/* 疆域代表色收纳器 */}
              <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">疆域代表色</span>
                <TerritoryColorPicker
                  color={detailNation.flagColor || '#3b82f6'}
                  nationName={detailNation.name}
                  onChange={(newColor) => handleUpdateNationColor(detailNation.id, newColor)}
                  variant="pill"
                  placement="bottom-end"
                />
              </div>

              {/* 所属省份精简清单 */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-700">疆域领土清单</span>
                  <span className="text-[11px] text-slate-400">
                    {detailNation.provinces?.length || 0} 个省份
                  </span>
                </div>

                <div className="space-y-1">
                  {detailNation.provinces?.map((prov, idx) => {
                    const provId = typeof prov === 'string' ? prov : prov.id;
                    const provName = typeof prov === 'string' ? prov : (prov.name || prov.id);
                    const displayName = getProvinceChineseName(provName || provId);
                    const isCapital = detailNation.capital === provName || detailNation.capital === provId;

                    return (
                      <div
                        key={provId || idx}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-medium text-slate-700 truncate">{displayName}</span>
                          {provId && provId !== displayName && (
                            <span className="text-[10px] text-slate-400 font-mono truncate">({provId})</span>
                          )}
                        </div>
                        {isCapital && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold shrink-0">
                            都城
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {(!detailNation.provinces || detailNation.provinces.length === 0) && (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      尚未分配任何省份疆域
                    </div>
                  )}
                </div>
              </div>

              {/* 底部危险操作区 */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleClearNationProvinces(detailNation.id);
                  }}
                  className="w-full py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>清空疆域领土</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsNationDetailOpen(false);
                    handleDeleteNation(detailNation.id);
                  }}
                  className="w-full py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>解散该国家实体</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🌟 核心新建国家弹窗 (QuickNationCreateModal)：支持 3:2 国旗、连续建国 */}
      <QuickNationCreateModal
        isOpen={isQuickNationModalOpen}
        onClose={() => setIsQuickNationModalOpen(false)}
        existingNations={workspaceNations}
        onNationCreated={handleQuickNationCreated}
        onDeleteNation={handleDeleteNation}
        onProceedToTerritoryAllocation={() => {
          setIsQuickNationModalOpen(false);
          setActiveMode('territory');
          showToast('已进入分配疆域模式，可在地图上点选或框选省份');
        }}
      />

      {/* 移动端专属：侧栏国家完整列表抽屉 */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex justify-end md:hidden bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="w-4/5 max-w-xs h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col text-slate-800"
            >
              <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-900">国家实体管理</span>
                  <span className="text-xs text-slate-500 font-mono">({workspaceNations.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-2 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileSidebarOpen(false);
                    setIsQuickNationModalOpen(true);
                  }}
                  className="w-full py-2 rounded-xl bg-[#6C4FF6] text-white font-bold text-xs flex items-center justify-center gap-1 whitespace-nowrap shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>新建国家实体</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                {workspaceNations.map((nation) => {
                  const isSelected = nation.id === selectedNationId;
                  return (
                    <div
                      key={nation.id}
                      onClick={() => {
                        setSelectedNationId(nation.id);
                        setIsMobileSidebarOpen(false);
                        setActiveMode('territory');
                        showToast(`已切换至【${nation.name}】进行疆域划拨`);
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#F0ECFF] border-[#6C4FF6] text-[#6C4FF6]'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          style={{ aspectRatio: getAspectRatioCSS(nation.flagRatio) }}
                          className="h-5 max-w-9 rounded-xs overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center"
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
                          <h4 className="font-bold text-xs text-slate-900 truncate">{nation.name}</h4>
                          <span className="text-[10px] text-slate-500 truncate block">
                            {nation.nationType || nation.regime} · {nation.provinces?.length || 0} 省
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNation(nation.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🌟 国家排行弹窗 (Nation Ranking Modal) */}
      <AnimatePresence>
        {isRankingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-[420px] bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-800"
            >
              {/* 弹窗头部 */}
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-2xs">
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                      国家实力排行榜
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold">
                        {workspaceNations.length} 国
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-500">主权实体综合实力与地缘指标排行</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDownloadRankingPng}
                    disabled={isExportingRanking || rankingList.length === 0}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-2xs"
                    title="下载当前国家排行榜长图 (.png)"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>{isExportingRanking ? '导出中...' : '下载排行'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsRankingModalOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    title="关闭"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 维度切换 Tabs */}
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between gap-1 overflow-x-auto">
                <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-xl text-xs font-medium text-slate-600 shrink-0 w-full">
                  {[
                    { key: 'power', label: '综合国力' },
                    { key: 'provinces', label: '领土省份' },
                    { key: 'population', label: '总人口' },
                    { key: 'industry', label: '工业产能' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setRankingSortField(tab.key as any)}
                      className={`flex-1 py-1 rounded-lg transition cursor-pointer text-[11px] text-center ${
                        rankingSortField === tab.key
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 排行榜列表 - 清新卡片设计，采用真实国旗代表色，杜绝硬编码紫色 */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {rankingList.map((item, index) => {
                  const isSelected = selectedNationId === item.nation.id;
                  const rank = index + 1;
                  const topScore = rankingList[0]?.powerScore || 1;
                  const topProvs = rankingList[0]?.provinceCount || 1;
                  const topPop = rankingList[0]?.totalPop || 1;
                  const topFact = rankingList[0]?.totalFactories || 1;

                  let progressPct = 100;
                  if (rankingSortField === 'power') {
                    progressPct = Math.max(5, Math.round((item.powerScore / Math.max(1, topScore)) * 100));
                  } else if (rankingSortField === 'provinces') {
                    progressPct = Math.max(5, Math.round((item.provinceCount / Math.max(1, topProvs)) * 100));
                  } else if (rankingSortField === 'population') {
                    progressPct = Math.max(5, Math.round((item.totalPop / Math.max(1, topPop)) * 100));
                  } else if (rankingSortField === 'industry') {
                    progressPct = Math.max(5, Math.round((item.totalFactories / Math.max(1, topFact)) * 100));
                  }

                  const nationColor = item.nation.flagColor || '#3B82F6';

                  return (
                    <div
                      key={item.nation.id}
                      onClick={() => {
                        setSelectedNationId(item.nation.id);
                        setActiveMode('territory');
                        showToast(`已选中【${item.nation.name}】进行疆域划拨`);
                      }}
                      style={
                        isSelected
                          ? { borderLeftColor: nationColor, borderLeftWidth: '4px' }
                          : undefined
                      }
                      className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col gap-2 group ${
                        isSelected
                          ? 'bg-slate-50/90 border-slate-300 shadow-xs ring-1 ring-slate-300/50'
                          : 'bg-white hover:bg-slate-50/80 border-slate-200/80 shadow-2xs'
                      }`}
                    >
                      {/* 上半部：排名 + 自适应比例国旗 + 国名政体 + 快捷操作按钮 */}
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* 排名序号 */}
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${
                              rank === 1
                                ? 'bg-amber-100 border-amber-300 text-amber-900'
                                : rank === 2
                                ? 'bg-slate-100 border-slate-300 text-slate-800'
                                : rank === 3
                                ? 'bg-orange-100 border-orange-300 text-orange-900'
                                : 'bg-slate-50 border-slate-200 text-slate-500 font-mono text-[11px]'
                            }`}
                          >
                            {rank}
                          </div>

                          {/* 国旗：支持 1:1, 19:10, 1:2, 3:2 规范长宽比 */}
                          <div
                            style={{ aspectRatio: getAspectRatioCSS(item.nation.flagRatio) }}
                            className="h-6 max-w-11 rounded-sm overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs flex items-center justify-center"
                          >
                            <NationFlagDisplay
                              flagUrl={item.nation.flagUrl}
                              flagColor={item.nation.flagColor}
                              name={item.nation.name}
                              ratio={item.nation.flagRatio}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* 国名与政体 */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-xs text-slate-900 truncate">
                                {item.nation.name}
                              </span>
                              {item.nation.flagRatio && (
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-500 shrink-0 hidden sm:inline">
                                  {item.nation.flagRatio}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">
                              {item.nation.regime || item.nation.nationType || '主权国家'}
                            </p>
                          </div>
                        </div>

                        {/* 快捷操作：设置与档案 */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingNationForFullData(item.nation);
                              setIsEditFullDataOpen(true);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                            title="设置国家档案与国旗比例"
                          >
                            <SlidersHorizontal className="w-3 h-3" />
                            <span>设置</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailNationId(item.nation.id);
                              setIsNationDetailOpen(true);
                              setIsRankingModalOpen(false);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer whitespace-nowrap"
                            title="查看国家档案"
                          >
                            档案
                          </button>
                        </div>
                      </div>

                      {/* 下半部：指标数据与细进度条（采用国家真实代表色） */}
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-between text-xs font-bold text-slate-900 font-mono">
                          <span>
                            {rankingSortField === 'power' && `${item.powerScore.toLocaleString()} 分`}
                            {rankingSortField === 'provinces' && `${item.provinceCount} 省`}
                            {rankingSortField === 'population' && formatPopulation(item.totalPop)}
                            {rankingSortField === 'industry' && `${item.totalFactories} 厂 (${item.civFactories}民/${item.milFactories}军)`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {rankingSortField === 'power'
                              ? `${item.provinceCount}省 · 人口${formatPopulation(item.totalPop)} · ${item.totalFactories}厂`
                              : rankingSortField === 'provinces'
                              ? `面积约 ${(item.totalArea / 10000).toFixed(1)}万 km²`
                              : rankingSortField === 'population'
                              ? `占世界 ${globalStats.totalGlobalPop > 0 ? ((item.totalPop / globalStats.totalGlobalPop) * 100).toFixed(1) : 0}%`
                              : `民用 ${item.civFactories} · 军工 ${item.milFactories}`}
                          </span>
                        </div>

                        {/* 比例条：采用国家本身代表色 */}
                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${progressPct}%`,
                              backgroundColor: nationColor,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {rankingList.length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    当前推演剧本中暂无国家实体
                  </div>
                )}
              </div>

              {/* 弹窗底部 */}
              <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="text-[10px] text-slate-500 font-mono">
                  共 {workspaceNations.length} 国 · 实时排位
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadRankingPng}
                    disabled={isExportingRanking || rankingList.length === 0}
                    className="px-3 py-1 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>{isExportingRanking ? '导出中...' : '下载长图 (.png)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRankingModalOpen(false)}
                    className="px-3 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 对话框: 剧本切换弹窗 */}
      <AnimatePresence>
        {showScenarioSwitchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-800"
            >
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#F0ECFF] border border-[#6C4FF6]/25 flex items-center justify-center text-[#6C4FF6]">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">推演剧本管理</h3>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                    workspacesList.filter((w) => w.id !== 'ws_default_1936').length >= MAX_CREATOR_WORKSPACES
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-[#F0ECFF] text-[#6C4FF6]'
                  }`}>
                    自建配额 {workspacesList.filter((w) => w.id !== 'ws_default_1936').length} / {MAX_CREATOR_WORKSPACES}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowScenarioSwitchModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 max-h-72 overflow-y-auto space-y-1.5 custom-scrollbar">
                {workspacesList.map((ws) => {
                  const isActive = activeWorkspace?.id === ws.id;
                  const nationsCount = ws.customNations?.length || 0;
                  const isSystemDefault = ws.id === 'ws_default_1936';

                  return (
                    <div
                      key={ws.id}
                      onClick={() => handleSwitchWorkspace(ws)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                        isActive
                          ? 'bg-[#F0ECFF] border-[#6C4FF6] text-[#5737D9]'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">{ws.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                            {ws.era}
                          </span>
                          {isSystemDefault ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-400 font-medium">
                              系统预设
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-violet-100 text-violet-700 font-medium">
                              创作者自建
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {ws.description || '自定义推演沙盘'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono text-slate-500">
                          {nationsCount} 国
                        </span>
                        {isActive && <CheckCircle2 className="w-4 h-4 text-[#6C4FF6]" />}

                        {/* 自建剧本删除操作（释放创建配额） */}
                        {!isSystemDefault && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteWorkspace(ws, e)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer ml-1"
                            title="删除自建剧本以释放名额"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                {workspacesList.filter((w) => w.id !== 'ws_default_1936').length >= MAX_CREATOR_WORKSPACES ? (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>配额已满(3/3)，需删除旧剧本方可新建</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowScenarioSwitchModal(false);
                      setShowCreationWizard(true);
                    }}
                    className="flex items-center gap-1 text-xs text-[#6C4FF6] hover:text-[#5737D9] font-bold whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>新建剧本向导</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowScenarioSwitchModal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 whitespace-nowrap cursor-pointer"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 新建剧本向导 */}
      {showCreationWizard && (
        <WorkspaceCreationWizard
          isOpen={showCreationWizard}
          onClose={() => setShowCreationWizard(false)}
          onSuccess={handleWizardSuccess}
          isCreator={true}
          onOpenAuth={onOpenAuth}
        />
      )}

      {/* 通用危险/确认对话框 */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-800"
            >
              <div className="flex items-center gap-2 mb-2 text-amber-600">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <h3 className="font-bold text-xs sm:text-sm text-slate-900">{confirmDialog.title}</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {confirmDialog.message}
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition cursor-pointer whitespace-nowrap"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={confirmDialog.onConfirm}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition shadow-2xs cursor-pointer whitespace-nowrap ${
                    confirmDialog.isDangerous
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-[#6C4FF6] hover:bg-[#5737D9]'
                  }`}
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 全局 Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-white/95 border border-[#6C4FF6]/25 text-slate-800 text-xs font-semibold px-4 py-2 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2 pointer-events-none whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#6C4FF6] shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🌟 完整国家数据与国旗设置大弹窗 */}
      {editingNationForFullData && (
        <EditNationDataModal
          isOpen={isEditFullDataOpen}
          onClose={() => {
            setIsEditFullDataOpen(false);
            setEditingNationForFullData(null);
          }}
          nation={editingNationForFullData}
          onSaveNation={(updated) => {
            const nextList = workspaceNations.map((n) => (n.id === updated.id ? updated : n));
            persistNationsUpdate(nextList);
            showToast(`已成功保存【${updated.name}】的档案与国旗设置`);
          }}
          showToast={showToast}
        />
      )}

      {/* 🌟 沙盘全局设置面板（字体、地块底图颜色、省份数据与名称） */}
      {activeWorkspace && (
        <WorkspaceGlobalSettingsModal
          isOpen={isGlobalSettingsOpen}
          onClose={() => setIsGlobalSettingsOpen(false)}
          workspace={activeWorkspace}
          nations={workspaceNations}
          onUpdateNations={(updated) => {
            persistNationsUpdate(updated);
          }}
          onUpdateWorkspace={(updates) => {
            if (!activeWorkspace) return;
            const updatedWs = workspaceService.updateWorkspace(activeWorkspace.id, updates);
            setActiveWorkspace(updatedWs);
          }}
          onLocateProvince={(provId, provName) => {
            setIsGlobalSettingsOpen(false);
            const cn = getProvinceChineseName(provName || provId);
            showToast(`已锁定省份【${cn}】(#${provId})`);
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
};
