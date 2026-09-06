import React, { useState } from 'react';
import {
  X,
  Flame,
  Play,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Zap,
  Activity,
  Award,
  HeartHandshake,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Country, WorldState } from '../types';

interface WorldSimulationModalProps {
  worldState: WorldState;
  onClose: () => void;
  onRunSimulationCycle: (cycleType: 'economy' | 'diplomacy' | 'crisis') => void;
  simulationLogs: string[];
}

export const WorldSimulationModal: React.FC<WorldSimulationModalProps> = ({
  worldState,
  onClose,
  onRunSimulationCycle,
  simulationLogs,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const handleRun = (type: 'economy' | 'diplomacy' | 'crisis') => {
    setIsRunning(true);
    setTimeout(() => {
      onRunSimulationCycle(type);
      setIsRunning(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
      <div
        id="world-simulation-modal"
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-sm shadow-amber-500/20">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                全球地缘战略与沙盘推演中枢
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                执行宏观经济周期结算、双边贸易关税演练与地缘危机推演
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

        {/* Action Cards */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Simulation 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 flex flex-col justify-between hover:border-indigo-300 transition">
              <div>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold mb-2">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-xs">年度经济与基建周期结算</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  依据各国所选战略国策与控制行省，自动推演人口增长、工业产出与基建红利。
                </p>
              </div>
              <button
                disabled={isRunning}
                onClick={() => handleRun('economy')}
                className="w-full mt-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-2xs transition"
              >
                <Play className="w-3.5 h-3.5" />
                <span>执行经济结算</span>
              </button>
            </div>

            {/* Simulation 2 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 flex flex-col justify-between hover:border-emerald-300 transition">
              <div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-2">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-xs">双边贸易与关税同盟结算</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  核算已签署外交条约国的关税互惠红利，增强同盟双方的经济流动性与能源储备。
                </p>
              </div>
              <button
                disabled={isRunning}
                onClick={() => handleRun('diplomacy')}
                className="w-full mt-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-2xs transition"
              >
                <Play className="w-3.5 h-3.5" />
                <span>推演贸易互通</span>
              </button>
            </div>

            {/* Simulation 3 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 flex flex-col justify-between hover:border-amber-300 transition">
              <div>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold mb-2">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-xs">地缘突发事态与和平斡旋</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  生成极地异动、海峡通航争端或矿脉勘探大事件，考验各邦国和平裁决能力。
                </p>
              </div>
              <button
                disabled={isRunning}
                onClick={() => handleRun('crisis')}
                className="w-full mt-2 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-2xs transition"
              >
                <Play className="w-3.5 h-3.5" />
                <span>生成地缘事态</span>
              </button>
            </div>
          </div>

          {/* Simulation Log Stream */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                沙盘推演记录日志
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {simulationLogs.length} 条推演记录
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 max-h-48 overflow-y-auto space-y-1.5 font-mono text-[11px]">
              {simulationLogs.length === 0 ? (
                <div className="text-slate-400 text-center py-4">暂无推演日志，点击上方卡片开始执行沙盘模拟</div>
              ) : (
                simulationLogs.map((log, idx) => (
                  <div key={idx} className="text-slate-700 flex items-start gap-1.5">
                    <span className="text-indigo-600 font-bold">›</span>
                    <span>{log}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
          >
            完成并返回地图
          </button>
        </div>
      </div>
    </div>
  );
};
