import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Home,
  Compass,
  Bell,
  User,
  SlidersHorizontal,
  Check,
  Eye,
  Info,
} from 'lucide-react';
import { WorkspaceNavIcon } from './WorkspaceNavIcon';

interface WorkspaceIconSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkspaceIconSpecModal: React.FC<WorkspaceIconSpecModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [demoActiveTab, setDemoActiveTab] = useState<'home' | 'explore' | 'workspace' | 'bell' | 'user'>('workspace');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-fadeIn select-none">
      <div className="w-full max-w-2xl my-auto bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden relative text-slate-900 max-h-[92vh] flex flex-col">
        {/* Top Accent Strip */}
        <div className="h-1.5 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500 shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-indigo-600 flex items-center justify-center border border-violet-200/70">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                “工作区 +” 底栏导航图标 · 设计规范
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                现代生产力工具与 SaaS 移动端轻量玻璃态规范
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/70 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-5 py-5 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Section 1: 优化后的图标设计 (Hero showcase) */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
              <span>优化后的图标设计</span>
            </div>

            {/* Elevated Squircle Display Card */}
            <div className="inline-flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-violet-50/60 to-white border border-violet-100/90 shadow-[0_8px_30px_rgba(99,102,241,0.08)]">
              <div className="relative p-3 rounded-2xl bg-white/90 border border-violet-200/60 shadow-[0_4px_20px_rgba(99,102,241,0.12)]">
                <WorkspaceNavIcon status="default" size="xl" showContainer={false} />
              </div>
              <span className="mt-3 text-sm font-semibold text-indigo-600 tracking-tight">
                工作区 +
              </span>
            </div>
          </div>

          {/* Section 2: 不同状态预览 (4 State Cards) */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
              <span>不同状态预览</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* State 1: 默认状态 */}
              <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/70 flex flex-col items-center text-center">
                <WorkspaceNavIcon status="default" size="lg" />
                <span className="text-xs font-semibold text-slate-700 mt-2">默认状态</span>
                <span className="text-[10px] text-slate-400 mt-0.5">轻微玻璃态质感</span>
              </div>

              {/* State 2: 选中状态 */}
              <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/70 flex flex-col items-center text-center">
                <WorkspaceNavIcon status="active" size="lg" />
                <span className="text-xs font-semibold text-indigo-700 mt-2">选中状态</span>
                <span className="text-[10px] text-indigo-500/80 mt-0.5">柔和紫色渐变</span>
              </div>

              {/* State 3: 未激活状态 */}
              <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/70 flex flex-col items-center text-center">
                <WorkspaceNavIcon status="inactive" size="lg" />
                <span className="text-xs font-semibold text-slate-500 mt-2">未激活状态</span>
                <span className="text-[10px] text-slate-400 mt-0.5">极简线性灰阶</span>
              </div>

              {/* State 4: 悬停/展开状态 */}
              <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/70 flex flex-col items-center text-center">
                <WorkspaceNavIcon status="hover" size="lg" />
                <span className="text-xs font-semibold text-violet-700 mt-2">悬停状态</span>
                <span className="text-[10px] text-violet-500/80 mt-0.5">微交互悬浮</span>
              </div>
            </div>
          </div>

          {/* Section 3: 底部导航栏应用预览 (Interactive Real Bar simulation) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
                <span>底部导航栏应用预览</span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">轻触体验状态响应</span>
            </div>

            {/* Mock Mobile Bottom Nav Bar 1 (Active on Workspace) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-2">
              <div className="flex items-center justify-around">
                {/* Tab 1: 首页 */}
                <button
                  type="button"
                  onClick={() => setDemoActiveTab('home')}
                  className={`flex flex-col items-center py-1 px-3 rounded-xl transition cursor-pointer ${
                    demoActiveTab === 'home' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Home className="w-5 h-5" strokeWidth={1.8} />
                  <span className="text-[11px] font-medium mt-1">首页</span>
                </button>

                {/* Tab 2: 探索 */}
                <button
                  type="button"
                  onClick={() => setDemoActiveTab('explore')}
                  className={`flex flex-col items-center py-1 px-3 rounded-xl transition cursor-pointer ${
                    demoActiveTab === 'explore' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Compass className="w-5 h-5" strokeWidth={1.8} />
                  <span className="text-[11px] font-medium mt-1">探索</span>
                </button>

                {/* Tab 3: 工作区 + (Hero) */}
                <button
                  type="button"
                  onClick={() => setDemoActiveTab('workspace')}
                  className="flex flex-col items-center py-0.5 px-3 rounded-xl transition cursor-pointer active:scale-95"
                >
                  <WorkspaceNavIcon
                    isActive={demoActiveTab === 'workspace'}
                    size="md"
                  />
                  <span
                    className={`text-[11px] font-medium mt-1 transition-colors ${
                      demoActiveTab === 'workspace'
                        ? 'text-indigo-600 font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    工作区 +
                  </span>
                </button>

                {/* Tab 4: 消息 */}
                <button
                  type="button"
                  onClick={() => setDemoActiveTab('bell')}
                  className={`flex flex-col items-center py-1 px-3 rounded-xl transition cursor-pointer ${
                    demoActiveTab === 'bell' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Bell className="w-5 h-5" strokeWidth={1.8} />
                  <span className="text-[11px] font-medium mt-1">消息</span>
                </button>

                {/* Tab 5: 我的 */}
                <button
                  type="button"
                  onClick={() => setDemoActiveTab('user')}
                  className={`flex flex-col items-center py-1 px-3 rounded-xl transition cursor-pointer ${
                    demoActiveTab === 'user' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <User className="w-5 h-5" strokeWidth={1.8} />
                  <span className="text-[11px] font-medium mt-1">我的</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: 尺寸规范与设计亮点 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* 尺寸规范 */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-2">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
                <span>尺寸规范</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="p-2 bg-white rounded-xl border border-slate-200 shrink-0">
                  <WorkspaceNavIcon status="default" size="md" />
                </div>
                <div className="space-y-0.5 text-slate-600">
                  <div className="font-semibold text-slate-900">视觉尺寸 24×24px</div>
                  <div>容器规整：36×36px 扁平微倒角</div>
                  <div>文字排版：11-14px / Medium 500</div>
                  <div>层级对齐：自然融入移动端底部导航栏</div>
                </div>
              </div>
            </div>

            {/* 设计亮点 */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-2">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
                <span>设计亮点</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>现代简洁：</strong>线性图标风格，一眼即识</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>轻盈质感：</strong>微玻璃态 Liquid Glass 质感</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>视觉平衡：</strong>工作区为主体，+ 号作为右下辅助角标</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>情感化色彩：</strong>高级柔和紫调渐变，契合生产力</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            完成查看
          </button>
        </div>
      </div>
    </div>
  );
};
