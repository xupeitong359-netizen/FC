import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  Sparkles,
  Check,
  X,
  Users,
  Mountain,
  Fuel,
  TrendingUp,
  MapPin,
  Settings,
} from 'lucide-react';
import { ProvinceTerrainType, TERRAIN_DEFINITIONS } from '../lib/terrainEngine';
import { ProvinceStrategicResources } from '../types';
import { workspaceService } from '../services/workspaceService';

export interface SelectedProvinceItem {
  id: string | number;
  name: string;
  currentTerrain?: string;
  currentManpower?: number;
  currentResources?: ProvinceStrategicResources;
}

interface ProvinceBoxEditModalProps {
  isOpen: boolean;
  selectedProvinces: SelectedProvinceItem[];
  workspaceId: string;
  onClose: () => void;
  onApplySuccess?: (modifiedCount: number) => void;
}

const ALL_TERRAINS: { type: ProvinceTerrainType; label: string; color: string }[] = [
  { type: 'plains', label: '平原', color: '#5b8a54' },
  { type: 'hills', label: '丘陵', color: '#b45309' },
  { type: 'mountain', label: '山地', color: '#78716c' },
  { type: 'forest', label: '森林', color: '#15803d' },
  { type: 'desert', label: '沙漠', color: '#ca8a04' },
  { type: 'marsh', label: '沼泽', color: '#0d9488' },
  { type: 'urban', label: '城市', color: '#6366f1' },
];

