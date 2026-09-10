import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Save,
  MapPin,
  Palette,
  Users,
  Factory,
  Cog,
  Shield,
  Fuel,
  Sparkles,
  Layers,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Nation, ProvinceData, ProvinceStrategicResources } from '../types';
import { getProvinceTerrain, ProvinceTerrainType, TERRAIN_DEFINITIONS } from '../lib/terrainEngine';
import { STRATEGIC_RESOURCES, StrategicResourceType } from '../lib/strategicCommandEngine';
import { TerritoryColorPicker } from './TerritoryColorPicker';

export interface EditProvinceDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  provinceData: {
    id: string | number;
    name: string;
    properties?: any;
  };
  ownerNation: Nation | null;
  allNations?: Nation[];
  onSave: (
    updatedProvince: Partial<ProvinceData>,
    targetNationId?: string
  ) => void;
}

const ALL_TERRAINS: { type: ProvinceTerrainType; label: string; icon: string }[] = [
  { type: 'plains', label: '平原', icon: '🌾' },
  { type: 'hills', label: '丘陵', icon: '⛰️' },
  { type: 'mountain', label: '山地', icon: '🏔️' },
  { type: 'forest', label: '森林', icon: '🌲' },
  { type: 'desert', label: '沙漠', icon: '🏜️' },
  { type: 'marsh', label: '沼泽', icon: '🌿' },
  { type: 'urban', label: '城市', icon: '🏙️' },
];

