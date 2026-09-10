import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Pipette, Check, Copy, RotateCcw } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 色彩数学转换工具函数 (纯数学计算，零额外依赖)                                   */
/* -------------------------------------------------------------------------- */

export interface HSV {
  h: number; // 0 - 360
  s: number; // 0 - 1
  v: number; // 0 - 1
}

export interface RGB {
  r: number; // 0 - 255
  g: number; // 0 - 255
  b: number; // 0 - 255
}

/** 将 Hex (#RGB 或 #RRGGBB) 转换为 RGB */
export function hexToRgb(hex: string): RGB | null {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/** 将 RGB 转换为 Hex (#RRGGBB) */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/** 将 RGB 转换为 HSV */
export function rgbToHsv(r: number, g: number, b: number): HSV {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  let h = 0;
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff) % 6;
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else {
      h = (r - g) / diff + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : diff / max;
  const v = max;
  return { h, s, v };
}

/** 将 HSV 转换为 RGB */
export function hsvToRgb(h: number, s: number, v: number): RGB {
  h = (h % 360 + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/** Hex 直接转 HSV */
export function hexToHsv(hex: string): HSV {
  const rgb = hexToRgb(hex);
  if (!rgb) return { h: 217, s: 0.85, v: 0.85 }; // 默认普鲁士蓝系
  return rgbToHsv(rgb.r, rgb.g, rgb.b);
}

/** HSV 直接转 Hex */
export function hsvToHex(h: number, s: number, v: number): string {
  const { r, g, b } = hsvToRgb(h, s, v);
  return rgbToHex(r, g, b);
}

/* -------------------------------------------------------------------------- */
/* 子组件 1: ColorArea (二维明度与饱和度调色盘)                                */
/* -------------------------------------------------------------------------- */

export interface ColorAreaProps {
  hue: number;
  saturation: number;
  value: number;
  onChange: (saturation: number, value: number) => void;
  className?: string;
  height?: number;
}

export const ColorArea: React.FC<ColorAreaProps> = memo(({
  hue,
  saturation,
  value,
  onChange,
  className = '',
  height = 140,
}) => {
  const areaRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const updateFromPointer = useCallback((clientX: number, clientY: number) => {
    if (!areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

    const s = Math.round((x / rect.width) * 100) / 100;
    const v = Math.round((1 - y / rect.height) * 100) / 100;
    onChange(s, v);
  }, [onChange]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingRef.current = true;
    updateFromPointer(e.clientX, e.clientY);

    const onPointerMove = (moveEvt: PointerEvent) => {
      if (!isDraggingRef.current) return;
      updateFromPointer(moveEvt.clientX, moveEvt.clientY);
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const currentColorHex = hsvToHex(hue, saturation, value);

  return (
    <div
      ref={areaRef}
      onPointerDown={handlePointerDown}
      style={{
        height: `${height}px`,
        backgroundColor: `hsl(${hue}, 100%, 50%)`,
      }}
      className={`relative w-full rounded-lg overflow-hidden cursor-crosshair select-none touch-none border border-black/10 shadow-inner ${className}`}
    >
      {/* 饱和度白色水平渐变 */}
      <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
      {/* 明度黑色垂直渐变 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />

      {/* 取色圆环 Thumb */}
      <div
        className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md pointer-events-none ring-1 ring-black/25 transition-transform scale-100"
        style={{
          left: `${Math.max(0, Math.min(100, saturation * 100))}%`,
          top: `${Math.max(0, Math.min(100, (1 - value) * 100))}%`,
          backgroundColor: currentColorHex,
        }}
      />
    </div>
  );
});

ColorArea.displayName = 'ColorArea';

/* -------------------------------------------------------------------------- */
/* 子组件 2: HueSlider (色相 360° 滑块)                                        */
/* -------------------------------------------------------------------------- */

export interface HueSliderProps {
  hue: number;
  onChange: (hue: number) => void;
  className?: string;
}

export const HueSlider: React.FC<HueSliderProps> = memo(({
  hue,
  onChange,
  className = '',
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const updateFromPointer = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const h = Math.round((x / rect.width) * 360);
    onChange(Math.min(360, Math.max(0, h)));
  }, [onChange]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingRef.current = true;
    updateFromPointer(e.clientX);

    const onPointerMove = (moveEvt: PointerEvent) => {
      if (!isDraggingRef.current) return;
      updateFromPointer(moveEvt.clientX);
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div
      ref={sliderRef}
      onPointerDown={handlePointerDown}
      className={`relative w-full h-3 rounded-full cursor-pointer select-none touch-none border border-black/10 shadow-inner ${className}`}
      style={{
        background:
          'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
      }}
    >
      {/* 游标 Thumb */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none ring-1 ring-black/25"
        style={{
          left: `${(Math.max(0, Math.min(360, hue)) / 360) * 100}%`,
          backgroundColor: `hsl(${hue}, 100%, 50%)`,
        }}
      />
    </div>
  );
});

HueSlider.displayName = 'HueSlider';

/* -------------------------------------------------------------------------- */
/* 子组件 3: ColorSwatch & ColorSwatchPicker (色板矩阵)                         */
/* -------------------------------------------------------------------------- */

export interface ColorSwatchItem {
  id?: string;
  name?: string;
  color: string;
}

export interface ColorSwatchProps {
  color: string;
  name?: string;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = memo(({
  color,
  name,
  isSelected = false,
  onClick,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={name ? `${name} (${color})` : color}
      className={`group relative h-7 px-2 rounded-lg border text-[11px] font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap justify-start ${
        isSelected
          ? 'border-slate-800 bg-slate-900 text-white shadow-xs font-semibold'
          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
      } ${className}`}
    >
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10"
        style={{ backgroundColor: color }}
      />
      {name && <span className="truncate">{name}</span>}
      {isSelected && (
        <Check className="w-3 h-3 text-white ml-auto shrink-0 stroke-[2.5]" />
      )}
    </button>
  );
});

ColorSwatch.displayName = 'ColorSwatch';

export interface ColorSwatchPickerProps {
  swatches: ColorSwatchItem[];
  selectedColor: string;
  onSelect: (color: string) => void;
  columns?: number;
  className?: string;
}

export const ColorSwatchPicker: React.FC<ColorSwatchPickerProps> = memo(({
  swatches,
  selectedColor,
  onSelect,
  className = '',
}) => {
  const normSelected = selectedColor.toLowerCase();

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-5 gap-1.5 ${className}`}>
      {swatches.map((item, idx) => {
        const isSelected = item.color.toLowerCase() === normSelected;
        return (
          <ColorSwatch
            key={item.id || item.color + idx}
            color={item.color}
            name={item.name}
            isSelected={isSelected}
            onClick={() => onSelect(item.color)}
          />
        );
      })}
    </div>
  );
});

ColorSwatchPicker.displayName = 'ColorSwatchPicker';

/* -------------------------------------------------------------------------- */
/* 子组件 4: ColorField (Hex 文本输入与吸色控制器)                               */
/* -------------------------------------------------------------------------- */

export interface ColorFieldProps {
  color: string;
  onChange: (hex: string) => void;
  className?: string;
}

export const ColorField: React.FC<ColorFieldProps> = memo(({
  color,
  onChange,
  className = '',
}) => {
  const [inputText, setInputText] = useState(color);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setInputText(color);
  }, [color]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.trim();
    if (!val.startsWith('#') && val.length > 0) {
      val = '#' + val;
    }
    setInputText(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val)) {
      onChange(val);
    }
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(color.toUpperCase());
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  // 支持 EyeDropper 原生色彩采集 (若浏览器支持)
  const handleEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        // @ts-expect-error EyeDropper API 在现代 Chrome/Edge 原生支持
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          onChange(result.sRGBHex);
        }
      } catch {
        // 用户取消吸管
      }
    }
  };

  const hasEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* 最终颜色预览色块 */}
      <div
        className="w-7 h-7 rounded-lg border border-black/15 shadow-2xs shrink-0 transition-colors"
        style={{ backgroundColor: color }}
      />

      {/* Hex 文本输入 */}
      <div className="relative flex-1">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-mono font-medium text-slate-400 pointer-events-none">
          HEX
        </span>
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          maxLength={7}
          className="w-full h-7 pl-9 pr-2 rounded-lg border border-slate-200 bg-white text-[11px] font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition uppercase"
          placeholder="#1D4ED8"
        />
      </div>

      {/* 复制按钮 */}
      <button
        type="button"
        onClick={handleCopy}
        title="复制颜色 Hex 代码"
        className="h-7 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition flex items-center gap-1 text-[11px] cursor-pointer shrink-0"
      >
        {copied ? (
          <Check className="w-3 h-3 text-emerald-600" />
        ) : (
          <Copy className="w-3 h-3 text-slate-400" />
        )}
        <span className="text-[10px] font-mono">{copied ? '已复制' : '复制'}</span>
      </button>

      {/* 浏览器屏幕吸色器 (若支持) */}
      {hasEyeDropper && (
        <button
          type="button"
          onClick={handleEyeDropper}
          title="吸管拾色器"
          className="h-7 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition flex items-center justify-center cursor-pointer shrink-0"
        >
          <Pipette className="w-3.5 h-3.5 text-slate-500" />
        </button>
      )}
    </div>
  );
});

ColorField.displayName = 'ColorField';

/* -------------------------------------------------------------------------- */
/* 主组件: IntentColorPicker (Intent UI 现代设计系统风格)                       */
/* -------------------------------------------------------------------------- */

export interface IntentColorPickerProps {
  /** 当前颜色 (Hex) */
  color: string;
  /** 颜色变更回调 */
  onChange: (hexColor: string) => void;
  /** 预设色板（如地缘代表色系） */
  swatches?: ColorSwatchItem[];
  /** 扩展色板分类标题 */
  swatchTitle?: string;
  /** 是否允许重置 */
  onReset?: () => void;
  /** 附加样式类 */
  className?: string;
}

export const IntentColorPicker: React.FC<IntentColorPickerProps> = ({
  color,
  onChange,
  swatches,
  swatchTitle = '预设代表色',
  onReset,
  className = '',
}) => {
  // 解析当前颜色的 HSV
  const [hsv, setHsv] = useState<HSV>(() => hexToHsv(color));

  // 当外部 color 改变时，同步 hsv（如果差异较大）
  useEffect(() => {
    const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);
    if (currentHex.toLowerCase() !== color.toLowerCase()) {
      setHsv(hexToHsv(color));
    }
  }, [color]);

  // ColorArea 改变饱和度与明度
  const handleAreaChange = useCallback((s: number, v: number) => {
    setHsv((prev) => {
      const nextHsv = { ...prev, s, v };
      const nextHex = hsvToHex(nextHsv.h, nextHsv.s, nextHsv.v);
      onChange(nextHex);
      return nextHsv;
    });
  }, [onChange]);

  // HueSlider 改变色相
  const handleHueChange = useCallback((h: number) => {
    setHsv((prev) => {
      const nextHsv = { ...prev, h };
      const nextHex = hsvToHex(nextHsv.h, nextHsv.s, nextHsv.v);
      onChange(nextHex);
      return nextHsv;
    });
  }, [onChange]);

  // 直接变更 Hex
  const handleHexChange = useCallback((hex: string) => {
    const nextHsv = hexToHsv(hex);
    setHsv(nextHsv);
    onChange(hex);
  }, [onChange]);

  return (
    <div
      className={`w-full bg-white rounded-xl border border-slate-200/90 shadow-xs p-3 select-none text-slate-800 ${className}`}
    >
      {/* 1. ColorArea (二维微调区) */}
      <ColorArea
        hue={hsv.h}
        saturation={hsv.s}
        value={hsv.v}
        onChange={handleAreaChange}
        height={130}
      />

      {/* 2. HueSlider (360度色彩滑块) */}
      <div className="mt-3">
        <HueSlider hue={hsv.h} onChange={handleHueChange} />
      </div>

      {/* 3. ColorField (Hex 输入与控制) */}
      <div className="mt-3">
        <ColorField color={color} onChange={handleHexChange} />
      </div>

      {/* 4. ColorSwatches (预设推荐色) */}
      {swatches && swatches.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-slate-500">{swatchTitle}</span>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="text-[10px] text-slate-400 hover:text-slate-600 transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>恢复默认</span>
              </button>
            )}
          </div>
          <ColorSwatchPicker
            swatches={swatches}
            selectedColor={color}
            onSelect={handleHexChange}
          />
        </div>
      )}
    </div>
  );
};

export default IntentColorPicker;
