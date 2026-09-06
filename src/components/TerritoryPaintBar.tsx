import React from 'react';
import { Brush, Check, X, Shield, MapPin, AlertCircle } from 'lucide-react';
import { Country, TerritoryTile } from '../types';
import { EmblemIcon } from './EmblemIcon';

interface TerritoryPaintBarProps {
  country: Country;
  allTerritories: TerritoryTile[];
  onFinishPainting: () => void;
}

export const TerritoryPaintBar: React.FC<TerritoryPaintBarProps> = ({
  country,
  allTerritories,
  onFinishPainting,
}) => {
  const currentCount = country.controlledTileIds.length;

  return (
    <div
      id="territory-paint-bar"
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3 shadow-2xl flex items-center gap-4 text-slate-800 animate-in slide-in-from-bottom-6 duration-200"
    >
      <div className="flex items-center gap-3 pl-2">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
          style={{ backgroundColor: country.color }}
        >
          <EmblemIcon name={country.flagEmblem} size={20} />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">{country.name}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold">
              {currentCount} 格地块
            </span>
          </div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <Brush className="w-3 h-3 text-indigo-600 animate-pulse" />
            <span>点击地图地块直接划归疆界；点击已占地块可解除划归</span>
          </p>
        </div>
      </div>

      <div className="h-8 w-px bg-slate-200" />

      <button
        onClick={onFinishPainting}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-600/30 flex items-center gap-1.5 transition shrink-0"
      >
        <Check className="w-4 h-4" />
        <span>完成划定</span>
      </button>
    </div>
  );
};
