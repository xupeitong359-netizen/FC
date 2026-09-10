import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Upload,
  Plus,
  ArrowRight,
  Trash2,
  Check,
  Flag,
  Globe2,
  CheckCircle2,
  Image as ImageIcon,
  Palette,
  ChevronDown,
} from 'lucide-react';
import { Nation, RegimeType, IdeologyType, FlagRatio } from '../types';
import { NationFlagDisplay, getAspectRatioCSS } from './NationFlagDisplay';
import { IntentColorPicker } from './IntentColorPicker';

interface QuickNationCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingNations: Nation[];
  onNationCreated: (nation: Nation) => void;
  onDeleteNation?: (nationId: string) => void;
  onProceedToTerritoryAllocation: () => void;
}

export const FLAG_RATIO_OPTIONS: { id: FlagRatio; label: string; desc: string }[] = [
  { id: '3:2', label: '3:2', desc: '中法德等国标比例 (3:2)' },
  { id: '19:10', label: '19:10', desc: '美利坚等典范比例 (19:10)' },
  { id: '1:2', label: '1:2', desc: '英国及英联邦海旗 (1:2)' },
  { id: '1:1', label: '1:1', desc: '瑞士与梵蒂冈方旗 (1:1)' },
];

// 优化精选符合大国沙盘与地缘推演质感的国家代表色调 (经典10色)
export const PRESET_FLAG_PALETTES = [
  { id: 'flag_navy', name: '普鲁士蓝', color: '#1D4ED8', bg: '#EFF6FF', border: '#93C5FD' },
  { id: 'flag_red', name: '朱砂红', color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5' },
  { id: 'flag_purple', name: '帝国紫', color: '#6D28D9', bg: '#F5F3FF', border: '#C4B5FD' },
  { id: 'flag_emerald', name: '苍松绿', color: '#047857', bg: '#ECFDF5', border: '#6EE7B7' },
  { id: 'flag_amber', name: '琥珀金', color: '#D97706', bg: '#FFFBEB', border: '#FCD34D' },
  { id: 'flag_teal', name: '远洋青', color: '#0F766E', bg: '#F0FDFA', border: '#5EEAD4' },
  { id: 'flag_rose', name: '玫瑰绯', color: '#BE123C', bg: '#FFF1F2', border: '#FDA4AF' },
  { id: 'flag_slate', name: '曜石黑', color: '#1E293B', bg: '#F8FAFC', border: '#CBD5E1' },
  { id: 'flag_sky', name: '天青蓝', color: '#0284C7', bg: '#F0F9FF', border: '#7DD3FC' },
  { id: 'flag_iron', name: '苍铁灰', color: '#475569', bg: '#F1F5F9', border: '#94A3B8' },
];

// 进阶扩展地缘推演色调 (无需触发原生弹出层，彻底杜绝UI上移与跳动)
export const EXTENDED_FLAG_PALETTES = [
  { id: 'ext_crimson', name: '暗绛红', color: '#991B1B' },
  { id: 'ext_orange', name: '赤橙', color: '#EA580C' },
  { id: 'ext_bronze', name: '古铜金', color: '#B45309' },
  { id: 'ext_yellow', name: '缃黄', color: '#CA8A04' },
  { id: 'ext_olive', name: '橄榄绿', color: '#4D7C0F' },
  { id: 'ext_forest', name: '深林绿', color: '#065F46' },
  { id: 'ext_deep_sea', name: '深海青', color: '#1E40AF' },
  { id: 'ext_indigo', name: '群青靛', color: '#4338CA' },
  { id: 'ext_mystic', name: '玄紫', color: '#7E22CE' },
  { id: 'ext_peacock', name: '孔雀绿', color: '#0D9488' },
];

// 政体选项（规范无 Emoji，专业地缘政治用语）
export const REGIME_OPTIONS: { label: string; regime: RegimeType; ideology: IdeologyType; desc: string }[] = [
  {
    label: '民主共和国',
    regime: '民主议会制',
    ideology: '自由民主主义',
    desc: '多党竞选与宪政议会代表制',
  },
  {
    label: '君主立宪制',
    regime: '君主立宪制',
    ideology: '自由民主主义',
    desc: '世袭元首与现代责任内阁执政',
  },
  {
    label: '社群代表制',
    regime: '苏维埃代表制',
    ideology: '社群社会主义',
    desc: '联合代表委员会与国家动员规划',
  },
  {
    label: '军国统帅制',
    regime: '军政府/军国主义',
    ideology: '扩张威权主义',
    desc: '统帅部参谋官署集中战术治理',
  },
  {
    label: '自由城邦同盟',
    regime: '自由城邦自治',
    ideology: '自由民主主义',
    desc: '商贸关口自治与城邦议会联邦',
  },
  {
    label: '传统宗主帝国',
    regime: '封建帝国',
    ideology: '民族传统主义',
    desc: '诸侯拱卫与天下法度世袭秩序',
  },
];

export const QuickNationCreateModal: React.FC<QuickNationCreateModalProps> = ({
  isOpen,
  onClose,
  existingNations,
  onNationCreated,
  onDeleteNation,
  onProceedToTerritoryAllocation,
}) => {
  // 表单状态
  const [nickname, setNickname] = useState('');
  const [selectedRegimeIndex, setSelectedRegimeIndex] = useState(0);
  const [uploadedFlagUrl, setUploadedFlagUrl] = useState<string | null>(null);
  const [selectedFlagRatio, setSelectedFlagRatio] = useState<FlagRatio>('3:2');
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState(0);
  const [customColor, setCustomColor] = useState<string | null>(null);
  const [showMoreColors, setShowMoreColors] = useState(false);
  const [hexInputText, setHexInputText] = useState('');
  const [recentCreatedSuccessMsg, setRecentCreatedSuccessMsg] = useState<string | null>(null);
  const [keepOpenAfterCreate, setKeepOpenAfterCreate] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 自定义 Hex 颜色输入处理 (纯文本输入，无原生弹窗与滚动干扰)
  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.trim();
    if (!val.startsWith('#') && val.length > 0) {
      val = '#' + val;
    }
    setHexInputText(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val)) {
      setCustomColor(val);
    }
  };

  // 图片文件解析逻辑 (支持 3:2 严格裁剪/保持)
  const processImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传有效的图片格式文件 (PNG, JPG, SVG, WebP)');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      alert('国旗图片大小请控制在 4MB 以内');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setUploadedFlagUrl(result);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // 提交建国
  const handleCreateNation = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = nickname.trim();
    if (!finalName) {
      alert('请输入国家昵称');
      return;
    }

    const regimeOpt = REGIME_OPTIONS[selectedRegimeIndex];
    const palette = PRESET_FLAG_PALETTES[selectedPaletteIndex];
    const finalFlagColor = customColor || palette?.color || '#1D4ED8';

    const newNation: Nation = {
      id: `nation_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ownerId: 'user_commander',
      name: finalName,
      shortName: finalName.slice(0, 2),
      nationType: regimeOpt.label,
      regime: regimeOpt.regime,
      ideology: regimeOpt.ideology,
      flagColor: finalFlagColor,
      flagUrl: uploadedFlagUrl || undefined,
      flagRatio: selectedFlagRatio,
      provinces: [],
      capital: '待勘定',
      territory: '0 个省份',
      description: `${finalName} 是一个遵循${regimeOpt.label}秩序的主权国家实体。`,
      language: '通用语',
      currency: '金圆券',
      emblemIcon: 'Crown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerUsername: '指挥官',
      ownerDouyinName: '指挥官',
      stabilityIndex: 100,
      policyPoints: 150,
      civilianFactories: 0,
      militaryFactories: 0,
      army: {
        divisions: [],
        manpowerReserve: 50000,
        armyExperience: 10,
        generals: [],
      },
    };

    onNationCreated(newNation);

    // 提示反馈并重置输入
    setRecentCreatedSuccessMsg(`国家「${finalName}」已成功创立！`);
    setNickname('');
    setUploadedFlagUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // 轮换下一个配色并重置自定义颜色
    setSelectedPaletteIndex((prev) => (prev + 1) % PRESET_FLAG_PALETTES.length);
    setCustomColor(null);
    setHexInputText('');

    if (!keepOpenAfterCreate) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        className="w-full max-w-lg max-h-[92vh] bg-white/98 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800"
      >
        {/* 顶部标题栏 */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-slate-50/80 via-white to-purple-50/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#F0ECFF] border border-[#6C4FF6]/25 flex items-center justify-center text-[#6C4FF6] shrink-0 shadow-xs">
              <Globe2 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">新建国家实体</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F0ECFF] text-[#6C4FF6] border border-[#6C4FF6]/20 shrink-0">
                  工作台模式
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                设定国名、政体与国旗，随时进入疆域划分
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center justify-center cursor-pointer shrink-0"
            title="关闭窗口"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 滚动表单区域 */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 custom-scrollbar flex-1">
          {/* 创建成功实时反馈条 */}
          <AnimatePresence>
            {recentCreatedSuccessMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -6 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold truncate">{recentCreatedSuccessMsg}</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-medium whitespace-nowrap">
                  已保存在本工作区
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleCreateNation} className="space-y-4">
            {/* 1. 国家昵称 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span>国家全称 / 昵称</span>
                  <span className="text-rose-500">*</span>
                </label>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.slice(0, 20))}
                  placeholder="输入国家全称或昵称"
                  maxLength={20}
                  className="w-full h-10 px-3.5 pr-14 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C4FF6]/25 focus:border-[#6C4FF6] transition"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 pointer-events-none select-none">
                  {nickname.length}/20
                </div>
              </div>
            </div>

            {/* 2. 政体体系 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">国家政体与法度</label>
                <span className="text-[11px] text-slate-400">
                  {REGIME_OPTIONS[selectedRegimeIndex].desc}
                </span>
              </div>

              <div className="relative">
                <select
                  value={selectedRegimeIndex}
                  onChange={(e) => setSelectedRegimeIndex(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6C4FF6]/25 focus:border-[#6C4FF6] transition cursor-pointer"
                >
                  {REGIME_OPTIONS.map((opt, idx) => (
                    <option key={opt.label} value={idx}>
                      {opt.label} ({opt.ideology})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. 国旗上传与比例设置区域（支持 1:1、19:10、1:2、3:2） */}
            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-[#6C4FF6]" />
                  <span>国家旗帜规格</span>
                </label>
                <div className="flex items-center gap-1.5">
                  {/* 比例切换药丸按钮组 */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px]">
                    {FLAG_RATIO_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedFlagRatio(opt.id)}
                        className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                          selectedFlagRatio === opt.id
                            ? 'bg-white text-[#6C4FF6] shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title={opt.desc}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {uploadedFlagUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFlagUrl(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-[11px] text-rose-600 hover:text-rose-700 cursor-pointer whitespace-nowrap"
                    >
                      清除
                    </button>
                  )}
                </div>
              </div>

              {/* 动态比例预览与上传容器 */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ aspectRatio: getAspectRatioCSS(selectedFlagRatio) }}
                className={`relative w-full max-w-sm mx-auto max-h-48 rounded-xl overflow-hidden cursor-pointer transition border-2 ${
                  isDragOver
                    ? 'border-[#6C4FF6] bg-[#F0ECFF]/60 shadow-md'
                    : uploadedFlagUrl
                    ? 'border-slate-200 bg-slate-100 shadow-xs'
                    : 'border-dashed border-[#6C4FF6]/40 bg-[#F0ECFF]/25 hover:bg-[#F0ECFF]/45'
                } flex flex-col items-center justify-center group select-none`}
              >
                {uploadedFlagUrl ? (
                  <>
                    <img
                      src={uploadedFlagUrl}
                      alt="Flag Preview"
                      style={{ aspectRatio: getAspectRatioCSS(selectedFlagRatio) }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white text-xs font-semibold">
                      <Upload className="w-4 h-4" />
                      <span>点击或拖拽重新上传</span>
                    </div>
                  </>
                ) : (
                  <div className="p-3 text-center">
                    <div className="w-8 h-8 rounded-full bg-white border border-[#6C4FF6]/25 shadow-xs flex items-center justify-center text-[#6C4FF6] mx-auto mb-1.5 group-hover:scale-105 transition">
                      <Upload className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      点击上传国旗或拖拽图片至此处
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      当前比例: {selectedFlagRatio} · 支持 PNG/JPG/SVG/WebP
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* 国家代表色调 */}
              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">
                    国家代表色调
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    {customColor ? '自定义' : PRESET_FLAG_PALETTES[selectedPaletteIndex]?.name} · {(customColor || PRESET_FLAG_PALETTES[selectedPaletteIndex]?.color || '').toUpperCase()}
                  </span>
                </div>

                {/* 10 款经典大国代表色 (5列紧凑网格) */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {PRESET_FLAG_PALETTES.map((p, idx) => {
                    const isSelected = !customColor && idx === selectedPaletteIndex;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPaletteIndex(idx);
                          setCustomColor(null);
                          setHexInputText('');
                        }}
                        className={`h-7 px-2 rounded-lg border text-[11px] font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap justify-start ${
                          isSelected
                            ? 'border-slate-800 bg-slate-900 text-white shadow-xs font-bold'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                        title={`${p.name} (${p.color})`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="truncate">{p.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-white ml-auto shrink-0 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>

                {/* 更多调色：Intent UI Color Picker 专业设计系统调色盘 */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMoreColors(!showMoreColors)}
                    className={`h-7 px-2.5 rounded-lg border text-[11px] font-medium transition flex items-center gap-1.5 cursor-pointer ${
                      showMoreColors
                        ? 'border-slate-800 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>{showMoreColors ? '收起 Intent UI 调色板' : '自定义调色板'}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showMoreColors ? 'rotate-180' : ''}`} />
                  </button>

                  {/* 自定义 Hex 代码直接键入与重置 */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0 shadow-2xs"
                      style={{ backgroundColor: customColor || PRESET_FLAG_PALETTES[selectedPaletteIndex]?.color || '#1D4ED8' }}
                    />
                    <input
                      type="text"
                      value={hexInputText}
                      onChange={handleHexInputChange}
                      placeholder={(customColor || PRESET_FLAG_PALETTES[selectedPaletteIndex]?.color || '#1D4ED8').toUpperCase()}
                      maxLength={7}
                      className="w-20 h-7 px-2 rounded-lg border border-slate-200 bg-white text-[11px] font-mono text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition"
                      title="输入自定义十六进制色值，例如 #1D4ED8"
                    />
                    {customColor && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomColor(null);
                          setHexInputText('');
                        }}
                        className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer whitespace-nowrap"
                      >
                        重置
                      </button>
                    )}
                  </div>
                </div>

                {/* 展开的 Intent UI Color Picker 组件系统 */}
                {showMoreColors && (
                  <div className="mt-2.5">
                    <IntentColorPicker
                      color={customColor || PRESET_FLAG_PALETTES[selectedPaletteIndex]?.color || '#1D4ED8'}
                      onChange={(newHex) => {
                        setCustomColor(newHex);
                        setHexInputText(newHex);
                      }}
                      swatches={EXTENDED_FLAG_PALETTES}
                      swatchTitle="进阶地缘沙盘推荐色"
                      onReset={() => {
                        setCustomColor(null);
                        setHexInputText('');
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 持续建国勾选项 */}
            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={keepOpenAfterCreate}
                  onChange={(e) => setKeepOpenAfterCreate(e.target.checked)}
                  className="w-4 h-4 rounded text-[#6C4FF6] focus:ring-[#6C4FF6] border-slate-300 transition cursor-pointer"
                />
                <span className="text-xs text-slate-700 font-medium">
                  建国成功后保留窗口，继续快速建立下一个国家
                </span>
              </label>
            </div>

            {/* 提交建国主按钮 */}
            <button
              type="submit"
              className="w-full h-11 px-4 rounded-xl bg-[#6C4FF6] hover:bg-[#5737D9] active:bg-[#4E31C4] text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-500/20 transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>建立国家实体</span>
            </button>
          </form>

          {/* 已建立国家列表折叠/展示区域 */}
          <div className="pt-3 border-t border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">
                已建立国家实体 ({existingNations.length})
              </span>
              <span className="text-[11px] text-slate-400">
                {existingNations.length === 0 ? '暂无实体' : '可随时前往分配疆域'}
              </span>
            </div>

            {existingNations.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50/60 border border-dashed border-slate-200 text-center">
                <Flag className="w-5 h-5 text-slate-400 mx-auto mb-1 opacity-60" />
                <p className="text-xs text-slate-500 font-medium">暂无国家实体</p>
                <p className="text-[10px] text-slate-400 mt-0.5">请在上方填写信息后点击建立国家实体</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                {existingNations.map((nation) => (
                  <div
                    key={nation.id}
                    className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white transition flex items-center justify-between gap-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <NationFlagDisplay
                        flagUrl={nation.flagUrl}
                        flagColor={nation.flagColor}
                        name={nation.name}
                        className="w-7 h-5 rounded border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 truncate">{nation.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 shrink-0">
                            {nation.nationType || nation.regime}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          已占疆域: {nation.provinces?.length || 0} 个省份
                        </p>
                      </div>
                    </div>

                    {onDeleteNation && (
                      <button
                        type="button"
                        onClick={() => onDeleteNation(nation.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                        title="删除该国家"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 弹窗底部操作区（单行不折行） */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
          >
            完成并关闭
          </button>

          <button
            type="button"
            disabled={existingNations.length < 1}
            onClick={onProceedToTerritoryAllocation}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer ${
              existingNations.length >= 1
                ? 'bg-[#6C4FF6] hover:bg-[#5737D9] text-white shadow-purple-500/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>
              {existingNations.length >= 1
                ? `进入分配疆域 (共 ${existingNations.length} 国)`
                : '建立 1 个国家后可分配疆域'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
