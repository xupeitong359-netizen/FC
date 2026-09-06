import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  Flag,
  Crown,
  Building,
  User,
  Palette,
  Sparkles,
  Layers,
  Shield,
  MapPin,
  Check,
} from 'lucide-react';
import { Country, FlagEmblem, RegimeType, StrategicDoctrine, TerritoryTile } from '../types';
import {
  COLOR_PALETTE,
  DOCTRINE_OPTIONS,
  EMBLEM_OPTIONS,
  generateCountryCode,
  REGIME_OPTIONS,
} from '../utils/worldCalculations';
import { EmblemIcon } from './EmblemIcon';

interface CreateCountryModalProps {
  unassignedTerritories: TerritoryTile[];
  currentYear: number;
  onClose: () => void;
  onCreateCountry: (newCountry: Country) => void;
}

export const CreateCountryModal: React.FC<CreateCountryModalProps> = ({
  unassignedTerritories,
  currentYear,
  onClose,
  onCreateCountry,
}) => {
  const [name, setName] = useState<string>('');
  const [shortName, setShortName] = useState<string>('');
  const [code, setCode] = useState<string>(() => generateCountryCode('新主权国'));
  const [regime, setRegime] = useState<RegimeType>('创联民主同盟');
  const [color, setColor] = useState<string>(COLOR_PALETTE[0].value);
  const [flagEmblem, setFlagEmblem] = useState<FlagEmblem>('compass');
  const [capital, setCapital] = useState<string>('');
  const [leader, setLeader] = useState<string>('');
  const [ideology, setIdeology] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [activeDoctrine, setActiveDoctrine] = useState<StrategicDoctrine>('全境深度工业化');
  const [selectedTileIds, setSelectedTileIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleNameChange = (val: string) => {
    setName(val);
    if (!shortName) {
      setShortName(val.slice(0, 4));
    }
    if (val.length >= 2) {
      setCode(generateCountryCode(val));
    }
  };

  const handleToggleTile = (tileId: string) => {
    setSelectedTileIds((prev) =>
      prev.includes(tileId) ? prev.filter((id) => id !== tileId) : [...prev, tileId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('请填写国家全称');
      return;
    }
    if (!capital.trim()) {
      setErrorMsg('请填写国家首都');
      return;
    }
    if (!leader.trim()) {
      setErrorMsg('请填写国家元首或执政长官');
      return;
    }

    const newCountry: Country = {
      id: `CTRY-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      shortName: shortName.trim() || name.trim().slice(0, 4),
      code: code.trim().toUpperCase() || 'CTY',
      regime,
      color,
      accentColor: color,
      flagEmblem,
      capital: capital.trim(),
      leader: leader.trim(),
      foundedYear: currentYear,
      controlledTileIds: selectedTileIds,
      population: 5000,
      gdpIndex: 2500,
      resources: {
        crystal: 2000,
        industry: 1500,
        agriculture: 2000,
        energy: 1800,
        infrastructure: 2000,
      },
      militaryStrength: 75,
      stability: 85,
      ideology: ideology.trim() || '自主建国宣言与宪法秩序',
      description: description.trim() || '在创联历新时代成立的独立主权实体。',
      alliances: [],
      activeDoctrine,
      treaties: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onCreateCountry(newCountry);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
      <div
        id="create-country-modal"
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-2xs">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">创立新主权国家</h2>
              <p className="text-xs text-slate-500 font-medium">
                设定国号、宪制政体、国徽、元首与初始控制省区
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Name & Short Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-700 block">国家全称 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="例如：极光自由联邦共和国"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">国家简称</label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="极光联邦"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Regime & Flag Emblem */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">宪制政体类型</label>
              <select
                value={regime}
                onChange={(e) => setRegime(e.target.value as RegimeType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              >
                {REGIME_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">国徽徽章</label>
              <div className="grid grid-cols-7 gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                {EMBLEM_OPTIONS.map((em) => (
                  <button
                    key={em.id}
                    type="button"
                    onClick={() => setFlagEmblem(em.id)}
                    className={`p-1.5 rounded-lg flex items-center justify-center transition ${
                      flagEmblem === em.id
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                    title={em.label}
                  >
                    <EmblemIcon name={em.id} size={16} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color Palette */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">国家代表色彩</label>
            <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-2 rounded-xl border border-slate-200">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition border-2 ${
                    color === c.value
                      ? 'border-indigo-600 scale-110 shadow-xs'
                      : 'border-white hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                >
                  {color === c.value && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Capital & Leader */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">法定首都名称 *</label>
              <input
                type="text"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                placeholder="例如：极光新城"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">国家元首 / 执政官 *</label>
              <input
                type="text"
                value={leader}
                onChange={(e) => setLeader(e.target.value)}
                placeholder="例如：大统领·安德烈"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                required
              />
            </div>
          </div>

          {/* Strategic Doctrine */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">初始核心战略国策</label>
            <select
              value={activeDoctrine}
              onChange={(e) => setActiveDoctrine(e.target.value as StrategicDoctrine)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            >
              {DOCTRINE_OPTIONS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.desc}
                </option>
              ))}
            </select>
          </div>

          {/* Ideology & Description */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">国策思潮</label>
            <input
              type="text"
              value={ideology}
              onChange={(e) => setIdeology(e.target.value)}
              placeholder="例如：泛自由贸易与星空开拓宪法"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">国家历史概况</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简述该国的历史渊源、立国背景与地理位置..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition resize-none"
            />
          </div>

          {/* Initial Territories Selection */}
          {unassignedTerritories.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-slate-700">
                  初始划入疆域地块 ({selectedTileIds.length} 已选)
                </label>
                <span className="text-[11px] text-slate-400">点击选中地块作为立国领土</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                {unassignedTerritories.map((t) => {
                  const isSelected = selectedTileIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleToggleTile(t.id)}
                      className={`p-2 rounded-lg text-left transition border ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="truncate text-xs">{t.name}</div>
                      <div className="text-[10px] text-slate-400">{t.regionZone}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/30 flex items-center gap-1.5 transition"
            >
              <Check className="w-4 h-4" />
              <span>宣告建国并录入世界网</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
