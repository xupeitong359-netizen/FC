import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Check, X, Pipette, RotateCcw } from 'lucide-react';

export interface TerritoryColorOption {
  hex: string;
  name: string;
}

// 精选符合地缘政治、沙盘历史推演质感的优雅代表色系（避免刺眼荧光与违和高饱和）
export const GEOPOLITICAL_PALETTE: TerritoryColorOption[] = [
  // 经典赤绯与铁血红
  { hex: '#dc2626', name: '朱砂红' },
  { hex: '#b91c1c', name: '赤烈红' },
  { hex: '#991b1b', name: '暗绛红' },
  { hex: '#e11d48', name: '玫瑰绯' },

  // 橙黄与帝国金
  { hex: '#ea580c', name: '赤橙' },
  { hex: '#d97706', name: '琥珀金' },
  { hex: '#b45309', name: '古铜金' },
  { hex: '#ca8a04', name: '缃黄' },

  // 翡翠与大地绿
  { hex: '#059669', name: '翡翠绿' },
  { hex: '#047857', name: '深林绿' },
  { hex: '#15803d', name: '苍松绿' },
  { hex: '#4d7c0f', name: '橄榄绿' },

  // 普鲁士蓝与深海青
  { hex: '#2563eb', name: '蔚蓝' },
  { hex: '#1d4ed8', name: '普鲁士蓝' },
  { hex: '#1e40af', name: '深海青' },
  { hex: '#0284c7', name: '天青蓝' },

  // 青金石与帝国紫
  { hex: '#7c3aed', name: '青金紫' },
  { hex: '#6d28d9', name: '帝国紫' },
  { hex: '#4f46e5', name: '群青靛' },
  { hex: '#9333ea', name: '玄紫' },

  // 曜石与玄灰
  { hex: '#334155', name: '曜石板' },
  { hex: '#475569', name: '苍铁灰' },
  { hex: '#1e293b', name: '玄墨黑' },
  { hex: '#0f766e', name: '孔雀绿' },
];

