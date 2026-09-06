import React, { useState } from 'react';
import {
  X,
  Calendar,
  FastForward,
  RotateCcw,
  Sparkles,
  BookOpen,
  Check,
} from 'lucide-react';
import { WorldState } from '../types';

interface WorldTimeModalProps {
  worldState: WorldState;
  onClose: () => void;
  onAdvanceYear: (years: number, newEraName?: string, eventTitle?: string) => void;
  onUpdateScenarioMeta?: (name: string, era: string, type: '拟实' | '架空', desc: string) => void;
}

export const WorldTimeModal: React.FC<WorldTimeModalProps> = ({
  worldState,
  onClose,
  onAdvanceYear,
  onUpdateScenarioMeta,
}) => {
  const [advanceAmount, setAdvanceAmount] = useState<number>(1);
  const [eraName, setEraName] = useState<string>(worldState.eraName);
  const [eventTitle, setEventTitle] = useState<string>('');

  const [scenarioName, setScenarioName] = useState<string>(worldState.scenarioName || '粉陆纪元·开天辟地');
  const [scenarioEra, setScenarioEra] = useState<string>(worldState.scenarioEra || '1936年');
  const [scenarioType, setScenarioType] = useState<'拟实' | '架空'>(worldState.scenarioType || '架空');
  const [scenarioDesc, setScenarioDesc] = useState<string>(worldState.scenarioDesc || '');

  const handleAdvanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdvanceYear(advanceAmount, eraName, eventTitle.trim() || undefined);
    if (onUpdateScenarioMeta) {
      onUpdateScenarioMeta(scenarioName, scenarioEra, scenarioType, scenarioDesc);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
      <div
        id="world-time-modal"
        className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-2xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">世界时间轴与剧本设定</h2>
              <p className="text-xs text-slate-500 font-medium">
                推进创联历史年份、演进纪元并更新剧本信息
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

        {/* Body Form */}
        <form onSubmit={handleAdvanceSubmit} className="p-6 space-y-5 text-xs overflow-y-auto max-h-[75vh]">
          {/* Current Year Display */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-1">
            <span className="text-slate-400 font-medium">当前世界时间基准</span>
            <div className="text-2xl font-bold font-mono text-indigo-700">
              创联历 {worldState.currentYear} 年
            </div>
            <div className="text-xs text-slate-600 font-medium">{worldState.eraName}</div>
          </div>

          {/* Advance Year Step Buttons */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-700 block">推演推进年限</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 5, 10, 25].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAdvanceAmount(amt)}
                  className={`py-2 rounded-xl font-bold font-mono text-xs transition border ${
                    advanceAmount === amt
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  +{amt} 年
                </button>
              ))}
            </div>
          </div>

          {/* Era Name */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">所属历史纪元名称</label>
            <input
              type="text"
              value={eraName}
              onChange={(e) => setEraName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              required
            />
          </div>

          {/* Timeline Event Memo */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">
              大事记随笔备忘 (录入历史年表)
            </label>
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="例如：全球界碑二次划定、泛大洋商贸协约生效..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          {/* Scenario Metadata Section */}
          <div className="pt-3 border-t border-slate-200/80 space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>剧本基础档案同步</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600">剧本名称</label>
                <input
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-600">剧本年代</label>
                <input
                  type="text"
                  value={scenarioEra}
                  onChange={(e) => setScenarioEra(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 text-xs"
                />
              </div>
            </div>
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
              <FastForward className="w-4 h-4" />
              <span>确认推进并保存</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
