import React, { useState } from 'react';
import { BookOpen, Calendar, Globe2, Sparkles, Check, Play, User, Clock, ArrowRight } from 'lucide-react';
import { WorkspaceItem } from '../services/workspaceService';

interface WorkspaceScenariosTabProps {
  activeWorkspace: WorkspaceItem;
  onSelectScenario?: (scenarioName: string) => void;
}

interface ScenarioDef {
  id: string;
  name: string;
  era: string;
  type: '拟实' | '架空';
  desc: string;
  majorNations: string[];
  difficulty: '标准' | '进阶' | '专家';
  isActive?: boolean;
}

const PRESET_SCENARIOS: ScenarioDef[] = [
  {
    id: 'sc_1936_dawn',
    name: '1936 全球风云·破晓',
    era: '1936年',
    type: '拟实',
    desc: '一战凡尔赛秩序面临瓦解，大萧条余波未平，欧亚大陆各大阵营蓄势待发。从莱茵河到东方战场，地缘博弈全面拉开序幕。',
    majorNations: ['德国', '苏联', '英国', '法国', '中华民国', '日本', '美国'],
    difficulty: '标准',
    isActive: true,
  },
  {
    id: 'sc_alternate_harmony',
    name: '粉陆纪元·万邦立宪与大洗牌',
    era: '架空纪元',
    type: '架空',
    desc: '粉陆大陆重构世界地缘格局，新秩序下的城邦领主自决开创粉陆，自由扩张，各大自定义势力展开地缘经济与科技争夺。',
    majorNations: ['创联核心邦', '北境联邦', '南洋共荣公约', '欧亚同盟'],
    difficulty: '进阶',
    isActive: false,
  },
];

export const WorkspaceScenariosTab: React.FC<WorkspaceScenariosTabProps> = ({
  activeWorkspace,
  onSelectScenario,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('sc_1936_dawn');

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>推演剧本库（2个剧本）</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            当前工作区支持的历史与架空剧本环境，可按需切换或进行深度推演。
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {PRESET_SCENARIOS.map((sc) => {
          const isSelected = selectedScenarioId === sc.id;
          return (
            <div
              key={sc.id}
              onClick={() => setSelectedScenarioId(sc.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-200 shadow-xs'
                  : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{sc.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      sc.type === '拟实'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                        : 'bg-purple-50 text-purple-700 border border-purple-200/60'
                    }`}
                  >
                    {sc.type}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                    {sc.era}
                  </span>
                </div>

                <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                  难度：{sc.difficulty}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-3">{sc.desc}</p>

              <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span className="font-medium text-slate-400">主要推演势力：</span>
                  <div className="flex flex-wrap gap-1">
                    {sc.majorNations.map((n) => (
                      <span
                        key={n}
                        className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectScenario) onSelectScenario(sc.name);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    sc.isActive
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600'
                  }`}
                >
                  {sc.isActive ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>正在推演</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>激活剧本</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
