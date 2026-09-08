import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  Globe2,
  Shield,
  Layers,
  BookOpen,
  SlidersHorizontal,
  Flame,
  Zap,
  Lock,
  Eye,
  Crown,
  Share2,
  AlertCircle,
  Compass,
  Users,
  Trophy,
  Activity,
  ShieldCheck,
  Landmark,
  Anchor,
  Swords,
  Target,
  Feather,
  Flag,
  Castle,
  Info,
  LayoutGrid,
  ShieldAlert,
  Crosshair,
  Navigation,
  Scale,
  Scroll,
  Award,
  Map,
  MapPin,
  Ship,
  Mountain,
  Cog,
  Radio,
  Sun,
  Plus,
  Minus,
} from 'lucide-react';
import {
  workspaceService,
  WorkspaceItem,
  WorkspaceRulesConfig,
  MAX_CREATOR_WORKSPACES,
} from '../services/workspaceService';

interface WorkspaceCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newWorkspace: WorkspaceItem) => void;
  isCreator: boolean;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  user?: any;
}

const PRESET_ERAS = ['1936年', '1939年', '1942—1945年', '冷战时期', '21世纪初', '近未来', '架空纪元'];

// 常用首屏 12 款徽标（与设计稿严格对齐：第一行7个，第二行5个）
const PRIMARY_TOTEMS = [
  { id: 'landmark', label: '城市建筑', Icon: Landmark },
  { id: 'shield', label: '防护卫戍', Icon: Shield },
  { id: 'crown', label: '主权王冕', Icon: Crown },
  { id: 'compass', label: '航向罗盘', Icon: Compass },
  { id: 'flag', label: '立国旗帜', Icon: Flag },
  { id: 'globe', label: '地缘宏观', Icon: Globe2 },
  { id: 'anchor', label: '深蓝海权', Icon: Anchor },
  { id: 'flame', label: '燎原战火', Icon: Flame },
  { id: 'zap', label: '雷霆迅捷', Icon: Zap },
  { id: 'target', label: '战役枢纽', Icon: Target },
  { id: 'feather', label: '执笔史册', Icon: Feather },
  { id: 'castle', label: '要塞坚垒', Icon: Castle },
];

// 「更多徽标」分类扩展库（统一 Lucide 矢量线框风格）
const MORE_TOTEM_GROUPS = [
  {
    groupName: '军略与统御',
    icons: [
      { id: 'swords', label: '兵戈交锋', Icon: Swords },
      { id: 'shield-alert', label: '边境警戒', Icon: ShieldAlert },
      { id: 'crosshair', label: '战略准星', Icon: Crosshair },
      { id: 'navigation', label: '远征进击', Icon: Navigation },
    ],
  },
  {
    groupName: '权制与法典',
    icons: [
      { id: 'scale', label: '公平天平', Icon: Scale },
      { id: 'scroll', label: '和约公报', Icon: Scroll },
      { id: 'book', label: '编年史册', Icon: BookOpen },
      { id: 'award', label: '至高勋荣', Icon: Award },
    ],
  },
  {
    groupName: '疆域与探索',
    icons: [
      { id: 'map', label: '大界舆图', Icon: Map },
      { id: 'map-pin', label: '核心要冲', Icon: MapPin },
      { id: 'ship', label: '海陆巡航', Icon: Ship },
      { id: 'mountain', label: '天险关隘', Icon: Mountain },
    ],
  },
  {
    groupName: '营造与星火',
    icons: [
      { id: 'cog', label: '重工制造', Icon: Cog },
      { id: 'radio', label: '前线通讯', Icon: Radio },
      { id: 'sun', label: '日出破晓', Icon: Sun },
      { id: 'sparkles', label: '文明之光', Icon: Sparkles },
    ],
  },
];

