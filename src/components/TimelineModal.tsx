import React, { useState, useMemo } from 'react';
import {
  X,
  History,
  PlusCircle,
  Calendar,
  Flag,
  Globe2,
  HeartHandshake,
  Crown,
  Sparkles,
  MapPin,
  Check,
} from 'lucide-react';
import { Country, TimelineEvent, UserRole } from '../types';

interface TimelineModalProps {
  events: TimelineEvent[];
  countries: Country[];
  currentYear: number;
  userRole: UserRole;
  onClose: () => void;
  onAddEvent: (newEvent: TimelineEvent) => void;
}

type FilterType = 'all' | 'founding' | 'diplomacy' | 'era' | 'regime' | 'war';

export const TimelineModal: React.FC<TimelineModalProps> = ({
  events,
  countries,
  currentYear,
  userRole,
  onClose,
  onAddEvent,
}) => {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // New Event Form State
  const [title, setTitle] = useState<string>('');
  const [year, setYear] = useState<number>(currentYear);
  const [description, setDescription] = useState<string>('');
  const [type, setType] = useState<TimelineEvent['type']>('diplomacy');
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');

  const countryMap = useMemo(() => {
    const map = new Map<string, Country>();
    countries.forEach((c) => map.set(c.id, c));
    return map;
  }, [countries]);

  const filteredEvents = useMemo(() => {
    let list = [...events];
    if (filterType !== 'all') {
      list = list.filter((e) => e.type === filterType);
    }
    // Sort chronological ascending
    list.sort((a, b) => a.year - b.year);
    return list;
  }, [events, filterType]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newEvt: TimelineEvent = {
      id: `EVT-${Date.now().toString().slice(-4)}`,
      year,
      title: title.trim(),
      description: description.trim(),
      type,
      countryId: selectedCountryId || undefined,
      timestamp: new Date().toISOString(),
    };

    onAddEvent(newEvt);
    setShowAddForm(false);
    setTitle('');
    setDescription('');
  };

  const getEventIcon = (evtType: TimelineEvent['type']) => {
    switch (evtType) {
      case 'founding':
        return <Flag className="w-3.5 h-3.5 text-indigo-600" />;
      case 'diplomacy':
        return <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />;
      case 'era':
        return <Sparkles className="w-3.5 h-3.5 text-pink-600" />;
      case 'regime':
        return <Crown className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <Globe2 className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
      <div
        id="timeline-modal"
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-2xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">世界历史年表与大事记编年史</h2>
              <p className="text-xs text-slate-500 font-medium">
                粉陆大陆各纪元关键历史节点、建国大典与地缘条约
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {userRole === 'creator' && !showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>录入大事记</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/40 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
          {[
            { key: 'all', label: '全部事件' },
            { key: 'founding', label: '建国大典' },
            { key: 'diplomacy', label: '外交盟约' },
            { key: 'regime', label: '宪制变革' },
            { key: 'era', label: '历史纪元' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key as FilterType)}
              className={`px-3 py-1 rounded-xl font-semibold transition shrink-0 ${
                filterType === f.key
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Add Event Form (If Open) */}
        {showAddForm && (
          <form
            onSubmit={handleAddSubmit}
            className="p-4 bg-indigo-50/70 border-b border-indigo-200 text-xs space-y-3 shrink-0"
          >
            <div className="font-bold text-indigo-900 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              <span>录入新大事记节点</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <label className="font-semibold text-slate-700">事件标题 *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：粉陆创联首届全球峰会召开"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">发生年份</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">事件类型</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TimelineEvent['type'])}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                >
                  <option value="founding">建国大典</option>
                  <option value="diplomacy">外交盟约</option>
                  <option value="regime">宪制变革</option>
                  <option value="era">历史纪元</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">关联主权实体</label>
                <select
                  value={selectedCountryId}
                  onChange={(e) => setSelectedCountryId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                >
                  <option value="">-- 全球普适事件 --</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">事件详细概述</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="填写事件的深远影响与历史经过..."
                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
              >
                录入编年史
              </button>
            </div>
          </form>
        )}

        {/* Timeline Events Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
            {filteredEvents.map((evt) => {
              const country = evt.countryId ? countryMap.get(evt.countryId) : null;
              return (
                <div key={evt.id} className="relative group">
                  {/* Timeline Dot Indicator */}
                  <div className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center shadow-xs">
                    {getEventIcon(evt.type)}
                  </div>

                  {/* Card Content */}
                  <div className="bg-slate-50 hover:bg-white border border-slate-200/90 rounded-2xl p-4 transition shadow-2xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                          创联历 {evt.year} 年
                        </span>
                        {country && (
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: country.color }}
                          >
                            {country.shortName}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{evt.id}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{evt.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{evt.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
