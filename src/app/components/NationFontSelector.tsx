import React from 'react';
import { Type, Check } from 'lucide-react';
import { NATION_FONT_OPTIONS, NationFontOption } from '../lib/nationFonts';

export interface NationFontSelectorProps {
  value?: string;
  onChange: (fontId: string) => void;
  sampleText?: string;
  hideHeader?: boolean;
}

export const NationFontSelector: React.FC<NationFontSelectorProps> = ({
  value = 'condensed',
  onChange,
  sampleText,
  hideHeader = false,
}) => {
  return (
    <div className="space-y-2">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-[#6C4FF6]" />
            <span>地图标绘字体</span>
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {NATION_FONT_OPTIONS.map((font: NationFontOption) => {
          const isSelected = value === font.id;
          const displaySample = sampleText ? sampleText.toUpperCase() : font.previewSample;

          return (
            <button
              key={font.id}
              type="button"
              onClick={() => onChange(font.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                isSelected
                  ? 'bg-[#6C4FF6]/5 border-[#6C4FF6] ring-1 ring-[#6C4FF6]/25 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900">{font.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-medium">
                    {font.category}
                  </span>
                </div>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-[#6C4FF6] text-white flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Real font preview strip */}
              <div
                className="py-1 px-2.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold tracking-wider truncate"
                style={{
                  fontFamily: font.fontFamily,
                  fontStretch: font.fontStretch || 'normal',
                  letterSpacing: `${font.letterSpacing || 0.05}em`,
                }}
              >
                {displaySample}
              </div>

              <div className="text-[11px] text-slate-400 leading-tight">
                {font.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
