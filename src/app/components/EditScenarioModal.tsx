import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Scroll,
  Calendar,
  Save,
  Globe,
  Box,
  Flame,
  Users,
  Minus,
  Plus,
  ExternalLink,
  Info,
  FileText,
  Lock,
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
  onScenarioUpdated,
  onOpenWorkspaceEditor,
  showToast,
}) => {
  const [name, setName] = useState(scenario.scenarioName || scenario.name || '');
  const [era, setEra] = useState(scenario.scenarioEra || scenario.era || '1936.01.01');
  const [description] = useState(scenario.scenarioDesc || scenario.description || '');
  const [visibility, setVisibility] = useState<'public' | 'private'>(scenario.visibility || 'public');
  const [scenarioType, setScenarioType] = useState<'拟实' | '架空'>(scenario.scenarioType || '拟实');
  const [initialTension, setInitialTension] = useState(
    scenario.initialTension ?? scenario.rulesConfig?.initialTension ?? 25
  );
  const [maxAllies, setMaxAllies] = useState(scenario.rulesConfig?.maxAllies ?? 3);
  const [victoryCondition] = useState<'domination' | 'treaty' | 'endless'>(
    scenario.victoryCondition || scenario.rulesConfig?.victoryCondition || 'domination'
  );

  const initialFactions =
    scenario.coreFactions && scenario.coreFactions.length > 0
      ? scenario.coreFactions
      : ['德意志国', '苏维埃联盟', '大英帝国', '中华民国', '美利坚合众国'];
  const [factions] = useState<string[]>(initialFactions);

  if (!isOpen) return null;

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
      visibility,
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

    // 保存至工作区持久化存储
    const all = workspaceService.getWorkspaces();
    const updatedList = all.map((w) => (w.id === updatedItem.id ? updatedItem : w));
    workspaceService.saveWorkspaces(updatedList);

    onScenarioUpdated(updatedItem);
    showToast(`剧本【${trimmedName}】已保存`);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
        {/* 背景轻微遮罩 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-[2px]"
        />

        {/* 核心移动端竖屏 UI 面板：标准约 430 宽，四周留白充足，高级浅色系 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[430px] my-auto bg-white rounded-[24px] shadow-[0_12px_40px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.04)] border border-slate-200/90 overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* ======================================================== */}
          {/* 顶部区域：紫色圆角方形图标 + 标题说明 + 极简关闭按钮 */}
          {/* ======================================================== */}
          <div className="px-5 pt-5 pb-3.5 bg-white flex items-start justify-between shrink-0">
            <div className="flex items-start gap-3 min-w-0">
              {/* 左侧紫色圆角方形图标 */}
              <div className="w-10 h-10 rounded-[13px] bg-[#635BFF] flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(99,91,255,0.25)]">
                <Scroll className="w-4.5 h-4.5 stroke-[2.2]" />
              </div>

              {/* 右侧精炼标题与说明 */}
              <div className="min-w-0 pr-2">
                <h2 className="text-[17px] font-bold text-[#0F172A] leading-tight tracking-tight">
                  编辑沙盘剧本
                </h2>
                <p className="text-[12px] text-[#64748B] mt-0.5 leading-snug">
                  调整年代、权限与推演规则
                </p>
              </div>
            </div>

            {/* 右上角关闭按钮 */}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 -mr-1 -mt-0.5 rounded-lg transition cursor-pointer"
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ======================================================== */}
          {/* 表单区域：可纵向滚动，留白舒适，层级分明 */}
          {/* ======================================================== */}
          <div className="px-5 pb-4 pt-1 overflow-y-auto flex-1 space-y-3.5 text-slate-800 scrollbar-none">
            {/* ---------------- 字段 1：剧本名称 ---------------- */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>剧本名称</span>
                <Info className="w-3 h-3 text-slate-400 cursor-pointer" />
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  maxLength={50}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="如：1936 凡尔赛余晖"
                  className="w-full h-[50px] px-4 pr-16 bg-[#F7F9FC] border border-[#E2E8F0] rounded-[16px] text-[13px] font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#635BFF] focus:outline-hidden transition shadow-2xs"
                />
                <span className="absolute right-3.5 text-[11px] font-mono font-medium text-slate-400 pointer-events-none">
                  {name.length}/50
                </span>
              </div>
            </div>

            {/* ---------------- 字段 2：推演起始纪元 ---------------- */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>起始纪元</span>
                <Info className="w-3 h-3 text-slate-400 cursor-pointer" />
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  maxLength={50}
                  value={era}
                  onChange={(e) => setEra(e.target.value)}
                  placeholder="1936.01.01"
                  className="w-full h-[50px] px-4 pr-16 bg-[#F7F9FC] border border-[#E2E8F0] rounded-[16px] text-[13px] font-mono font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#635BFF] focus:outline-hidden transition shadow-2xs"
                />
                <span className="absolute right-3.5 text-[11px] font-mono font-medium text-slate-400 pointer-events-none">
                  {era.length}/50
                </span>
              </div>
            </div>

            {/* ---------------- 访问权限：公开 / 私密 ---------------- */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>访问权限</span>
                </div>
                <span className="text-[11px] font-medium text-slate-400">
                  {visibility === 'public' ? '广场全员公开可见' : '仅限个人私密归档'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 bg-[#F7F9FC] p-1 rounded-[16px] border border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`h-[38px] rounded-[12px] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    visibility === 'public'
                      ? 'bg-white text-[#635BFF] shadow-2xs border border-slate-200/90'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>公开剧本</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={`h-[38px] rounded-[12px] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    visibility === 'private'
                      ? 'bg-white text-[#635BFF] shadow-2xs border border-slate-200/90'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>私密剧本</span>
                </button>
              </div>
            </div>

            {/* ---------------- 模式选择：双并列卡片 ---------------- */}
            <div className="grid grid-cols-2 gap-2.5 pt-0.5">
              {/* 左侧：拟实沙盘 */}
              <button
                type="button"
                onClick={() => setScenarioType('拟实')}
                className={`relative p-3.5 rounded-[18px] text-left transition-all cursor-pointer flex flex-col justify-between min-h-[114px] ${
                  scenarioType === '拟实'
                    ? 'bg-[#F8F7FF] border-[1.5px] border-[#635BFF]'
                    : 'bg-white hover:bg-slate-50/60 border-[1.5px] border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-7 h-7 rounded-[10px] flex items-center justify-center transition-colors ${
                      scenarioType === '拟实'
                        ? 'bg-[#635BFF]/10 text-[#635BFF]'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 stroke-[1.8]" />
                  </div>

                  <div>
                    {scenarioType === '拟实' ? (
                      <div className="w-4 h-4 rounded-full border-[1.5px] border-[#635BFF] flex items-center justify-center bg-white">
                        <div className="w-2 h-2 rounded-full bg-[#635BFF]" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-[1.5px] border-slate-300 bg-transparent" />
                    )}
                  </div>
                </div>

                <div className="mt-2.5">
                  <div className="text-[13px] font-bold text-slate-900 leading-tight">
                    拟实沙盘
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-1 leading-[1.4]">
                    参考真实近现代地缘与势力格局
                  </div>
                </div>
              </button>

              {/* 右侧：架空推演 */}
              <button
                type="button"
                onClick={() => setScenarioType('架空')}
                className={`relative p-3.5 rounded-[18px] text-left transition-all cursor-pointer flex flex-col justify-between min-h-[114px] ${
                  scenarioType === '架空'
                    ? 'bg-[#F8F7FF] border-[1.5px] border-[#635BFF]'
                    : 'bg-white hover:bg-slate-50/60 border-[1.5px] border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-7 h-7 rounded-[10px] flex items-center justify-center transition-colors ${
                      scenarioType === '架空'
                        ? 'bg-[#635BFF]/10 text-[#635BFF]'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5 stroke-[1.8]" />
                  </div>

                  <div>
                    {scenarioType === '架空' ? (
                      <div className="w-4 h-4 rounded-full border-[1.5px] border-[#635BFF] flex items-center justify-center bg-white">
                        <div className="w-2 h-2 rounded-full bg-[#635BFF]" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-[1.5px] border-slate-300 bg-transparent" />
                    )}
                  </div>
                </div>

                <div className="mt-2.5">
                  <div className="text-[13px] font-bold text-slate-900 leading-tight">
                    架空推演
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-1 leading-[1.4]">
                    自定义世界观与虚构阵营
                  </div>
                </div>
              </button>
            </div>

            {/* ---------------- 全球紧张度 ---------------- */}
            <div className="p-4 rounded-[20px] bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-[#F43F5E]">
                    <Flame className="w-3.5 h-3.5 fill-[#F43F5E]/20" />
                  </div>
                  <span className="text-[13px] font-bold text-slate-800">
                    全球紧张度
                  </span>
                </div>
                <span className="text-[14px] font-mono font-bold text-[#F43F5E]">
                  {initialTension}%
                </span>
              </div>

              {/* 滑杆 */}
              <div className="pt-1 pb-0.5">
                <div className="relative flex items-center">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={initialTension}
                    onChange={(e) => setInitialTension(Number(e.target.value))}
                    style={{
                      background: `linear-gradient(to right, #635BFF 0%, #EC4899 ${initialTension}%, #E2E8F0 ${initialTension}%, #E2E8F0 100%)`,
                    }}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer focus:outline-hidden [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3.5px] [&::-webkit-slider-thumb]:border-[#635BFF] [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(99,91,255,0.35)] active:[&::-webkit-slider-thumb]:scale-110 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-[3.5px] [&::-moz-range-thumb]:border-[#635BFF] [&::-moz-range-thumb]:shadow-[0_2px_6px_rgba(99,91,255,0.35)] transition-all"
                  />
                </div>
              </div>

              <p className="text-[11px] text-[#64748B] leading-snug">
                决定推演开局危机程度与突发战事概率
              </p>
            </div>

            {/* ---------------- 同盟规模上限 ---------------- */}
            <div className="p-4 rounded-[20px] bg-white border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-sky-50 flex items-center justify-center text-[#0284C7]">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[13px] font-bold text-slate-800">
                    同盟规模上限
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#64748B] font-medium">
                  <span>上限 {maxAllies} 国</span>
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              {/* 步进器 */}
              <div className="flex items-center justify-center gap-6 pt-0.5">
                <button
                  type="button"
                  onClick={() => setMaxAllies((p) => Math.max(2, p - 1))}
                  className="w-11 h-9 rounded-[13px] bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition flex items-center justify-center cursor-pointer shadow-2xs"
                  title="减少"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[2.2]" />
                </button>

                <div className="font-sans text-[26px] font-bold text-[#0F172A] w-12 text-center select-none leading-none">
                  {maxAllies}
                </div>

                <button
                  type="button"
                  onClick={() => setMaxAllies((p) => Math.min(12, p + 1))}
                  className="w-11 h-9 rounded-[13px] bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition flex items-center justify-center cursor-pointer shadow-2xs"
                  title="增加"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 底部固定操作区域：按钮文字精简 */}
          {/* ======================================================== */}
          <div className="px-4.5 py-3.5 bg-white border-t border-slate-100 shrink-0 flex items-center justify-between gap-2">
            {/* 左侧：沙盘工坊 */}
            {onOpenWorkspaceEditor ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWorkspaceEditor();
                }}
                className="px-2.5 py-2 rounded-[12px] hover:bg-[#F8F7FF] text-[#635BFF] text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>沙盘工坊</span>
              </button>
            ) : (
              <div />
            )}

            {/* 右侧：取消 & 保存 */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-[12px] border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 transition cursor-pointer shadow-2xs active:scale-95"
              >
                取消
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-4.5 py-2 rounded-[12px] bg-[#635BFF] hover:bg-[#5349EE] text-white text-xs font-bold transition shadow-[0_4px_12px_rgba(99,91,255,0.28)] cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>保存</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

