import React from 'react';
import {
  Globe,
  Compass,
  Calendar,
  PlusCircle,
  ShieldCheck,
  UserCheck,
  Search,
  History,
  Layers,
  FileDown,
  RotateCcw,
  Sparkles,
  LogOut,
  ListFilter,
  Flame,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { CreatorProfile, UserRole, WorldState } from '../types';

interface TopNavbarProps {
  userRole: UserRole;
  creatorProfile: CreatorProfile | null;
  worldState: WorldState;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCreatorModal: () => void;
  onSwitchToVisitor: () => void;
  onOpenTimeModal: () => void;
  onOpenCreateCountryModal: () => void;
  onOpenTimelineModal: () => void;
  onOpenSimulationModal: () => void;
  onToggleCountryList: () => void;
  isCountryListOpen: boolean;
  onExportWorld: () => void;
  onResetWorld: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  userRole,
  creatorProfile,
  worldState,
  searchQuery,
  onSearchChange,
  onOpenCreatorModal,
  onSwitchToVisitor,
  onOpenTimeModal,
  onOpenCreateCountryModal,
  onOpenTimelineModal,
  onOpenSimulationModal,
  onToggleCountryList,
  isCountryListOpen,
  onExportWorld,
  onResetWorld,
}) => {
  return (
    <header
      id="top-navigation-bar"
      className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 z-30 select-none text-slate-800 shadow-xs"
    >
      {/* Brand & World Title */}
      <div className="flex items-center gap-3 min-w-fit">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/20">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5 font-sans">
              粉陆创联全球世界网
              <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold border border-indigo-200">
                T4new
              </span>
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 leading-none mt-0.5 font-medium">
            全域交互式大战略地理测绘与万邦建国推演沙盘
          </p>
        </div>
      </div>

      {/* World Scenario & Timeline Badge */}
      <div className="hidden xl:flex items-center gap-2 bg-slate-50/90 px-3.5 py-1.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <span className="flex items-center gap-1 font-semibold text-indigo-700">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            {worldState.scenarioName || '粉陆纪元'}
          </span>
          <span className="text-slate-300">·</span>
          <span className="px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-700 font-mono text-[11px] font-medium">
            {worldState.scenarioEra || '1936年'}
          </span>
          <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 text-[11px] font-medium">
            {worldState.scenarioType || '架空'}
          </span>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1 text-slate-600 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>创联历 {worldState.currentYear} 年</span>
            <span className="text-slate-400 text-[11px]">({worldState.eraName})</span>
          </div>
        </div>

        {userRole === 'creator' && (
          <button
            id="btn-edit-world-time"
            onClick={onOpenTimeModal}
            className="text-[11px] px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors font-medium ml-1"
            title="创作者可推进世界时间与历史纪元"
          >
            调整时间
          </button>
        )}
      </div>

      {/* Global Search */}
      <div className="flex-1 max-w-xs relative hidden md:block">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id="global-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="搜索国家、首都、元首、行省..."
          className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Toggle Country List */}
        <button
          id="btn-toggle-country-list"
          onClick={onToggleCountryList}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition shadow-2xs ${
            isCountryListOpen
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-500/20'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
          }`}
          title="查看全球主权国家总表与数据排行"
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">主权名录</span>
          <span className="text-[10px] px-1 rounded-full bg-slate-100 text-slate-600 font-mono font-bold group-hover:bg-slate-200">
            {worldState.countries.length}
          </span>
        </button>

        {/* Timeline Chronicle */}
        <button
          id="btn-open-timeline"
          onClick={onOpenTimelineModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs"
          title="查看世界大事记与历史年表"
        >
          <History className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">历史年表</span>
        </button>

        {/* Geopolitical Sandtable Simulation */}
        <button
          id="btn-open-simulation"
          onClick={onOpenSimulationModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs"
          title="开启地缘战略与国策推演"
        >
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">沙盘推演</span>
        </button>

        {/* Create Country Action (Creator only) */}
        {userRole === 'creator' && (
          <button
            id="btn-create-country"
            onClick={onOpenCreateCountryModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/25 transition"
            title="创立新主权国家并划定领土"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>新建国家</span>
          </button>
        )}

        <div className="h-5 w-px bg-slate-200 mx-0.5 hidden sm:block" />

        {/* Creator Authentication Status */}
        {userRole === 'creator' && creatorProfile ? (
          <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-xl">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <div className="text-left hidden md:block">
              <div className="text-[11px] font-bold text-indigo-900 leading-tight">
                {creatorProfile.identityName}
              </div>
              <div className="text-[10px] text-indigo-600 font-mono leading-none">
                {creatorProfile.creatorCode}
              </div>
            </div>
            <button
              onClick={onOpenCreatorModal}
              className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 underline ml-1"
              title="查看创作者申请与剧本信息"
            >
              剧本中心
            </button>
            <button
              id="btn-switch-to-visitor"
              onClick={onSwitchToVisitor}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="切换为普通游玩者模式"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            id="btn-open-creator-auth"
            onClick={onOpenCreatorModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition"
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-300" />
            <span>创作者认证</span>
          </button>
        )}

        {/* Extra Export / Reset */}
        <button
          onClick={onExportWorld}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition"
          title="导出世界存档数据"
        >
          <FileDown className="w-4 h-4" />
        </button>
        <button
          onClick={onResetWorld}
          className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
          title="重置世界至初始设定"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