export interface TerritoryColorPickerProps {
  /** 当前疆域代表色 (Hex 字符串) */
  color: string;
  /** 颜色变更回调（选定即时触发） */
  onChange: (newColor: string) => void;
  /** 国家名称（用于弹窗标题提示） */
  nationName?: string;
  /** 呈现形态：compact(紧凑小胶囊) | pill(带说明胶囊) | form(表单行) */
  variant?: 'compact' | 'pill' | 'form';
  /** 弹出位置偏好 */
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  /** 附加样式类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

export const TerritoryColorPicker: React.FC<TerritoryColorPickerProps> = ({
  color = '#3b82f6',
  onChange,
  nationName,
  variant = 'compact',
  placement = 'bottom-start',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customHex, setCustomHex] = useState(color);
  const containerRef = useRef<HTMLDivElement>(null);
  const nativePickerRef = useRef<HTMLInputElement>(null);

  // 同步外部 color 到自定义输入框
  useEffect(() => {
    setCustomHex(color);
  }, [color]);

  // 点击外部自动收纳
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen]);

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.trim();
    if (!val.startsWith('#')) {
      val = '#' + val;
    }
    setCustomHex(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val)) {
      onChange(val);
    }
  };

  const currentPreset = GEOPOLITICAL_PALETTE.find(
    (p) => p.hex.toLowerCase() === color.toLowerCase()
  );

  // 弹窗定位 class
  const getPopoverPlacementClass = () => {
    switch (placement) {
      case 'bottom-end':
        return 'top-full right-0 mt-1.5 origin-top-right';
      case 'top-start':
        return 'bottom-full left-0 mb-1.5 origin-bottom-left';
      case 'top-end':
        return 'bottom-full right-0 mb-1.5 origin-bottom-right';
      case 'bottom-start':
      default:
        return 'top-full left-0 mt-1.5 origin-top-left';
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* 收纳触发态（三种轻量化形态） */}
      {variant === 'compact' && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          title={`修改${nationName ? `【${nationName}】` : ''}疆域颜色`}
          className={`h-7 px-2 rounded-xl bg-white/95 backdrop-blur-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs select-none ${
            isOpen
              ? 'border-[#6C4FF6] ring-2 ring-[#6C4FF6]/15 bg-slate-50'
              : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/90'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {/* 核心色块小圆点 */}
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/90 shadow-2xs shrink-0 transition-transform"
            style={{ backgroundColor: color }}
          />
          <Palette className="w-3.5 h-3.5 text-slate-500 hover:text-slate-700 transition shrink-0" />
        </button>
      )}

      {variant === 'pill' && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`px-2.5 py-1.5 rounded-2xl bg-white/95 backdrop-blur-xl border transition-all cursor-pointer flex items-center gap-2 shadow-2xs select-none ${
            isOpen
              ? 'border-[#6C4FF6] ring-2 ring-[#6C4FF6]/15 bg-slate-50'
              : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/90'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/90 shadow-2xs shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-semibold text-slate-700 truncate">
            {currentPreset?.name || '疆域颜色'}
          </span>
          <span className="font-mono text-[10px] text-slate-400">
            {color.toUpperCase()}
          </span>
        </button>
      )}

      {variant === 'form' && (
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`px-3 py-2 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition cursor-pointer flex items-center justify-between gap-3 ${
            isOpen ? 'border-[#6C4FF6] ring-2 ring-[#6C4FF6]/15 bg-white' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-5 h-5 rounded-lg border border-white shadow-2xs shrink-0"
              style={{ backgroundColor: color }}
            />
            <div className="min-w-0 text-left">
              <div className="text-xs font-semibold text-slate-800">
                {currentPreset?.name || '自定义代表色'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {color.toUpperCase()}
              </div>
            </div>
          </div>
          <span className="text-[11px] text-[#6C4FF6] font-semibold flex items-center gap-1 shrink-0">
            <Palette className="w-3 h-3" />
            <span>{isOpen ? '收起色盘' : '调整颜色'}</span>
          </span>
        </div>
      )}

      {/* 展开态：缩小版优雅克制的紧凑微型调色盘面板 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: placement.startsWith('top') ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: placement.startsWith('top') ? 4 : -4 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`absolute z-50 w-[184px] max-w-[calc(100vw-24px)] bg-white/98 backdrop-blur-2xl border border-slate-200/95 rounded-2xl shadow-2xl p-2.5 text-slate-800 select-none ${getPopoverPlacementClass()}`}
          >
            {/* 调色盘顶栏 */}
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white shadow-2xs shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="font-bold text-[11px] text-slate-900 truncate">疆域色彩</span>
                {nationName && (
                  <span className="text-[10px] font-medium text-slate-400 truncate max-w-[65px]">
                    · {nationName}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-0.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                title="收起调色盘"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* 经典势力色系推荐色格（微型紧凑版） */}
            <div className="mb-2">
              <div className="text-[9px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                <span>经典势力色系</span>
                {currentPreset && (
                  <span className="text-slate-600 font-medium">{currentPreset.name}</span>
                )}
              </div>
              <div className="grid grid-cols-6 gap-1">
                {GEOPOLITICAL_PALETTE.map((item) => {
                  const isSelected = item.hex.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={item.hex}
                      type="button"
                      onClick={() => {
                        onChange(item.hex);
                        setCustomHex(item.hex);
                      }}
                      title={`${item.name} (${item.hex})`}
                      className={`relative w-6 h-6 rounded-md transition-transform cursor-pointer flex items-center justify-center border border-black/5 hover:scale-110 active:scale-95 ${
                        isSelected
                          ? 'ring-2 ring-slate-900 shadow-2xs scale-105 z-10'
                          : 'hover:shadow-2xs'
                      }`}
                      style={{ backgroundColor: item.hex }}
                    >
                      {isSelected && (
                        <Check className="w-3 h-3 text-white drop-shadow-xs stroke-[3]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 自定义拾色与 HEX 码输入（高度压紧，超低占位） */}
            <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1.5">
              {/* 原生拾色器快捷触发 */}
              <div className="relative shrink-0">
                <input
                  ref={nativePickerRef}
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const next = e.target.value;
                    setCustomHex(next);
                    onChange(next);
                  }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => nativePickerRef.current?.click()}
                  className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
                  title="调用高级吸管/拾色器"
                >
                  <Pipette className="w-3 h-3" />
                </button>
              </div>

              {/* HEX 文本输入框 */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={customHex}
                  onChange={handleHexInputChange}
                  placeholder="#3B82F6"
                  maxLength={7}
                  className="w-full h-6 px-1.5 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-mono font-semibold text-slate-800 uppercase outline-none focus:border-[#6C4FF6] focus:bg-white transition"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
