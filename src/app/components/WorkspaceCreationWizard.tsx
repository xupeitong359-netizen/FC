import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Shield,
  Layers,
  BookOpen,
  SlidersHorizontal,
  Flame,
  Crown,
  AlertCircle,
  Compass,
  Users,
  Landmark,
  Anchor,
  Swords,
  Target,
  Feather,
  Castle,
  Trash2,
  Upload,
  Plus,
  Scale,
  Flag,
  RotateCcw,
  Building2,
  Factory,
} from 'lucide-react';
import {
  workspaceService,
  WorkspaceItem,
  WorkspaceRulesConfig,
  MAX_CREATOR_WORKSPACES,
} from '../services/workspaceService';
import { Nation, FlagRatio } from '../types';
import { ScenarioTimeMatrixPicker } from './ScenarioTimeMatrixPicker';
import {
  FLAG_RATIO_OPTIONS,
  PRESET_FLAG_PALETTES,
  REGIME_OPTIONS,
} from './QuickNationCreateModal';
import { NationFlagDisplay, getAspectRatioCSS } from './NationFlagDisplay';

interface WorkspaceCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newWorkspace: WorkspaceItem) => void;
  isCreator: boolean;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  user?: any;
}

const PRESET_ERAS = ['1936年', '1939年', '1942—1945年', '冷战时期', '21世纪初', '近未来', '架空纪元'];

// 常用首屏 12 款徽标
const PRIMARY_TOTEMS = [
  { id: 'landmark', label: '城市建筑', Icon: Landmark },
  { id: 'shield', label: '防护卫戍', Icon: Shield },
  { id: 'crown', label: '主权王冕', Icon: Crown },
  { id: 'compass', label: '航向罗盘', Icon: Compass },
  { id: 'anchor', label: '深海舰队', Icon: Anchor },
  { id: 'swords', label: '常备武备', Icon: Swords },
  { id: 'target', label: '战略准星', Icon: Target },
  { id: 'castle', label: '要塞核心', Icon: Castle },
  { id: 'scale', label: '秩序法度', Icon: Scale },
  { id: 'flag', label: '战线军旗', Icon: Flag },
  { id: 'book', label: '文明典籍', Icon: BookOpen },
  { id: 'feather', label: '外交国牒', Icon: Feather },
];

const THEME_COLORS = [
  { name: '经典靛蓝', hex: '#6366f1' },
  { name: '帝国绯红', hex: '#e11d48' },
  { name: '极地青霜', hex: '#0284c7' },
  { name: '琥珀古金', hex: '#d97706' },
  { name: '翡翠平原', hex: '#059669' },
  { name: '皇家紫罗兰', hex: '#7c3aed' },
  { name: '暗夜玄铁', hex: '#334155' },
];