const TOTEM_OPTIONS = [
  ...PRIMARY_TOTEMS,
  ...MORE_TOTEM_GROUPS.flatMap((g) => g.icons),
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
  // Step state: 1: 纪元与世界观 | 2: 地缘规则 | 3: 参演阵营与发布
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form states (无预设，创作者完全自主定义)
  const [name, setName] = useState('');
  const [era, setEra] = useState('1936年');
  const [customEraInput, setCustomEraInput] = useState('');
  const [scenarioType, setScenarioType] = useState<'拟实' | '架空'>('拟实');
  const [totemIcon, setTotemIcon] = useState('landmark');
  const [showMoreIcons, setShowMoreIcons] = useState(false);
  const [themeColor, setThemeColor] = useState('#6366f1');
  const [description, setDescription] = useState('');

  // Step 2 states: Rules
  const [paceMode, setPaceMode] = useState<'turn' | 'realtime' | 'free'>('turn');
  const [warTaxCap, setWarTaxCap] = useState<number>(25);
  const [conversionRate, setConversionRate] = useState<string>('15%');
  const [nukeAllowed, setNukeAllowed] = useState<boolean>(false);
  const [maxAllies, setMaxAllies] = useState<number>(3); // 默认最多3国
  const [arbitrationEnabled, setArbitrationEnabled] = useState<boolean>(true);

  // Step 3 states: Access, Victory & Launch
  const [joinPolicy, setJoinPolicy] = useState<'open' | 'apply' | 'spectate'>('open');
  const [victoryCondition, setVictoryCondition] = useState<'domination' | 'treaty' | 'endless'>('domination');
  const [initialTension, setInitialTension] = useState<number>(25);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [licenseType, setLicenseType] = useState('CC-BY-NC 自由派生');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 创作者配额检查（单个创作者最多3个剧本，超出需删除已有剧本）
  const quota = workspaceService.canCreateWorkspace(user?.id);

  if (!isOpen) return null;

  const handleNextStep = () => {
    if (!isCreator) {
      setErrorMsg('仅已注册的创作者可构筑推演沙盘，请先注册/认证创作者账户');
      return;
    }
    if (!quota.allowed) {
      setErrorMsg(`单个创作者最多创建 ${MAX_CREATOR_WORKSPACES} 个剧本。您当前已达上限（${quota.currentCount}/${MAX_CREATOR_WORKSPACES}），继续创建需要先删除已有的自建剧本。`);
      return;
    }
    if (currentStep === 1) {
      if (!name.trim()) {
        setErrorMsg('请填写剧本名称');
        return;
      }
      setErrorMsg(null);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCreator) {
      setErrorMsg('仅已注册的创作者可构筑推演沙盘，请先注册/认证创作者账户');
      return;
    }
    if (!quota.allowed) {
      setErrorMsg(`单个创作者最多创建 ${MAX_CREATOR_WORKSPACES} 个剧本。您当前已达上限（${quota.currentCount}/${MAX_CREATOR_WORKSPACES}），继续创建需要先删除已有的自建剧本。`);
      return;
    }
    if (!name.trim()) {
      setErrorMsg('剧本名称不能为空');
      return;
    }

    setIsSubmitting(true);
    try {
      const effectiveEra = customEraInput.trim() || era;

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
        coreFactions: [],
        licenseType,
        creatorId: user?.id || 'usr_creator_' + Math.random().toString(36).substring(2, 8),
        creatorName: user?.username || user?.name || '特约创作者',
      });

      onSuccess(created);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || '创建推演工作区失败，请重试');
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
        className="w-full h-full sm:h-auto sm:max-h-[92vh] max-w-2xl bg-slate-50/80 border-0 sm:border sm:border-slate-200/90 sm:rounded-2xl shadow-xl overflow-hidden flex flex-col"
      >
        {/* Header with Step Indicator */}
        <div className="relative border-b border-slate-200/80 bg-white px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/60"
              style={{ backgroundColor: `${themeColor}12`, color: themeColor }}
            >
              {(() => {
                const item = TOTEM_OPTIONS.find((t) => t.id === totemIcon) || TOTEM_OPTIONS[0];
                const IconComp = item.Icon;
                return <IconComp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75]" />;
              })()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  分步构筑推演沙盘
                </h2>
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  创作者向导
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                Step {currentStep}/3：
                {currentStep === 1 && '设定年代纪元与世界观'}
                {currentStep === 2 && '编纂地缘规则与推演参数'}
                {currentStep === 3 && '设定全球紧张度与沙盘发布'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop Step Pills */}
            <div className="hidden sm:flex items-center gap-1">
              {[
                { step: 1, label: '01 纪元世界观' },
                { step: 2, label: '02 推演规则' },
                { step: 3, label: '03 紧张度与发布' },
              ].map((item) => (
                <div
                  key={item.step}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    currentStep === item.step
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : currentStep > item.step
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {currentStep > item.step ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                      {item.step}
                    </span>
                  )}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="关闭向导"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Ultra-slim progress bar (2px) showing overall wizard advancement */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-100 overflow-hidden">
            <motion.div
              className="h-full bg-indigo-600"
              initial={false}
              animate={{ width: `${(currentStep / 3) * 100}%` }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* Not creator gate */}
        {!isCreator ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-slate-50/50">
            <div className="w-16 h-16 rounded-2xl bg-amber-100/90 text-amber-700 flex items-center justify-center shadow-xs">
              <Shield className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                创作者专属权限
              </span>
              <h3 className="text-base font-black text-slate-900">
                分步构筑推演沙盘 · 仅已注册创作者可构筑
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                创建全新独立推演沙盘涉及全局年代纪元、地缘规则法则、核武权限及主权阵营编组，仅面向平台认证创作者开放。
              </p>
              <div className="p-3 rounded-xl bg-white border border-amber-200/80 text-left text-xs text-slate-700 space-y-1 mt-3">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>普通用户如何构筑沙盘？</span>
                </div>
                <div className="text-[11px] text-slate-500 leading-normal">
                  您只需免费注册创作者账户（免人工审核），即可立即解锁分步构筑向导、发布独立推演世界观，并邀请其他领主入驻推演！
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onOpenAuth('register');
                  onClose();
                }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>立即注册/认证创作者账户（解锁向导）</span>
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
          /* Content Body */
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-4">
            {/* 创作者剧本名额配额指示条 */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-slate-700 font-medium">自建剧本配额：</span>
                <span className={`font-mono font-bold ${quota.currentCount >= MAX_CREATOR_WORKSPACES ? 'text-amber-600' : 'text-indigo-600'}`}>
                  {quota.currentCount} / {MAX_CREATOR_WORKSPACES}
                </span>
                <span className="text-[11px] text-slate-400">（单人最多 3 个）</span>
              </div>
              {!quota.allowed && (
                <span className="text-[11px] text-rose-600 font-medium bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
                  配额已满，继续创建需删除已有剧本
                </span>
              )}
            </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: 纪元与世界观 (自主定义，无预设) */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Title & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    剧本名称 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="如：欧亚大战略推演 / 新大陆自设风云"
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    剧本性质
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 h-9">
                    <button
                      type="button"
                      onClick={() => setScenarioType('拟实')}
                      className={`rounded-xl text-xs font-bold border transition cursor-pointer ${
                        scenarioType === '拟实'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      拟实历史
                    </button>
                    <button
                      type="button"
                      onClick={() => setScenarioType('架空')}
                      className={`rounded-xl text-xs font-bold border transition cursor-pointer ${
                        scenarioType === '架空'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      架空自设
                    </button>
                  </div>
                </div>
              </div>

              {/* Era Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  剧本纪元年代
                </label>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {PRESET_ERAS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setEra(item);
                        setCustomEraInput('');
                      }}
                      className={`py-1 px-2.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                        era === item && !customEraInput
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                  <div className="flex-1 min-w-[140px]">
                    <input
                      type="text"
                      placeholder="或自定义输入年份（如：1914年）"
                      value={customEraInput}
                      onChange={(e) => {
                        setCustomEraInput(e.target.value);
                        if (e.target.value) setEra(e.target.value);
                      }}
                      className="w-full h-7 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Worldview description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  剧本世界观背景公报导言
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="详细描述本推演沙盘的时代背景、阵营冲突根源、以及给参演领主的宏观战略指引..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-600 transition resize-none leading-relaxed"
                />
              </div>

              {/* 重构徽标选择器：纯白卡片底、无独立外框、克制浅紫选中态、12个常用徽标、展开更多分类 */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
                <div className="mb-4">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    选择徽标
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    选择一个代表你的沙盘
                  </p>
                </div>

                {/* 常用徽标阵列：未选中无边框无底色，仅选中显示浅紫微圆角底框 */}
                <div className="grid grid-cols-7 gap-y-4 gap-x-1 sm:gap-x-3 place-items-center py-2">
                  {PRIMARY_TOTEMS.map((item) => {
                    const IconComp = item.Icon;
                    const isSelected = totemIcon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTotemIcon(item.id)}
                        className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#f5f3ff] border border-[#d8b4fe]/70 text-[#6B50F0] rounded-2xl shadow-2xs'
                            : 'text-slate-700 hover:text-slate-950 rounded-2xl'
                        }`}
                        title={item.label}
                      >
                        <IconComp className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.75} />
                      </button>
                    );
                  })}
                </div>

                {/* 极细浅灰分割线 */}
                <div className="h-px bg-slate-100 my-4" />

                {/* 「更多徽标」触发展开 */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowMoreIcons(!showMoreIcons)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B50F0] hover:text-[#5841d8] transition cursor-pointer"
                  >
                    <LayoutGrid className="w-4 h-4 text-[#6B50F0]" />
                    <span>{showMoreIcons ? '收起更多徽标' : '更多徽标'}</span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-[#6B50F0] transition-transform duration-200 ${
                        showMoreIcons ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* 展开的更多徽标分组 */}
                {showMoreIcons && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
                    {MORE_TOTEM_GROUPS.map((group) => (
                      <div key={group.groupName}>
                        <div className="text-[11px] font-semibold text-slate-400 mb-2">
                          {group.groupName}
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-y-3 gap-x-1 sm:gap-x-3 place-items-center">
                          {group.icons.map((item) => {
                            const IconComp = item.Icon;
                            const isSelected = totemIcon === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setTotemIcon(item.id)}
                                className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#f5f3ff] border border-[#d8b4fe]/70 text-[#6B50F0] rounded-2xl shadow-2xs'
                                    : 'text-slate-700 hover:text-slate-950 rounded-2xl'
                                }`}
                                title={item.label}
                              >
                                <IconComp className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.75} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 底部自然提示语 */}
              <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 font-normal">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>徽标可在创建沙盘后随时修改</span>
              </div>

              {/* 沙盘主题色调设置卡片 */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    沙盘主题色调
                  </label>
                  <span className="text-[11px] text-slate-400">
                    用于主权疆域与推演标识色彩
                  </span>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {THEME_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setThemeColor(c.hex)}
                      className={`w-7 h-7 rounded-full transition-all flex items-center justify-center border cursor-pointer ${
                        themeColor === c.hex
                          ? 'ring-2 ring-offset-2 ring-indigo-500 border-white scale-110'
                          : 'border-black/10 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {themeColor === c.hex && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: 地缘规则与推演机制 */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Economic & Industrial Rules */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    最高战备税率上限：<span className="text-indigo-600 font-mono">{warTaxCap}%</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    影响领主战时动员与后勤产能
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={warTaxCap}
                  onChange={(e) => setWarTaxCap(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      民工转军工转换速率
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {['15%', '30%', '50%'].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setConversionRate(rate)}
                          className={`py-1 text-xs font-bold rounded-lg border transition ${
                            conversionRate === rate
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {rate}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        同盟成员上限
                      </label>
                      <span className="text-[10px] text-slate-400">
                        最多 {maxAllies} 个国家加入同一同盟
                      </span>
                    </div>
                    <div className="flex items-center justify-between h-[30px] px-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-xs font-bold text-slate-800 flex items-baseline gap-0.5">
                        <span className="font-mono text-sm text-indigo-600">{maxAllies}</span>
                        <span className="text-[11px] text-slate-500 font-normal">国</span>
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setMaxAllies((prev) => Math.max(1, prev - 1))}
                          disabled={maxAllies <= 1}
                          className="w-5 h-5 rounded bg-white hover:bg-slate-100 border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 font-bold flex items-center justify-center transition cursor-pointer shadow-2xs"
                          aria-label="减少同盟成员上限"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMaxAllies((prev) => Math.min(10, prev + 1))}
                          disabled={maxAllies >= 10}
                          className="w-5 h-5 rounded bg-white hover:bg-slate-100 border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 font-bold flex items-center justify-center transition cursor-pointer shadow-2xs"
                          aria-label="增加同盟成员上限"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nukeAllowed}
                      onChange={(e) => setNukeAllowed(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700 font-bold">允许核威慑 / 战略核研发</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={arbitrationEnabled}
                      onChange={(e) => setArbitrationEnabled(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700 font-bold">启用边境争端国际仲裁机制</span>
                  </label>
                </div>
              </div>

              {/* Scenario Overview Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  剧本世界观背景公报导言
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="详细描述本推演沙盘的时代背景、阵营冲突根源、以及给参演领主的宏观战略指引..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-600 transition resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* STEP 3: 全球紧张度与沙盘发布 */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {/* 1. 全球紧张度 */}
              <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">全球紧张度</span>
                  </div>

                  {/* Numeric & Phase Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-base font-bold font-mono text-indigo-600 tracking-tight">
                      {initialTension}%
                    </span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                        initialTension <= 35
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          : initialTension <= 70
                          ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                          : 'bg-rose-50 text-rose-700 border-rose-200/80'
                      }`}
                    >
                      {initialTension <= 35
                        ? '和平积蓄期 · 内政工农优先'
                        : initialTension <= 70
                        ? '地缘对峙期 · 军备摩擦升级'
                        : '大战前夕 · 全面战备总动员'}
                    </span>
                  </div>
                </div>

                {/* Slider with styled progress track */}
                <div className="pt-1 pb-0.5">
                  <div className="relative flex items-center">
                    <input
                      type="range"
                      min={5}
                      max={95}
                      step={5}
                      value={initialTension}
                      onChange={(e) => setInitialTension(Number(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                      style={{
                        background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${initialTension}%, #e2e8f0 ${initialTension}%, #e2e8f0 100%)`
                      }}
                    />
                  </div>

                  {/* Lightweight stage benchmark ticks */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 select-none px-0.5">
                    <span className={initialTension <= 35 ? 'text-emerald-700 font-semibold' : ''}>
                      0% 和平积蓄
                    </span>
                    <span className={initialTension > 35 && initialTension <= 70 ? 'text-amber-700 font-semibold' : ''}>
                      50% 地缘对峙
                    </span>
                    <span className={initialTension > 70 ? 'text-rose-700 font-semibold' : ''}>
                      100% 战备动员
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. 沙盘可见度 (Segmented Control) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span>沙盘可见度</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {visibility === 'public' ? '全域领主可见并可申请入驻' : '仅创建者本人在控制台可见'}
                  </span>
                </div>

                <div className="bg-slate-100 p-1 rounded-xl border border-slate-200/60 grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setVisibility('public')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      visibility === 'public'
                        ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Globe2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>公开推演沙盘</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility('private')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      visibility === 'private'
                        ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                    <span>创作者私有草稿</span>
                  </button>
                </div>
              </div>

              {/* 3. 创作者派生与知识产权许可 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-indigo-600" />
                    <span>创作者派生与知识产权许可</span>
                  </label>
                  <span className="text-[10px] text-slate-400">法律公约</span>
                </div>

                <div className="relative">
                  <select
                    value={licenseType}
                    onChange={(e) => setLicenseType(e.target.value)}
                    className="w-full h-10 px-3.5 pr-9 text-xs bg-white border border-slate-200/90 rounded-xl text-slate-900 font-medium appearance-none focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500/20 transition cursor-pointer shadow-2xs"
                  >
                    <option value="CC-BY-NC 自由派生">CC-BY-NC 自由派生与非商用创作（保留署名权）</option>
                    <option value="独家创作 保留权利">独家原创剧本（保留所有衍生修改权利）</option>
                    <option value="开源无限制派生">开源公开剧本（允许全社区自由派生演进）</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 px-0.5 leading-normal">
                  发布后沙盘即受此开源/创作公约约束，参演领主派生推演将自动继承署名条款。
                </p>
              </div>

              {/* 4. LIVE PREVIEW CARD (Publication Summary) */}
              <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 bg-white space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    沙盘发布摘要 (Publication Summary)
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${themeColor}15`, color: themeColor }}
                  >
                    {scenarioType} · {era}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-2xs shrink-0 border border-slate-200/60"
                    style={{ backgroundColor: `${themeColor}12` }}
                  >
                    {(() => {
                      const totem = TOTEM_OPTIONS.find((t) => t.id === totemIcon) || TOTEM_OPTIONS[0];
                      const IconComp = totem.Icon;
                      return <IconComp className="w-5 h-5" style={{ color: themeColor }} />;
                    })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{name}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                      {description || '暂无沙盘描述设定'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-500" />
                    <span>架构师：{user?.username || user?.name || '特约创作者'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono">
                      全球紧张度 {initialTension}%
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono">
                      战税 {warTaxCap}%
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono">
                      同盟上限 {maxAllies}国
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 font-medium">
                      {visibility === 'public' ? '公开' : '私有'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Footer actions */}
        {isCreator ? (
          <div className="sticky bottom-0 z-20 px-4 py-3 sm:px-6 sm:py-3.5 border-t border-slate-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between gap-2 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>上一步</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                取消
              </button>
            </div>

            <div>
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <span>下一步</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !quota.allowed}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {isSubmitting
                      ? '正在创世发布...'
                      : !quota.allowed
                      ? '已达3个剧本上限（需先删除已有剧本）'
                      : '立即发布推演工作区'}
                  </span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <span className="flex items-center gap-1.5 text-[11px] text-amber-800">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>仅已注册的认证创作者拥有沙盘构筑发布权限</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer border border-slate-200"
            >
              关闭
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
