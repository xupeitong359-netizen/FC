import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  Flag,
  Globe,
  Handshake,
  Swords,
  Layers,
  MessageSquare,
} from 'lucide-react';
import { Nation } from '../types';

export interface TaskItem {
  id: string;
  title: string;
  category: 'founding' | 'explore' | 'alliance' | 'war' | 'creation';
  desc: string;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
  rewardText: string;
  actionTab?: string;
}

interface TaskBoardBarProps {
  myNation: Nation | null;
  totalNationsCount: number;
  activeWorkspaceName?: string;
  onNavigateTab: (tab: string) => void;
  onOpenCreateNation: () => void;
}

export const TaskBoardBar: React.FC<TaskBoardBarProps> = ({
  myNation,
  totalNationsCount,
  activeWorkspaceName = '1936 全球风云沙盘',
  onNavigateTab,
  onOpenCreateNation,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Dynamic calculation of task objectives
  const tasks: TaskItem[] = [
    {
      id: 'task_found_nation',
      title: '开创粉陆',
      category: 'founding',
      desc: '在沙盘地图上开创属于您的专属粉陆并确立执政党',
      targetCount: 1,
      currentCount: myNation ? 1 : 0,
      isCompleted: Boolean(myNation),
      rewardText: '粉陆档案 + 首府地块',
      actionTab: 'my_nation',
    },
    {
      id: 'task_explore_world',
      title: '疆域探勘',
      category: 'explore',
      desc: '查看世界地图地貌与全球各国地缘分布',
      targetCount: 1,
      currentCount: 1,
      isCompleted: true,
      rewardText: '全域沙盘视图',
      actionTab: 'world_map',
    },
    {
      id: 'task_forge_alliance',
      title: '缔结盟约',
      category: 'alliance',
      desc: '创建或加入一个多边战略同盟阵营',
      targetCount: 1,
      currentCount: myNation?.allianceId ? 1 : 0,
      isCompleted: Boolean(myNation?.allianceId),
      rewardText: '阵营互保条约',
      actionTab: 'alliances',
    },
    {
      id: 'task_strategic_industry',
      title: '军工科研',
      category: 'war',
      desc: '在国家中枢开展战略科技研发或军工产能排产',
      targetCount: 1,
      currentCount: (myNation?.researchedTechIds?.length || 0) > 0 ? 1 : 0,
      isCompleted: (myNation?.researchedTechIds?.length || 0) > 0,
      rewardText: '科技点数加成',
      actionTab: 'research',
    },
    {
      id: 'task_workspace_creation',
      title: '剧本共创',
      category: 'creation',
      desc: '参与工作区剧本互动、地块数据定制或剧本推演',
      targetCount: 1,
      currentCount: 1,
      isCompleted: true,
      rewardText: '创联荣誉勋章',
      actionTab: 'workspace',
    },
  ];

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  return (
    <div
      id="task-board-bar-top"
      className="bg-white border-b border-slate-200/90 shadow-2xs transition-all z-20"
    >
      {/* Top compact bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs">
        {/* Left: Task Board Badge & Current Objective */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-bold shrink-0">
            <Trophy className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>任务</span>
          </div>

          <span className="font-mono text-slate-400 font-bold text-[11px] shrink-0">
            {completedCount}/{tasks.length}
          </span>

          {/* Quick Highlight of first incomplete task */}
          <div className="hidden sm:flex items-center gap-2 truncate">
            {tasks.find((t) => !t.isCompleted) ? (
              <span className="text-slate-600 truncate">
                当前任务：
                <strong className="text-slate-900 ml-1">
                  {tasks.find((t) => !t.isCompleted)?.title}
                </strong>
                <span className="text-slate-400 text-[11px] ml-1.5 hidden md:inline">
                  — {tasks.find((t) => !t.isCompleted)?.desc}
                </span>
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>全阶段推演使命已达成！</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Progress bar & Toggle button (2-character pure text: 展开 / 收起) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Visual Mini Progress Bar */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-500">
              {progressPercent}%
            </span>
          </div>

          {/* Toggle Button */}
          <button
            id="task-board-toggle-btn"
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1"
          >
            <span>{isExpanded ? '收起' : '展开'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded detailed task drawer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-100 bg-slate-50/60"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-2.5 rounded-xl border text-xs transition flex flex-col justify-between ${
                      task.isCompleted
                        ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
                        : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          {task.isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <Target className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          )}
                          <span className="truncate">{task.title}</span>
                        </div>
                        {task.isCompleted ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                            已成
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                            0/1
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                        {task.desc}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      <span className="text-[10px] text-slate-400 truncate">
                        {task.rewardText}
                      </span>
                      {task.isCompleted ? (
                        <button
                          type="button"
                          className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold cursor-default"
                        >
                          领取
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (task.id === 'task_found_nation') {
                              onOpenCreateNation();
                            } else if (task.actionTab) {
                              onNavigateTab(task.actionTab);
                            }
                          }}
                          className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold cursor-pointer transition"
                        >
                          前往
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
