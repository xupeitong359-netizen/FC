import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Scroll,
  Calendar,
  Save,
  Flag,
  Users,
  Compass,
  Zap,
  Sliders,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { WorkspaceItem, workspaceService } from '../services/workspaceService';
import { Nation } from '../types';

interface EditScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: WorkspaceItem;
  nations: Nation[];
  onScenarioUpdated: (updated: WorkspaceItem) => void;
  onOpenWorkspaceEditor?: () => void;
  showToast: (msg: string) => void;
}

export const EditScenarioModal: React.FC<EditScenarioModalProps> = ({
  isOpen,
  onClose,
  scenario,
  nations,
  onScenarioUpdated,
  onOpenWorkspaceEditor,
  showToast,
}) => {
  const [name, setName] = useState(scenario.scenarioName || scenario.name || '');
  const [era, setEra] = useState(scenario.scenarioEra || scenario.era || '1936.01.01');
  const [description, setDescription] = useState(scenario.scenarioDesc || scenario.description || '');
  const [scenarioType, setScenarioType] = useState<'拟实' | '架空'>(scenario.scenarioType || '拟实');
  const [initialTension, setInitialTension] = useState(scenario.initialTension ?? scenario.rulesConfig?.initialTension ?? 35);
  const [maxAllies, setMaxAllies] = useState(scenario.rulesConfig?.maxAllies ?? 3);
  const [victoryCondition, setVictoryCondition] = useState<'domination' | 'treaty' | 'endless'>(
    scenario.victoryCondition || scenario.rulesConfig?.victoryCondition || 'domination'
  );

  // Core Factions (array of strings)
  const initialFactions = scenario.coreFactions && scenario.coreFactions.length > 0
    ? scenario.coreFactions
    : ['德意志国', '苏维埃联盟', '大英帝国', '中华民国', '美利坚合众国'];
  const [factions, setFactions] = useState<string[]>(initialFactions);

  if (!isOpen) return null;

  const handleToggleFaction = (nationName: string) => {
    setFactions((prev) =>
      prev.includes(nationName) ? prev.filter((f) => f !== nationName) : [...prev, nationName]
    );
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showToast('请输入剧本名称');
      return;
    }

    const updatedItem: WorkspaceItem = {
      ...scenario,
      name: trimmedName,
      scenarioName: trimmedName,
      era: era.trim() || '1936.01.01',
      scenarioEra: era.trim() || '1936.01.01',
      description: description.trim(),
      scenarioDesc: description.trim(),
      scenarioType,
      coreFactions: factions,
      initialTension,
      victoryCondition,
      rulesConfig: {
        ...scenario.rulesConfig,
        maxAllies,
        initialTension,
        victoryCondition,
      },
      updatedAt: new Date().toISOString(),
    };

    // Save to workspace storage
    const all = workspaceService.getWorkspaces();
    const updatedList = all.map((w) => (w.id === updatedItem.id ? updatedItem : w));
    workspaceService.saveWorkspaces(updatedList);

    onScenarioUpdated(updatedItem);
    showToast(`剧本【${trimmedName}】设定已更新`);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                <Scroll className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  继续编辑沙盘推演剧本
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  调整起始年代、推演主线、核心参演阵营与同盟规则
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Form */}
          <div className="p-5 overflow-y-auto flex-1 space-y-5 text-slate-800">
            {/* Scenario Name & Start Era */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">剧本名称</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：1936 凡尔赛余晖 / 1939 闪电战风暴"
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>推演起始纪元</span>
                </label>
                <input
                  type="text"
                  value={era}
                  onChange={(e) => setEra(e.target.value)}
                  placeholder="如 1936.01.01"
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition"
                />
              </div>
            </div>

            {/* Scenario Type Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScenarioType('拟实')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  scenarioType === '拟实'
                    ? 'border-indigo-500 bg-indigo-50/70'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">拟实历史沙盘</div>
                <div className="text-[11px] text-slate-500 mt-0.5">参考真实近现代地缘板块与势力范围</div>
              </button>

              <button
                type="button"
                onClick={() => setScenarioType('架空')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  scenarioType === '架空'
                    ? 'border-indigo-500 bg-indigo-50/70'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">架空假想推演</div>
                <div className="text-[11px] text-slate-500 mt-0.5">开放式自定义世界观、虚拟阵营与粉陆规则</div>
              </button>
            </div>

            {/* Global Tension & Alliance Cap */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-rose-500" />
                    <span>启动时全球紧张度</span>
                  </span>
                  <span className="font-mono text-rose-600 font-black">{initialTension}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={initialTension}
                  onChange={(e) => setInitialTension(Number(e.target.value))}
                  className="w-full accent-rose-600"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sky-500" />
                    <span>同盟成员规模上限</span>
                  </span>
                  <span className="font-mono text-sky-600 font-black">{maxAllies} 国</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMaxAllies((p) => Math.max(2, p - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center font-mono font-bold text-sm text-slate-900">
                    最多 {maxAllies} 个国家
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaxAllies((p) => Math.min(12, p + 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Victory Condition */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">终局决胜评判准则</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'domination', label: '大陆绝对征服', desc: '击溃并占领全部主要敌对国家' },
                  { key: 'treaty', label: '条约均势停战', desc: '通过外交条约与公约达成战后均势' },
                  { key: 'endless', label: '无尽演进沙盒', desc: '自由不设终局，永久动态推演' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setVictoryCondition(item.key as any)}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                      victoryCondition === item.key
                        ? 'border-indigo-500 bg-indigo-50/70 font-bold text-indigo-950'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs">{item.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Core Factions selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-slate-500" />
                  <span>核心参演阵营与国家</span>
                </label>
                <span className="text-[11px] text-slate-500">已选 {factions.length} 个主要国家</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {nations.map((n) => {
                  const isSelected = factions.includes(n.name);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleToggleFaction(n.name)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: n.flagColor || '#6366f1' }}
                      />
                      <span>{n.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scenario Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">剧本背景概要与初始地缘危机</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="撰写剧本故事背景、战役导火索或主要阵营利益冲突..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-3.5 bg-slate-50/90 border-t border-slate-200/80 flex items-center justify-between shrink-0">
            {onOpenWorkspaceEditor ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWorkspaceEditor();
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>进入沙盘工坊深度排布</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            ) : <div />}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                取消
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>保存剧本设定</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