export const WorkspaceCreationWizard: React.FC<WorkspaceCreationWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isCreator,
  onOpenAuth,
  user,
}) => {
  // 两大核心阶段：1: 剧本设置 | 2: 国家建立页
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // 剧本设置内部子标签：'basic'（纪元与世界观）| 'rules'（推演机制与规则）
  const [scenarioSubTab, setScenarioSubTab] = useState<'basic' | 'rules'>('basic');

  // 剧本基础信息
  const [name, setName] = useState('');
  const [era, setEra] = useState('1936年');
  const [customEraInput, setCustomEraInput] = useState('');
  const [scenarioType, setScenarioType] = useState<'拟实' | '架空'>('拟实');
  const [totemIcon, setTotemIcon] = useState('landmark');
  const [themeColor, setThemeColor] = useState('#6366f1');
  const [description, setDescription] = useState('');

  // 剧本地缘规则与推演参数
  const [paceMode, setPaceMode] = useState<'turn' | 'realtime' | 'free'>('turn');
  const [warTaxCap, setWarTaxCap] = useState<number>(25);
  const [conversionRate, setConversionRate] = useState<string>('15%');
  const [nukeAllowed, setNukeAllowed] = useState<boolean>(false);
  const [maxAllies, setMaxAllies] = useState<number>(3);
  const [arbitrationEnabled, setArbitrationEnabled] = useState<boolean>(true);
  const [joinPolicy, setJoinPolicy] = useState<'open' | 'apply' | 'spectate'>('open');
  const [victoryCondition, setVictoryCondition] = useState<'domination' | 'treaty' | 'endless'>('domination');
  const [initialTension, setInitialTension] = useState<number>(25);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [licenseType, setLicenseType] = useState('CC-BY-NC 自由派生');

  // 国家建立页状态（第 2 阶段）
  const [stagedNations, setStagedNations] = useState<Nation[]>([]);
  const [nationName, setNationName] = useState('');
  const [nationShortName, setNationShortName] = useState('');
  const [selectedFlagRatio, setSelectedFlagRatio] = useState<FlagRatio>('3:2');
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState<number>(0);
  const [customColor, setCustomColor] = useState('');
  const [uploadedFlagUrl, setUploadedFlagUrl] = useState<string | null>(null);
  const [selectedRegimeIndex, setSelectedRegimeIndex] = useState<number>(0);
  const [capitalCity, setCapitalCity] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [initialManpower, setInitialManpower] = useState<number>(100000);
  const [civilianFactoriesCount, setCivilianFactoriesCount] = useState<number>(12);
  const [militaryFactoriesCount, setMilitaryFactoriesCount] = useState<number>(8);
  const [nationDesc, setNationDesc] = useState('');
  const [nationSuccessMsg, setNationSuccessMsg] = useState<string | null>(null);

  // 配额自救管理浮层
  const [showQuotaManager, setShowQuotaManager] = useState(false);
  const [quotaRefreshKey, setQuotaRefreshKey] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 创作者配额
  const quota = workspaceService.canCreateWorkspace(user?.id);
  const creatorWorkspaces = workspaceService.getCreatorWorkspaces(user?.id);

  if (!isOpen) return null;

  // 上传国旗处理
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('请上传有效的图片格式文件 (PNG, JPG, SVG, WebP)');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg('国旗图片大小请控制在 4MB 以内');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setUploadedFlagUrl(result);
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // 暂存一个国家实体
  const handleStageCurrentNation = () => {
    const trimmed = nationName.trim();
    if (!trimmed) {
      setErrorMsg('请先输入国家名称再暂存');
      return;
    }

    const regimeOpt = REGIME_OPTIONS[selectedRegimeIndex];
    const palette = PRESET_FLAG_PALETTES[selectedPaletteIndex];
    const finalFlagColor = customColor || palette?.color || '#1D4ED8';
    const effectiveEra = customEraInput.trim() || era;

    const newNation: Nation = {
      id: `nation_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ownerId: user?.id || 'usr_commander',
      ownerUsername: user?.username || user?.name || '领主创作者',
      ownerDouyinName: user?.douyinName || '',
      name: trimmed,
      shortName: nationShortName.trim() || trimmed.slice(0, 2),
      nationType: regimeOpt.label,
      regime: regimeOpt.regime,
      ideology: regimeOpt.ideology,
      flagColor: finalFlagColor,
      flagUrl: uploadedFlagUrl || undefined,
      flagRatio: selectedFlagRatio,
      capital: capitalCity.trim() || '未定都',
      territory: '0 省份（待勘定划拨）',
      description: nationDesc.trim() || `${trimmed} 是推演剧本【${name || '粉陆推演'}】(${effectiveEra}) 的参演主权实体。`,
      language: '中文',
      currency: '金币',
      currencyRate: 1,
      nameFont: 'sans',
      emblemIcon: 'flag',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      provinces: [],
      stabilityIndex: 85,
      policyPoints: 100,
      civilianFactories: civilianFactoriesCount,
      militaryFactories: militaryFactoriesCount,
      militaryIndustry: {
        productionLines: [],
        customDesigns: [],
        stockpiles: {},
      },
      army: {
        divisions: [],
        manpowerReserve: initialManpower,
        armyExperience: 20,
        generals: [
          {
            id: 'gen_1',
            name: leaderName.trim() || '最高统帅',
            rank: '元帅',
            attackBonus: 10,
            defenseBonus: 10,
          },
        ],
      },
    };

    setStagedNations((prev) => [...prev, newNation]);
    setNationSuccessMsg(`参演国家【${trimmed}】已暂存！可继续构筑下一个或完成发布。`);
    setErrorMsg(null);

    // 清空表单准备创建下一个
    setNationName('');
    setNationShortName('');
    setCapitalCity('');
    setLeaderName('');
    setNationDesc('');
    setUploadedFlagUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // 轮换下一个配色
    setSelectedPaletteIndex((prev) => (prev + 1) % PRESET_FLAG_PALETTES.length);
  };

  // 删除已暂存的国家
  const handleRemoveStagedNation = (nationId: string) => {
    setStagedNations((prev) => prev.filter((n) => n.id !== nationId));
  };

  // 删除已有自建剧本以释放名额
  const handleDeleteExistingWorkspace = (wsId: string) => {
    const res = workspaceService.deleteWorkspace(wsId);
    if (res.success) {
      setQuotaRefreshKey((k) => k + 1);
      setErrorMsg(null);
    } else {
      setErrorMsg(res.message || '删除失败');
    }
  };

  // 下一步：前往国家建立页
  const handleProceedToNationCreation = () => {
    if (!isCreator) {
      setErrorMsg('仅已注册的创作者可构筑推演沙盘，请先注册/认证创作者账户');
      return;
    }
    if (!quota.allowed) {
      setErrorMsg(`单个创作者最多创建 ${MAX_CREATOR_WORKSPACES} 个剧本。当前已达上限，请先在下方删除已有剧本以释放配额。`);
      return;
    }
    if (!name.trim()) {
      setErrorMsg('请填写剧本名称');
      setScenarioSubTab('basic');
      return;
    }
    setErrorMsg(null);
    setCurrentStep(2);
  };

  // 提交完成构筑并启动推演
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCreator) {
      setErrorMsg('仅已注册的创作者可构筑推演沙盘，请先注册/认证创作者账户');
      return;
    }
    if (!quota.allowed) {
      setErrorMsg(`单个创作者最多创建 ${MAX_CREATOR_WORKSPACES} 个剧本。当前已达上限，请先删除已有自建剧本。`);
      return;
    }
    if (!name.trim()) {
      setErrorMsg('剧本名称不能为空');
      setCurrentStep(1);
      setScenarioSubTab('basic');
      return;
    }

    setIsSubmitting(true);
    try {
      const effectiveEra = customEraInput.trim() || era;

      // 组装最终国家列表
      let finalNations = [...stagedNations];

      // 如果当前表单中输入了国家名称但尚未点击“暂存”，自动将其作为国家加入
      const currentInputName = nationName.trim();
      if (currentInputName) {
        const regimeOpt = REGIME_OPTIONS[selectedRegimeIndex];
        const palette = PRESET_FLAG_PALETTES[selectedPaletteIndex];
        const finalFlagColor = customColor || palette?.color || '#1D4ED8';

        const autoNation: Nation = {
          id: `nation_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          ownerId: user?.id || 'usr_commander',
          ownerUsername: user?.username || user?.name || '领主创作者',
          ownerDouyinName: user?.douyinName || '',
          name: currentInputName,
          shortName: nationShortName.trim() || currentInputName.slice(0, 2),
          nationType: regimeOpt.label,
          regime: regimeOpt.regime,
          ideology: regimeOpt.ideology,
          flagColor: finalFlagColor,
          flagUrl: uploadedFlagUrl || undefined,
          flagRatio: selectedFlagRatio,
          capital: capitalCity.trim() || '未定都',
          territory: '0 省份（待勘定划拨）',
          description: nationDesc.trim() || `${currentInputName} 是推演剧本【${name.trim()}】的初始参演国家。`,
          language: '中文',
          currency: '金币',
          currencyRate: 1,
          nameFont: 'sans',
          emblemIcon: 'flag',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          provinces: [],
          stabilityIndex: 85,
          policyPoints: 100,
          civilianFactories: civilianFactoriesCount,
          militaryFactories: militaryFactoriesCount,
          militaryIndustry: {
            productionLines: [],
            customDesigns: [],
            stockpiles: {},
          },
          army: {
            divisions: [],
            manpowerReserve: initialManpower,
            armyExperience: 20,
            generals: [
              {
                id: 'gen_1',
                name: leaderName.trim() || '最高统帅',
                rank: '元帅',
                attackBonus: 10,
                defenseBonus: 10,
              },
            ],
          },
        };
        finalNations.push(autoNation);
      }

      // 若创作者完全未建国家，自动生成一个基于剧本名称的默认首个母国实体
      if (finalNations.length === 0) {
        const defaultName = `${name.trim()}国`;
        finalNations.push({
          id: `nation_${Date.now()}_default`,
          ownerId: user?.id || 'usr_commander',
          ownerUsername: user?.username || user?.name || '领主创作者',
          ownerDouyinName: user?.douyinName || '',
          name: defaultName,
          shortName: defaultName.slice(0, 2),
          nationType: '民主共和国',
          regime: '民主议会制',
          ideology: '自由民主主义',
          flagColor: themeColor,
          flagRatio: '3:2',
          capital: '未定都',
          territory: '0 省份（待勘定划拨）',
          description: `推演剧本【${name.trim()}】的基石参演实体。`,
          language: '中文',
          currency: '金币',
          currencyRate: 1,
          nameFont: 'sans',
          emblemIcon: 'landmark',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          provinces: [],
        });
      }

      const created = workspaceService.createWorkspace({
        name: name.trim(),
        era: effectiveEra,
        visibility,
        description: description.trim(),
        scenarioType,
        scenarioName: name.trim(),
        scenarioEra: effectiveEra,
        scenarioDesc: description.trim(),
        totemIcon,
        themeColor,
        rulesConfig: {
          paceMode,
          warTaxCap,
          conversionRate,
          nukeAllowed,
          maxAllies,
          arbitrationEnabled,
          joinPolicy,
          victoryCondition,
          initialTension,
        },
        joinPolicy,
        victoryCondition,
        initialTension,
        coreFactions: finalNations.map((n) => n.name),
        customNations: finalNations,
        licenseType,
        creatorId: user?.id || 'usr_creator_' + Math.random().toString(36).substring(2, 8),
        creatorName: user?.username || user?.name || '特约创作者',
      });

      onSuccess(created);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || '创建推演沙盘失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 6 }}
        transition={{ duration: 0.2 }}
        className="w-full h-full sm:h-auto sm:max-h-[92vh] max-w-3xl bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200/90 select-none"
      >
        {/* 顶部标题栏与步骤指示器：严格先剧本设置，再国家建立页 */}
        <div className="border-b border-slate-200/80 bg-white px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/60"
              style={{ backgroundColor: `${themeColor}12`, color: themeColor }}
            >
              {(() => {
                const item = PRIMARY_TOTEMS.find((t) => t.id === totemIcon) || PRIMARY_TOTEMS[0];
                const IconComp = item.Icon;
                return <IconComp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75]" />;
              })()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  {currentStep === 1 ? '构筑推演沙盘 · 剧本配置' : '构筑推演沙盘 · 国家建立'}
                </h2>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  创作者向导
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {currentStep === 1 ? '设定年代纪元、世界观背景公报与地缘推演规则' : '为本剧本构筑参演国家实体（政体、国旗与初始国力）'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer shrink-0"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 权限提示：若非创作者 */}
        {!isCreator ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-900">需创作者身份认证</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                自建推演剧本和构筑参演国家属于创作者专属权限。请先注册或登录创作者账户后继续。
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                注册成为创作者
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                返回沙盘
              </button>
            </div>
          </div>
        ) : (
          /* 主体内容滚动区 */
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-4">
            {/* 配额状态指示条与快捷释放 */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-slate-700 font-medium">自建剧本配额：</span>
                  <span
                    className={`font-mono font-bold ${
                      quota.currentCount >= MAX_CREATOR_WORKSPACES ? 'text-amber-600' : 'text-indigo-600'
                    }`}
                  >
                    {quota.currentCount} / {MAX_CREATOR_WORKSPACES}
                  </span>
                  <span className="text-[11px] text-slate-400">（单人最多 3 个）</span>
                </div>

                <div className="flex items-center gap-2">
                  {!quota.allowed ? (
                    <span className="text-[11px] text-rose-600 font-medium bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
                      配额已满，需删除已有剧本
                    </span>
                  ) : null}

                  {creatorWorkspaces.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowQuotaManager(!showQuotaManager)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                    >
                      {showQuotaManager ? '收起管理' : '管理/删除已有自建剧本'}
                    </button>
                  )}
                </div>
              </div>

              {/* 展开的已有剧本清理面板 */}
              {showQuotaManager && (
                <div className="mt-2 pt-2 border-t border-slate-200 space-y-1.5">
                  <p className="text-[11px] text-slate-500">点击垃圾桶可删除测试剧本以释放名额：</p>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {creatorWorkspaces.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <span className="font-bold text-slate-800 truncate block">{w.name}</span>
                          <span className="text-[10px] text-slate-400">{w.era} · {w.customNations?.length || 0}国</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteExistingWorkspace(w.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="删除该剧本释放名额"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 错误提示 */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 提示消息 */}
            {nationSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 shrink-0" />
                <span>{nationSuccessMsg}</span>
              </div>
            )}

            {/* ======================================================== */}
            {/* 🌟 阶段一：【剧本设置】 */}
            {/* ======================================================== */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                {/* 剧本设置内部子页签 */}
                <div className="flex border-b border-slate-200 gap-4">
                  <button
                    type="button"
                    onClick={() => setScenarioSubTab('basic')}
                    className={`pb-2.5 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
                      scenarioSubTab === 'basic'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>年代纪元与世界观</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScenarioSubTab('rules')}
                    className={`pb-2.5 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
                      scenarioSubTab === 'rules'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>地缘规则与推演机制</span>
                  </button>
                </div>

                {/* 子页 1: 纪元与世界观 */}
                {scenarioSubTab === 'basic' && (
                  <div className="space-y-4">
                    {/* 剧本名称与性质 */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          剧本名称 <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="如：欧亚大战推演 / 新大陆自设风云"
                          maxLength={30}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">剧本性质</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(['拟实', '架空'] as const).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setScenarioType(type)}
                              className={`py-2 px-2 text-xs font-semibold rounded-xl border transition cursor-pointer text-center ${
                                scenarioType === type
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {type === '拟实' ? '拟实历史' : '架空自设'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 现代化的推演时间与纪元设置组件 */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          剧本启幕时间与纪元标定 <span className="text-rose-500">*</span>
                        </label>
                      </div>
                      <ScenarioTimeMatrixPicker
                        value={customEraInput.trim() || era}
                        onChange={(newEra) => {
                          setEra(newEra);
                          setCustomEraInput('');
                        }}
                        onContextSelect={(contextSummary) => {
                          if (!description.trim()) {
                            setDescription(contextSummary);
                          }
                        }}
                      />
                    </div>

                    {/* 剧本世界观背景公报导言 */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        剧本世界观背景公报导言
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="详细描述本推演沙盘的时代背景、阵营冲突根源、以及给参演领主的宏观战略指引..."
                        rows={3}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition resize-none"
                      />
                    </div>

                    {/* 选择徽标与沙盘主题色调 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">选择徽标</label>
                        <div className="grid grid-cols-6 gap-1.5">
                          {PRIMARY_TOTEMS.map((item) => {
                            const IconComp = item.Icon;
                            const isSelected = totemIcon === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setTotemIcon(item.id)}
                                className={`p-2 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-2xs'
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                                title={item.label}
                              >
                                <IconComp className="w-4 h-4" />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">沙盘主题色调</label>
                        <div className="flex flex-wrap gap-2">
                          {THEME_COLORS.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => setThemeColor(c.hex)}
                              className={`w-7 h-7 rounded-full border transition cursor-pointer flex items-center justify-center ${
                                themeColor === c.hex
                                  ? 'border-slate-800 scale-110 shadow-xs ring-2 ring-indigo-200'
                                  : 'border-slate-200 hover:scale-105'
                              }`}
                              style={{ backgroundColor: c.hex }}
                              title={c.name}
                            >
                              {themeColor === c.hex && <Check className="w-3.5 h-3.5 text-white" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 子页 2: 推演规则与地缘机制 */}
                {scenarioSubTab === 'rules' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* 推进节奏 */}
                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                        <label className="block text-xs font-bold text-slate-800">推进节奏模式</label>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { id: 'turn', label: '标准回合制' },
                            { id: 'realtime', label: '实时推演' },
                            { id: 'free', label: '自由沙盒' },
                          ].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setPaceMode(m.id as any)}
                              className={`py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer text-center ${
                                paceMode === m.id
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 最高战备税率 */}
                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                          <span>最高战备税率上限</span>
                          <span className="font-mono text-indigo-600">{warTaxCap}%</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={50}
                          step={5}
                          value={warTaxCap}
                          onChange={(e) => setWarTaxCap(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>10% (轻徭)</span>
                          <span>30% (战时)</span>
                          <span>50% (总动员)</span>
                        </div>
                      </div>

                      {/* 转换速率 */}
                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                        <label className="block text-xs font-bold text-slate-800">民工转军工转换速率</label>
                        <div className="grid grid-cols-4 gap-1">
                          {['10%', '15%', '25%', '40%'].map((rate) => (
                            <button
                              key={rate}
                              type="button"
                              onClick={() => setConversionRate(rate)}
                              className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition cursor-pointer text-center ${
                                conversionRate === rate
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {rate}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 同盟成员上限 */}
                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                        <label className="block text-xs font-bold text-slate-800">同盟成员国上限</label>
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { num: 0, label: '无上限' },
                            { num: 2, label: '双边(2国)' },
                            { num: 3, label: '三方(3国)' },
                            { num: 5, label: '多边(5国)' },
                          ].map((opt) => (
                            <button
                              key={opt.num}
                              type="button"
                              onClick={() => setMaxAllies(opt.num)}
                              className={`py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer text-center ${
                                maxAllies === opt.num
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 开关选项：核威慑与国际仲裁 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <label className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between cursor-pointer hover:bg-slate-50 transition">
                        <div>
                          <div className="text-xs font-bold text-slate-800">允许核威慑与终极战略武器</div>
                          <div className="text-[11px] text-slate-400">开启后各大阵营可研发战略打击能力</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={nukeAllowed}
                          onChange={(e) => setNukeAllowed(e.target.checked)}
                          className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                        />
                      </label>

                      <label className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between cursor-pointer hover:bg-slate-50 transition">
                        <div>
                          <div className="text-xs font-bold text-slate-800">启用边境争端国际仲裁机制</div>
                          <div className="text-[11px] text-slate-400">领土争议优先进入外交公投或条约仲裁</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={arbitrationEnabled}
                          onChange={(e) => setArbitrationEnabled(e.target.checked)}
                          className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                        />
                      </label>
                    </div>

                    {/* 全球紧张度与可见度 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                          <span className="flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-rose-500" />
                            <span>初始全球紧张度</span>
                          </span>
                          <span className="font-mono text-rose-600">{initialTension}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={initialTension}
                          onChange={(e) => setInitialTension(Number(e.target.value))}
                          className="w-full accent-rose-600 cursor-pointer"
                        />
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                        <label className="block text-xs font-bold text-slate-800">沙盘公开可见度</label>
                        <div className="grid grid-cols-2 gap-1">
                          <button
                            type="button"
                            onClick={() => setVisibility('public')}
                            className={`py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer text-center ${
                              visibility === 'public'
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            公开（入库万国大厅）
                          </button>
                          <button
                            type="button"
                            onClick={() => setVisibility('private')}
                            className={`py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer text-center ${
                              visibility === 'private'
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            私密（仅创作者可见）
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* 🌟 阶段二：【国家建立页】 */}
            {/* ======================================================== */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                {/* 顶部指引 */}
                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                      <Flag className="w-3.5 h-3.5 text-indigo-600" />
                      <span>为剧本【{name || '推演沙盘'}】建立参演国家实体</span>
                    </div>
                    <p className="text-[11px] text-indigo-700 mt-0.5 leading-relaxed">
                      您可在此建立首个母国或连续构筑多个参演大国势力。发布后即可直接进入地图划拔省份疆域。
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100/80 text-indigo-800 shrink-0 font-bold">
                    已建立 {stagedNations.length} 国
                  </span>
                </div>

                {/* 已暂存国家横向列表（若有） */}
                {stagedNations.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700">已构筑的参演国家：</span>
                    <div className="flex flex-wrap gap-2">
                      {stagedNations.map((n) => (
                        <div
                          key={n.id}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs"
                        >
                          <div
                            style={{ aspectRatio: getAspectRatioCSS(n.flagRatio) }}
                            className="h-4.5 rounded-sm overflow-hidden border border-slate-200"
                          >
                            <NationFlagDisplay
                              flagUrl={n.flagUrl}
                              flagColor={n.flagColor}
                              name={n.name}
                              ratio={n.flagRatio}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-800">{n.name}</span>
                          <span className="text-[10px] text-slate-400">({n.regime})</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveStagedNation(n.id)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer ml-1"
                            title="删除该国家"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 国家建立表单 */}
                <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>构筑参演国家实体</span>
                    </h4>
                  </div>

                  {/* 国家名称与简称 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        国家全称 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={nationName}
                        onChange={(e) => setNationName(e.target.value)}
                        placeholder="如：索拉利亚第一共和国 / 东方联合帝国"
                        maxLength={24}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">国家简称</label>
                      <input
                        type="text"
                        value={nationShortName}
                        onChange={(e) => setNationShortName(e.target.value)}
                        placeholder="如：索 / SOL"
                        maxLength={6}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  {/* 国旗比例与国旗外观 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">国旗比例标准</label>
                      <span className="text-[10px] text-slate-400">标准推演旗帜长宽比</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {FLAG_RATIO_OPTIONS.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedFlagRatio(item.id)}
                          className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                            selectedFlagRatio === item.id
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-2xs font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-xs font-mono font-bold">{item.label}</div>
                          <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 国旗代表色与上传 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">国旗代表色调</label>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_FLAG_PALETTES.map((palette, idx) => {
                          const isSelected = selectedPaletteIndex === idx && !customColor;
                          return (
                            <button
                              key={palette.id}
                              type="button"
                              onClick={() => {
                                setSelectedPaletteIndex(idx);
                                setCustomColor('');
                              }}
                              className={`w-6.5 h-6.5 rounded-full border transition cursor-pointer flex items-center justify-center ${
                                isSelected
                                  ? 'border-slate-800 scale-110 shadow-xs ring-2 ring-indigo-200'
                                  : 'border-slate-200 hover:scale-105'
                              }`}
                              style={{ backgroundColor: palette.color }}
                              title={palette.name}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 上传自定义国旗 */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">上传国旗图片</label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadedFlagUrl ? '更换国旗图片' : '上传本地国旗'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 实时国旗预览 */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        style={{ aspectRatio: getAspectRatioCSS(selectedFlagRatio) }}
                        className="h-10 rounded-md overflow-hidden bg-slate-100 border border-slate-300 shadow-2xs flex items-center justify-center"
                      >
                        <NationFlagDisplay
                          flagUrl={uploadedFlagUrl || undefined}
                          flagColor={customColor || PRESET_FLAG_PALETTES[selectedPaletteIndex]?.color}
                          name={nationName || '新国家'}
                          ratio={selectedFlagRatio}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {nationName.trim() || '国家名称预览'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {FLAG_RATIO_OPTIONS.find((r) => r.id === selectedFlagRatio)?.label} 比例 ·{' '}
                          {uploadedFlagUrl ? '自定义国旗' : PRESET_FLAG_PALETTES[selectedPaletteIndex]?.name}
                        </div>
                      </div>
                    </div>

                    {uploadedFlagUrl && (
                      <button
                        type="button"
                        onClick={() => setUploadedFlagUrl(null)}
                        className="text-[10px] text-rose-500 hover:text-rose-700 cursor-pointer"
                      >
                        清除图片使用色块
                      </button>
                    )}
                  </div>

                  {/* 政体制度与意识形态 */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">政体制度与意识形态</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {REGIME_OPTIONS.map((item, idx) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setSelectedRegimeIndex(idx)}
                          className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                            selectedRegimeIndex === idx
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-2xs font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-xs font-bold">{item.label}</div>
                          <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 法定都城与统治者 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">法定都城名称</label>
                      <input
                        type="text"
                        value={capitalCity}
                        onChange={(e) => setCapitalCity(e.target.value)}
                        placeholder="如：君士坦丁 / 洛林堡 / 待勘定"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">最高领袖称谓</label>
                      <input
                        type="text"
                        value={leaderName}
                        onChange={(e) => setLeaderName(e.target.value)}
                        placeholder="如：大总督 / 护国元帅 / 执政官"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  {/* 快捷暂存按钮 */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleStageCurrentNation}
                      className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>暂存并继续构筑下一个国家</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 底部操作工具栏 */}
        {isCreator && (
          <div className="border-t border-slate-200/80 bg-white px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>上一步：修改剧本设置</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                取消
              </button>
            </div>

            <div className="flex items-center gap-2">
              {currentStep === 1 ? (
                <button
                  type="button"
                  onClick={handleProceedToNationCreation}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <span>下一步：国家建立页</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !quota.allowed}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {isSubmitting
                      ? '正在构筑发布...'
                      : !quota.allowed
                      ? '配额已满（需先删除旧剧本）'
                      : '完成构筑并启动推演'}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