export const ProvinceBoxEditModal: React.FC<ProvinceBoxEditModalProps> = ({
  isOpen,
  selectedProvinces,
  workspaceId,
  onClose,
  onApplySuccess,
}) => {
  const [targetTerrain, setTargetTerrain] = useState<ProvinceTerrainType | ''>('');
  const [manpowerMode, setManpowerMode] = useState<'keep' | 'fixed' | 'multiplier'>('keep');
  const [fixedManpower, setFixedManpower] = useState<number>(2000000);
  const [manpowerMultiplier, setManpowerMultiplier] = useState<number>(1.5);
  
  // Resources batch adjustment
  const [modifyResources, setModifyResources] = useState(false);
  const [resources, setResources] = useState<ProvinceStrategicResources>({
    oil: 0,
    steel: 0,
    aluminium: 0,
    rubber: 0,
    tungsten: 0,
    chromium: 0,
  });

  // Name prefix or custom naming (single province)
  const [singleName, setSingleName] = useState('');
  const isSingle = selectedProvinces.length === 1;

  if (!isOpen || selectedProvinces.length === 0) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();

    const provinceIds = selectedProvinces.map((p) => p.id);
    
    if (isSingle) {
      // Single province edit
      const target = selectedProvinces[0];
      const updates: any = {};
      if (singleName.trim()) updates.name = singleName.trim();
      if (targetTerrain) updates.terrainType = targetTerrain;
      if (manpowerMode === 'fixed') updates.manpower = fixedManpower;
      else if (manpowerMode === 'multiplier') {
        const base = target.currentManpower || 1500000;
        updates.manpower = Math.round(base * manpowerMultiplier);
      }
      if (modifyResources) {
        updates.resources = { ...resources };
      }

      workspaceService.setProvinceOverride(workspaceId, target.id, updates);
      if (onApplySuccess) onApplySuccess(1);
      onClose();
      return;
    }

    // Batch box selection edit
    const batchData: any = {};
    if (targetTerrain) batchData.terrainType = targetTerrain;
    if (manpowerMode === 'fixed') batchData.manpowerFixed = fixedManpower;
    else if (manpowerMode === 'multiplier') batchData.manpowerMultiplier = manpowerMultiplier;
    if (modifyResources) batchData.addResources = resources;

    const count = workspaceService.batchSetProvinceOverrides(workspaceId, provinceIds, batchData);
    if (onApplySuccess) onApplySuccess(count);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs cursor-pointer"
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ type: 'spring', damping: 28, stiffness: 380, mass: 0.8 }}
          className="relative w-full max-w-[500px] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden text-slate-800 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 leading-tight">
                  {isSingle ? '省份属性修改' : '框选批量修改省份'}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  已圈选 {selectedProvinces.length} 个省份地块
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleApply} className="p-5 overflow-y-auto flex-1 space-y-4">
            {/* Selected provinces list chips */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                选定省份清单（{selectedProvinces.length}）
              </label>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {selectedProvinces.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs"
                  >
                    <MapPin className="w-2.5 h-2.5 text-amber-500" />
                    <span>{p.name}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* 1. 单省份专属：修改省份名称 */}
            {isSingle && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  省份自定义名称
                </label>
                <input
                  type="text"
                  value={singleName}
                  placeholder={selectedProvinces[0].name}
                  onChange={(e) => setSingleName(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-600 transition"
                />
              </div>
            )}

            {/* 2. 地形类型更改 (山地、沼泽、平原、丘陵、沙漠、城市、森林) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>修改省份自然地形类型</span>
                {targetTerrain && (
                  <button
                    type="button"
                    onClick={() => setTargetTerrain('')}
                    className="text-[11px] text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    不修改
                  </button>
                )}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {ALL_TERRAINS.map((t) => {
                  const isSelected = targetTerrain === t.type;
                  return (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => setTargetTerrain(isSelected ? '' : t.type)}
                      className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: t.color }}
                      />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. 人口数据修改 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                省份人口/适役人力调整
              </label>
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                <button
                  type="button"
                  onClick={() => setManpowerMode('keep')}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                    manpowerMode === 'keep'
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  保持原状
                </button>
                <button
                  type="button"
                  onClick={() => setManpowerMode('fixed')}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                    manpowerMode === 'fixed'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  指定固定值
                </button>
                <button
                  type="button"
                  onClick={() => setManpowerMode('multiplier')}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                    manpowerMode === 'multiplier'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  按倍率增减
                </button>
              </div>

              {manpowerMode === 'fixed' && (
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <input
                    type="number"
                    min={10000}
                    step={50000}
                    value={fixedManpower}
                    onChange={(e) => setFixedManpower(Number(e.target.value))}
                    className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                  <span className="text-xs text-slate-500 shrink-0">
                    人 ({(fixedManpower / 10000).toFixed(0)}万)
                  </span>
                </div>
              )}

              {manpowerMode === 'multiplier' && (
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <input
                    type="range"
                    min="0.2"
                    max="5.0"
                    step="0.1"
                    value={manpowerMultiplier}
                    onChange={(e) => setManpowerMultiplier(Number(e.target.value))}
                    className="flex-1 accent-indigo-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold font-mono text-indigo-700 w-12 text-right">
                    {manpowerMultiplier.toFixed(1)}x
                  </span>
                </div>
              )}
            </div>

            {/* 4. 资源配置修改 (石油、铝、橡胶、钨、钢铁、铬) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-amber-600" />
                  <span>战略资源产量注入</span>
                </label>
                <button
                  type="button"
                  onClick={() => setModifyResources(!modifyResources)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border transition cursor-pointer ${
                    modifyResources
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  {modifyResources ? '启用' : '关闭'}
                </button>
              </div>

              {modifyResources && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                  {[
                    { key: 'oil', label: '石油', color: 'text-amber-700' },
                    { key: 'steel', label: '钢铁', color: 'text-slate-700' },
                    { key: 'aluminium', label: '铝材', color: 'text-blue-600' },
                    { key: 'rubber', label: '橡胶', color: 'text-emerald-700' },
                    { key: 'tungsten', label: '钨矿', color: 'text-stone-700' },
                    { key: 'chromium', label: '铬矿', color: 'text-indigo-700' },
                  ].map((res) => (
                    <div key={res.key} className="text-center">
                      <div className={`text-[10px] font-bold ${res.color}`}>{res.label}</div>
                      <input
                        type="number"
                        min={0}
                        max={200}
                        value={(resources as any)[res.key] || 0}
                        onChange={(e) =>
                          setResources({
                            ...resources,
                            [res.key]: Math.max(0, Number(e.target.value)),
                          })
                        }
                        className="w-full h-8 text-center text-xs bg-white border border-slate-200 rounded-lg mt-1 font-mono font-bold"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions (2-character pure text: 保存 / 取消) */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                取消
              </button>
              <button
                id="province-box-save-btn"
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                保存
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