export const EditProvinceDataModal: React.FC<EditProvinceDataModalProps> = ({
  isOpen,
  onClose,
  provinceData,
  ownerNation,
  allNations = [],
  onSave,
}) => {
  if (!isOpen) return null;

  const { id: stateId, name: rawName, properties } = provinceData;
  const existingRecord = ownerNation?.provinces?.find(
    (p) =>
      String(p.id) === String(stateId) ||
      (p.name && String(p.name).trim().toLowerCase() === String(rawName).trim().toLowerCase())
  );

  // Form states
  const [provinceName, setProvinceName] = useState(
    existingRecord?.customName || existingRecord?.name || rawName || ''
  );
  
  // Custom Color Override
  const [useCustomColor, setUseCustomColor] = useState(Boolean(existingRecord?.colorHex));
  const [customColor, setCustomColor] = useState(
    existingRecord?.colorHex || ownerNation?.flagColor || '#3b82f6'
  );

  // Terrain
  const initialTerrain = (existingRecord?.terrain || properties?.terrain || 'plains') as ProvinceTerrainType;
  const [terrain, setTerrain] = useState<ProvinceTerrainType>(initialTerrain);

  // Demographics
  const initialManpower = Number(
    existingRecord?.manpower ?? properties?.manpower ?? 1500000
  );
  const [manpower, setManpower] = useState<number>(initialManpower);

  // Industry
  const [civFactories, setCivFactories] = useState<number>(
    existingRecord?.civilianFactories ?? properties?.civilianFactories ?? 1
  );
  const [milFactories, setMilFactories] = useState<number>(
    existingRecord?.militaryFactories ?? properties?.militaryFactories ?? 0
  );

  // Core Status
  const [isCore, setIsCore] = useState<boolean>(existingRecord?.isCore !== false);

  // Target Nation Owner
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>(ownerNation?.id || '');

  // Strategic Resources
  const initialRes: ProvinceStrategicResources = existingRecord?.resources || {
    oil: Number(properties?.oil || 0),
    steel: Number(properties?.steel || 0),
    aluminum: Number(properties?.aluminum || 0),
    tungsten: Number(properties?.tungsten || 0),
    chromium: Number(properties?.chromium || 0),
    rubber: Number(properties?.rubber || 0),
  };
  const [resources, setResources] = useState<ProvinceStrategicResources>(initialRes);

  const handleResourceChange = (key: StrategicResourceType, val: number) => {
    setResources((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(999, val)),
    }));
  };

  const handleSave = () => {
    const payload: Partial<ProvinceData> = {
      id: stateId,
      name: provinceName.trim() || rawName,
      customName: provinceName.trim() || rawName,
      colorHex: useCustomColor ? customColor : undefined,
      terrain,
      manpower,
      population: manpower * 4,
      civilianFactories: Math.max(0, civFactories),
      militaryFactories: Math.max(0, milFactories),
      isCore,
      resources,
    };

    onSave(payload, selectedOwnerId || undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 16 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-slate-900 text-slate-100 border border-slate-700 rounded shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <h3 className="text-base font-bold text-white truncate">
                  地块创作者编辑 · #{stateId}
                </h3>
                <span className="text-xs text-slate-400 font-mono">[{rawName}]</span>
              </div>
              <div className="text-[11px] text-slate-400">
                可自由自定义省份名称、地块涂装色、地形类别与工农业资源
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* 1. Province Name & Sovereign Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                省份名称 (自定义地名)
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={provinceName}
                  onChange={(e) => setProvinceName(e.target.value)}
                  placeholder={rawName}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setProvinceName(rawName)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded text-[10px] whitespace-nowrap cursor-pointer"
                  title="恢复原名"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                主权归属国家
              </label>
              <select
                value={selectedOwnerId}
                onChange={(e) => setSelectedOwnerId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:outline-hidden focus:border-indigo-500 font-medium cursor-pointer"
              >
                <option value="">中立未归属 (公有陆地)</option>
                {allNations.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.capital || '主权领土'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Plot Color Override (地块颜色) */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>地块涂装颜色</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUseCustomColor(false)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                    !useCustomColor
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  继承国家主色
                </button>
                <button
                  type="button"
                  onClick={() => setUseCustomColor(true)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                    useCustomColor
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  独立个性涂装
                </button>
              </div>
            </div>

            {useCustomColor ? (
              <div className="flex items-center gap-3 pt-1">
                <TerritoryColorPicker
                  color={customColor}
                  onChange={setCustomColor}
                  variant="pill"
                  nationName={provinceName}
                />
                <span className="text-[10px] text-slate-400">
                  当前自定义色：<span className="font-mono text-amber-300">{customColor}</span>，将覆盖地图默认国家色
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                <div
                  className="w-3.5 h-3.5 rounded-sm border border-slate-600 shrink-0"
                  style={{ backgroundColor: ownerNation?.flagColor || '#64748B' }}
                />
                <span>跟随当前归属国家：{ownerNation?.name || '中立陆地'}代表色</span>
              </div>
            )}
          </div>

          {/* 3. Terrain Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>地理地形类别</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {ALL_TERRAINS.map((t) => {
                const isSelected = terrain === t.type;
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => setTerrain(t.type)}
                    className={`p-1.5 rounded border flex flex-col items-center gap-0.5 transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-xs'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-sm">{t.icon}</span>
                    <span className="text-[10px] font-bold">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Demographics & Factories */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>适役人口</span>
              </label>
              <input
                type="number"
                value={manpower}
                onChange={(e) => setManpower(Math.max(10000, Number(e.target.value)))}
                step={100000}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:outline-hidden focus:border-indigo-500 font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                约 {(manpower / 10000).toFixed(1)} 万人
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Factory className="w-3.5 h-3.5 text-amber-400" />
                <span>民用工厂数</span>
              </label>
              <input
                type="number"
                value={civFactories}
                onChange={(e) => setCivFactories(Math.max(0, Math.min(25, Number(e.target.value))))}
                min={0}
                max={25}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:outline-hidden focus:border-indigo-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Cog className="w-3.5 h-3.5 text-rose-400" />
                <span>军用工厂数</span>
              </label>
              <input
                type="number"
                value={milFactories}
                onChange={(e) => setMilFactories(Math.max(0, Math.min(25, Number(e.target.value))))}
                min={0}
                max={25}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:outline-hidden focus:border-indigo-500 font-mono font-bold"
              />
            </div>
          </div>

          {/* 5. Core Status */}
          <div className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800 rounded">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-xs font-bold text-white">国家核心领土</span>
                <p className="text-[10px] text-slate-400 leading-tight">
                  非核心领土将遭受抵抗与顺从度衰减，核心领土可享 100% 工业与人力调配
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCore(!isCore)}
              className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                isCore
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-950 text-rose-300 border border-rose-700'
              }`}
            >
              {isCore ? '核心领土' : '占领/殖民地'}
            </button>
          </div>

          {/* 6. Strategic Resources */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-amber-500" />
              <span>战略自然资源产出</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(STRATEGIC_RESOURCES) as StrategicResourceType[]).map((resKey) => {
                const spec = STRATEGIC_RESOURCES[resKey];
                const currentVal = resources[resKey] || 0;

                return (
                  <div
                    key={resKey}
                    className="p-2 bg-slate-800/80 border border-slate-700 rounded flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-4 h-4 rounded-xs p-0.5 flex items-center justify-center shrink-0" style={{ backgroundColor: spec.color }}>
                        <img src={spec.iconUrl} alt={spec.name} className="w-full h-full object-contain" />
                      </span>
                      <span className="text-[11px] font-medium text-slate-300 truncate">
                        {spec.name}
                      </span>
                    </div>
                    <input
                      type="number"
                      value={currentVal}
                      onChange={(e) => handleResourceChange(resKey, Number(e.target.value))}
                      min={0}
                      max={999}
                      className="w-16 px-1.5 py-0.5 bg-slate-900 border border-slate-600 rounded text-right text-slate-100 font-mono font-bold text-xs focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>保存地块修改</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
