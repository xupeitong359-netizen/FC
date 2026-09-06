import React, { useState } from 'react';
import {
  X,
  Edit3,
  Flag,
  Crown,
  Building,
  User,
  Palette,
  Sparkles,
  Layers,
  Shield,
  Check,
} from 'lucide-react';
import { Country, FlagEmblem, RegimeType, StrategicDoctrine } from '../types';
import {
  COLOR_PALETTE,
  DOCTRINE_OPTIONS,
  EMBLEM_OPTIONS,
  REGIME_OPTIONS,
} from '../utils/worldCalculations';
import { EmblemIcon } from './EmblemIcon';

interface EditCountryModalProps {
  country: Country;
  onClose: () => void;
  onSaveCountry: (updatedCountry: Country) => void;
}

export const EditCountryModal: React.FC<EditCountryModalProps> = ({
  country,
  onClose,
  onSaveCountry,
}) => {
  const [name, setName] = useState<string>(country.name);
  const [shortName, setShortName] = useState<string>(country.shortName);
  const [code, setCode] = useState<string>(country.code);
  const [regime, setRegime] = useState<RegimeType>(country.regime);
  const [color, setColor] = useState<string>(country.color);
  const [flagEmblem, setFlagEmblem] = useState<FlagEmblem>(country.flagEmblem);
  const [capital, setCapital] = useState<string>(country.capital);
  const [leader, setLeader] = useState<string>(country.leader);
  const [ideology, setIdeology] = useState<string>(country.ideology);
  const [description, setDescription] = useState<string>(country.description);
  const [activeDoctrine, setActiveDoctrine] = useState<StrategicDoctrine>(
    country.activeDoctrine || '全境深度工业化'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !capital.trim() || !leader.trim()) return;

    const updated: Country = {
      ...country,
      name: name.trim(),
      shortName: shortName.trim() || name.trim().slice(0, 4),
      code: code.trim().toUpperCase() || country.code,
      regime,
      color,
      accentColor: color,
      flagEmblem,
      capital: capital.trim(),
      leader: leader.trim(),
      ideology: ideology.trim(),
      description: description.trim(),
      activeDoctrine,
      updatedAt: new Date().toISOString(),
    };

    onSaveCountry(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
      <div
        id="edit-country-modal"
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-2xs"
              style={{ backgroundColor: color }}
            >
              <EmblemIcon name={flagEmblem} size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">修改国家档案：{country.name}</h2>
              <p className="text-xs text-slate-500 font-medium">更新政权宪制、国号、国徽、元首与核心战略</p>
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
          {/* Name & Short Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-700 block">国家全称 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                required
              />
            </div>
          </div>

          {/* Strategic Doctrine */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">核心战略国策</label>
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">国家历史概况</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition resize-none"
            />
          </div>

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
              <span>保存修改</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
