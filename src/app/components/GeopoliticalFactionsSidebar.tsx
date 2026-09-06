import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
 Globe,
 Crown,
 Search,
 Swords,
 HeartHandshake,
 Landmark,
 Crosshair,
 ChevronRight,
 X,
 Building2,
 ShieldCheck,
 Compass,
 SlidersHorizontal,
 Sparkles,
 MapPin,
 Flame,
 AlertCircle,
 RotateCw,
 Radio,
 Flag,
 ShieldAlert,
 PlusCircle,
 Layers,
} from 'lucide-react';
import { Nation } from '../types';
import { renderEmblemIcon } from '../lib/icons';
import { TikTokIcon } from './TikTokIcon';
import { getTotalCivilianFactories } from '../lib/economyEngine';
import { getTotalMilitaryFactories } from '../lib/militaryIndustry';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface GeopoliticalFactionsSidebarProps {
 isOpen: boolean;
 onClose: () => void;
 nations: Nation[];
 myNation?: Nation | null;
 onJumpToNation: (nation: Nation) => void;
 onViewNationDetail: (nation: Nation) => void;
 onOpenDiplomacy: (nation: Nation) => void;
}

type FilterCategory = 'all' | 'war' | 'treaties' | 'mine';

export const GeopoliticalFactionsSidebar: React.FC<GeopoliticalFactionsSidebarProps> = ({
 isOpen,
 onClose,
 nations,
 myNation,
 onJumpToNation,
 onViewNationDetail,
 onOpenDiplomacy,
}) => {
 const { user } = useAuth();
 const isCreator = Boolean(
  user?.isCreator ||
  user?.isLingyuBaby ||
  user?.role === 'admin' ||
  user?.creatorId ||
  localStorage.getItem('creator_profile_auth')
 );
 const [searchTerm, setSearchTerm] = useState('');
 const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
 const [regimeFilter, setRegimeFilter] = useState('all');
 const [isSeeding, setIsSeeding] = useState(false);
 const [seedNotification, setSeedNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

 // Handle one-click seeding demo factions
 const handleSeedFactions = async () => {
  if (isSeeding) return;
  setIsSeeding(true);
  try {
   const res = await api.demo.loadShowcase();
   setSeedNotification({
    type: 'success',
    message: res.message || '成功注入历史列强政权，全球大战略格局已激活！',
   });
   window.dispatchEvent(new CustomEvent('refresh-nations'));
   setTimeout(() => {
    setSeedNotification(null);
   }, 4500);
  } catch (err: any) {
   setSeedNotification({
    type: 'error',
    message: err?.message || '注入势力数据失败，请重试',
   });
   setTimeout(() => setSeedNotification(null), 3500);
  } finally {
   setIsSeeding(false);
  }
 };

 const handleTriggerCreateWorkspace = () => {
  onClose();
  if (!isCreator) {
   window.dispatchEvent(
    new CustomEvent('app-toast', {
     detail: {
      message: '仅已注册的创作者可构筑推演沙盘，请先注册/认证创作者账户',
     },
    })
   );
   window.dispatchEvent(new CustomEvent('open-auth-register'));
   return;
  }
  window.dispatchEvent(new CustomEvent('open-workspace-wizard'));
 };

 const handleTriggerCreateNation = handleTriggerCreateWorkspace;

 // Statistics calculation
 const totalNations = nations.length;
 const totalActiveWars = useMemo(() => {
  return Math.floor(
   nations.reduce((acc, n) => acc + (n.activeWars?.length || 0), 0) / 2
  );
 }, [nations]);

 const totalProvincesCount = useMemo(() => {
  return nations.reduce((acc, n) => acc + (n.provinces?.length || 0), 0);
 }, [nations]);

 // Filtered nations
 const filteredNations = useMemo(() => {
  return nations.filter((n) => {
   // 1. Text Search
   if (searchTerm.trim()) {
    const query = searchTerm.trim().toLowerCase();
    const nameMatch = (n.name || '').toLowerCase().includes(query);
    const capitalMatch = (n.capital || '').toLowerCase().includes(query);
    const ownerMatch = (n.ownerUsername || '').toLowerCase().includes(query);
    const douyinMatch = (n.ownerDouyinName || '').toLowerCase().includes(query);
    const territoryMatch = (n.territory || '').toLowerCase().includes(query);
    const regimeMatch = (n.regime || '').toLowerCase().includes(query);

    if (!nameMatch && !capitalMatch && !ownerMatch && !douyinMatch && !territoryMatch && !regimeMatch) {
     return false;
    }
   }

   // 2. Regime Filter
   if (regimeFilter !== 'all' && n.regime !== regimeFilter) {
    return false;
   }

   // 3. Category Filter
   if (activeCategory === 'war') {
    return (n.activeWars?.length || 0) > 0;
   }
   if (activeCategory === 'treaties') {
    return (n.activeTreaties?.length || 0) > 0;
   }
   if (activeCategory === 'mine') {
    return Boolean(myNation && n.id === myNation.id);
   }

   return true;
  });
 }, [nations, searchTerm, regimeFilter, activeCategory, myNation]);

 // Unique regimes for filter dropdown
 const uniqueRegimes = useMemo(() => {
  const set = new Set<string>();
  nations.forEach((n) => {
   if (n.regime) set.add(n.regime);
  });
  return Array.from(set);
 }, [nations]);

 return (
  <AnimatePresence>
   {isOpen && (
    <>
     {/* Subtle Mobile-Only Touch-To-Dismiss Backing (Zero background blur on desktop so map remains crisp) */}
     <motion.div
      key="factions-sidebar-mobile-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="sm:hidden absolute inset-0 z-40 bg-black/40"
     />

     {/* Tactical Geopolitical Factions Sidebar */}
     <motion.aside
      key="geopolitical-factions-sidebar"
      initial={{ x: '100%', opacity: 0.7 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{
       x: '100%',
       opacity: 0.6,
       transition: {
        duration: 0.25,
        ease: [0.32, 0, 0.67, 0],
       },
      }}
      transition={{
       type: 'spring',
       stiffness: 340,
       damping: 28,
       mass: 0.85,
      }}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-0 right-0 bottom-0 z-40 w-[92vw] sm:w-96 md:w-[410px] max-w-[440px] bg-white text-slate-800 border-l border-slate-200/90 shadow-2xl backdrop-blur-2xl flex flex-col font-sans overflow-hidden"
      style={{
       boxShadow: `
        -15px 0 35px -5px rgba(0, 0, 0, 0.12),
        inset 1px 0 0 0 rgba(255, 255, 255, 0.8)
       `,
      }}
     >
      {/* Top Military Dossier Bar */}
      <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200 relative flex-shrink-0">
       <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
         <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center flex-shrink-0">
          <Globe className="w-4.5 h-4.5" />
         </div>
         <div className="min-w-0">
          <div className="flex items-center gap-1.5">
           <span className="text-[10px] font-mono tracking-widest text-indigo-600 uppercase font-semibold">
            GEOPOLITICAL LEDGER
           </span>
           <span className={`w-1.5 h-1.5 rounded-full ${totalNations > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'}`} />
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate flex items-center gap-2">
           世界地缘势力清册
           <span className={`text-xs font-mono font-bold px-1.5 py-0.2 rounded border ${
            totalNations > 0 
             ? 'bg-slate-100 text-indigo-700 border-slate-200' 
             : 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
           }`}>
            {totalNations > 0 ? `${totalNations} 方` : '待勘定 0 方'}
           </span>
          </h3>
         </div>
        </div>

        <button
         type="button"
         onClick={onClose}
         className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-transparent hover:border-slate-200 transition cursor-pointer flex-shrink-0"
         title="收起势力侧边栏"
        >
         <X className="w-4 h-4" />
        </button>
       </div>
      </div>

      {/* Toast notification for seeding or operations */}
      {seedNotification && (
       <div className={`mx-3 mt-2.5 px-3 py-2 rounded-lg border flex items-center gap-2 text-xs font-semibold animate-fadeIn ${
        seedNotification.type === 'success'
         ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
         : 'bg-rose-50 border-rose-200 text-rose-800'
       }`}>
        <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
        <span className="flex-1">{seedNotification.message}</span>
       </div>
      )}

      {/* Pinned World Factions Advisory & Status Banner (置顶这个提示栏 · 优化世界势力提示) */}
      {totalNations === 0 ? (
       <div className="mx-3 mt-2.5 p-3 rounded-xl bg-amber-50/90 border border-amber-200/90 shadow-2xs flex flex-col gap-2 shrink-0">
        <div className="flex items-start gap-2.5">
         <div className="w-7 h-7 rounded-lg bg-amber-100/90 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600" />
         </div>
         <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
           <span className="font-black text-xs text-amber-950">【地缘态势感知】沙盘待勘界</span>
           <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200/80 text-amber-900 font-mono font-bold">
            待入驻 0 方
           </span>
          </div>
          <p className="text-[11px] text-amber-900/90 leading-relaxed mt-0.5">
            当前沙盘尚未入驻主权势力。各位领主可一键导入经典推演列强，或由认证创作者构筑全新沙盘。
          </p>
         </div>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-amber-200/70">
         <button
          type="button"
          onClick={handleSeedFactions}
          disabled={isSeeding}
          className="flex-1 py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
         >
          {isSeeding ? (
           <RotateCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
           <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
          )}
          <span>{isSeeding ? '正在注入列强...' : '一键注入历史大战略列强'}</span>
         </button>
         <button
          type="button"
          onClick={handleTriggerCreateWorkspace}
          className="py-1.5 px-3 rounded-lg bg-white hover:bg-amber-100/70 active:scale-95 text-amber-800 border border-amber-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
          title={isCreator ? '分步构筑推演沙盘（创作者向导）' : '仅已注册的创作者可以跳转'}
         >
          <Layers className="w-3.5 h-3.5 text-amber-600" />
          <span>构筑推演沙盘</span>
         </button>
        </div>
       </div>
      ) : (
       <div className="mx-3 mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
         <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
          <Globe className="w-3.5 h-3.5" />
         </div>
         <div className="min-w-0">
          <div className="text-[11px] font-bold text-slate-800 truncate">
           地缘格局已勘定 · {totalNations} 方主权势力参演
          </div>
          <div className="text-[10px] text-slate-500 font-sans">
           {totalActiveWars > 0 ? `当前处于战时态势 (${totalActiveWars} 处交火线)` : '全球处于和平互保状态'}
          </div>
         </div>
        </div>
        <button
         type="button"
         onClick={handleSeedFactions}
         disabled={isSeeding}
         className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200/60 px-2 py-1 rounded-md transition cursor-pointer shrink-0 flex items-center gap-1"
         title="重新注入或重置历史大战略列强"
        >
         <RotateCw className={`w-3 h-3 ${isSeeding ? 'animate-spin' : ''}`} />
         <span>重置列强</span>
        </button>
       </div>
      )}

      {/* Tactical Statistics Strip */}
      <div className="grid grid-cols-3 gap-2 px-3 pt-2.5 text-center font-mono shrink-0">
       <div className="bg-slate-50 border border-slate-200/80 rounded-lg py-1 px-1.5">
        <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
         <Landmark className="w-3 h-3 text-indigo-600" />
         <span>列强政权</span>
        </div>
        <div className="text-xs font-bold text-slate-800 mt-0.5">
         {totalNations > 0 ? totalNations : <span className="text-amber-600 text-[11px]">0 (待入驻)</span>}
        </div>
       </div>

       <div className="bg-slate-50 border border-slate-200/80 rounded-lg py-1 px-1.5">
        <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
         <Swords className="w-3 h-3 text-rose-600" />
         <span>交战火线</span>
        </div>
        <div className={`text-xs font-bold mt-0.5 ${totalActiveWars > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
         {totalActiveWars > 0 ? `${totalActiveWars} 处` : <span className="text-slate-400 text-[11px]">0 (和平)</span>}
        </div>
       </div>

       <div className="bg-slate-50 border border-slate-200/80 rounded-lg py-1 px-1.5">
        <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
         <MapPin className="w-3 h-3 text-amber-600" />
         <span>总辖省份</span>
        </div>
        <div className="text-xs font-bold text-amber-700 mt-0.5">
         {totalProvincesCount > 0 ? totalProvincesCount : <span className="text-slate-400 text-[11px]">待划分</span>}
        </div>
       </div>
      </div>

      {/* Search and Filter Section */}
      <div className="p-3 bg-white border-b border-slate-200 space-y-2 flex-shrink-0">
       {/* Search input */}
       <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        <input
         type="text"
         value={searchTerm}
         onChange={(e) => setSearchTerm(e.target.value)}
         placeholder="搜索国家、首都、疆域、领主、政体..."
         className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all font-sans"
        />
        {searchTerm && (
         <button
          type="button"
          onClick={() => setSearchTerm('')}
          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 text-xs"
         >
          ×
         </button>
        )}
       </div>

       {/* Category Filter Pills & Regime Selector */}
       <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
         <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`px-2 py-1 rounded text-[11px] font-semibold transition whitespace-nowrap cursor-pointer ${
           activeCategory === 'all'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70'
          }`}
         >
          全部 ({nations.length})
         </button>

         <button
          type="button"
          onClick={() => setActiveCategory('war')}
          className={`px-2 py-1 rounded text-[11px] font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
           activeCategory === 'war'
            ? 'bg-rose-600 text-white shadow-xs'
            : 'bg-slate-100 text-slate-600 hover:text-rose-600 border border-slate-200/70'
          }`}
         >
          <Swords className="w-3 h-3 text-rose-500" />
          交战中
         </button>

         <button
          type="button"
          onClick={() => setActiveCategory('treaties')}
          className={`px-2 py-1 rounded text-[11px] font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
           activeCategory === 'treaties'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'bg-slate-100 text-slate-600 hover:text-emerald-600 border border-slate-200/70'
          }`}
         >
          <HeartHandshake className="w-3 h-3 text-emerald-500" />
          已缔约
         </button>

         {myNation && (
          <button
           type="button"
           onClick={() => setActiveCategory('mine')}
           className={`px-2 py-1 rounded text-[11px] font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
            activeCategory === 'mine'
             ? 'bg-amber-600 text-white shadow-xs'
             : 'bg-slate-100 text-slate-600 hover:text-amber-700 border border-slate-200/70'
           }`}
          >
           <Crown className="w-3 h-3 text-amber-500" />
           我的国家
          </button>
         )}
        </div>

        {uniqueRegimes.length > 0 && (
         <select
          value={regimeFilter}
          onChange={(e) => setRegimeFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-[11px] rounded px-1.5 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer max-w-[90px] truncate"
          title="按政体筛选"
         >
          <option value="all">所有政体</option>
          {uniqueRegimes.map((r) => (
           <option key={r} value={r}>
            {r}
           </option>
          ))}
         </select>
        )}
       </div>
      </div>

      {/* Factions Scrollable List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
       {filteredNations.length === 0 ? (
        totalNations === 0 ? (
         /* State A: Global Zero Nations (Tactical Situation Briefing & Seeding Actions) */
         <div className="py-6 px-3 text-center space-y-4 animate-fadeIn">
          {/* Radar Scanner Animation Totem */}
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
           <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-ping opacity-25" />
           <div className="absolute inset-1.5 rounded-full border border-indigo-500/30 border-dashed animate-spin duration-1000" style={{ animationDuration: '18s' }} />
           <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
            <Radio className="w-6 h-6 text-indigo-600 animate-pulse" />
           </div>
          </div>

          <div className="space-y-1.5 max-w-xs mx-auto">
           <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-mono font-bold tracking-wider uppercase">
            STATUS: UNCLAIMED CONTINENT
           </div>
           <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
            世界地缘格局待勘定 · 暂无主权势力
           </h4>
           <p className="text-xs text-slate-500 leading-relaxed">
            推演沙盘拓扑已初始化，尚未有领主开创粉陆或部署常备驻军。您可在此注入历史大战略列强预设，或开创专属粉陆。
           </p>
          </div>

          {/* Action Cards */}
          <div className="space-y-2 pt-1 text-left max-w-sm mx-auto">
           {/* Option 1: Seed preset Great Powers */}
           <button
            type="button"
            onClick={handleSeedFactions}
            disabled={isSeeding}
            className="w-full p-3 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200 text-left transition-all active:scale-[0.99] cursor-pointer group shadow-2xs"
           >
            <div className="flex items-center justify-between">
             <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
               {isSeeding ? (
                <RotateCw className="w-4 h-4 animate-spin text-white" />
               ) : (
                <Sparkles className="w-4 h-4 text-white group-hover:scale-110 transition" />
               )}
              </div>
              <div>
               <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>一键注入历史大战略列强</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-medium">
                 推荐
                </span>
               </div>
               <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                载入索拉利亚、瓦洛里亚、克拉格、爱丽西亚等 4 大标准政权体系
               </div>
              </div>
             </div>
             <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0 group-hover:translate-x-0.5 transition" />
            </div>
           </button>

           {/* Option 2: Creator Sandbox Wizard */}
           <button
            type="button"
            onClick={handleTriggerCreateWorkspace}
            className="w-full p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 text-left transition-all active:scale-[0.99] cursor-pointer group shadow-2xs"
            title={isCreator ? '分步构筑推演沙盘（创作者向导）' : '仅已注册的创作者可以跳转'}
           >
            <div className="flex items-center justify-between">
             <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
               <Sparkles className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition" />
              </div>
              <div>
               <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>分步构筑推演沙盘</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 font-medium">创作者专属</span>
               </div>
               <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                设定年代纪元、地缘规则与世界观公报，以创作者身份独立构筑沙盘
               </div>
              </div>
             </div>
             <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0 group-hover:translate-x-0.5 transition" />
            </div>
           </button>
          </div>
         </div>
        ) : (
         /* State B: Search or Filter resulted in 0 matches */
         <div className="py-12 px-4 text-center text-slate-500 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
           <Search className="w-6 h-6 text-slate-400" />
          </div>
          <div className="space-y-1">
           <p className="text-xs font-bold text-slate-800">未找到符合筛选条件的地缘国家</p>
           <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
            {searchTerm
             ? `未检索到包含「${searchTerm}」的势力名称、首都或领主`
             : '当前分类与政体筛选组合下暂无对应政权'}
           </p>
          </div>
          <button
           type="button"
           onClick={() => {
            setSearchTerm('');
            setActiveCategory('all');
            setRegimeFilter('all');
           }}
           className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
           <RotateCw className="w-3.5 h-3.5" />
           <span>重置所有筛选</span>
          </button>
         </div>
        )
       ) : (
        filteredNations.map((nation) => {
         const isMine = Boolean(myNation && nation.id === myNation.id);
         const isAtWar = (nation.activeWars || []).length > 0;
         const activeWars = nation.activeWars || [];
         const activeTreaties = nation.activeTreaties || [];
         const provincesCount = (nation.provinces || []).length;

         // Industrial power calculation
         const totalCivFactories = getTotalCivilianFactories(nation);
         const totalMilFactories = getTotalMilitaryFactories(nation);

         return (
          <div
           key={nation.id}
           className={`group relative bg-white hover:bg-slate-50/80 border rounded-xl transition-all duration-150 overflow-hidden shadow-2xs ${
            isMine
             ? 'border-amber-300 hover:border-amber-400'
             : isAtWar
             ? 'border-rose-300 hover:border-rose-400'
             : 'border-slate-200 hover:border-indigo-300'
           }`}
          >
           {/* Left Flag Accent Stripe */}
           <div
            className="absolute top-0 bottom-0 left-0 w-1.5"
            style={{ backgroundColor: nation.flagColor || '#6366f1' }}
           />

           <div className="pl-3.5 pr-3 py-2.5">
            {/* Top: Country Identity & Status */}
            <div className="flex items-start justify-between gap-2">
             <div className="min-w-0 flex items-center gap-2">
              {/* Emblem Avatar */}
              <div
               className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-xs border border-white/20"
               style={{ backgroundColor: nation.flagColor || '#6366f1' }}
              >
               {renderEmblemIcon(nation.emblemIcon, { className: 'w-4.5 h-4.5' })}
              </div>

              <div className="min-w-0">
               <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                 {nation.name}
                </h4>
                {isMine && (
                 <span className="text-[9px] px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono font-bold">
                  领主本国
                 </span>
                )}
               </div>
               <p className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                <span>{nation.regime || '主权国家'}</span>
                {nation.ideology && (
                 <>
                  <span>·</span>
                  <span className="text-slate-400">{nation.ideology}</span>
                 </>
                )}
               </p>
              </div>
             </div>

             {/* Quick Jump / Locate Button */}
             <button
              type="button"
              onClick={() => onJumpToNation(nation)}
              className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg border border-slate-200 hover:border-indigo-200 transition cursor-pointer flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold"
              title="在世界地图上对焦此国家视角"
             >
              <Crosshair className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">对焦</span>
             </button>
            </div>

            {/* Middle: Geographic & Strategic Metrics Grid */}
            <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-3 gap-1.5 text-[10px] font-mono text-slate-700">
             <div className="bg-slate-50 px-1.5 py-1 rounded border border-slate-100">
              <span className="text-slate-400 block text-[9px]">首都</span>
              <span className="font-bold text-slate-800 truncate block">
               {nation.capital || '—'}
              </span>
             </div>

             <div className="bg-slate-50 px-1.5 py-1 rounded border border-slate-100">
              <span className="text-slate-400 block text-[9px]">领土省份</span>
              <span className="font-bold text-amber-700">
               {provincesCount > 0 ? `${provincesCount} 省` : nation.territory || '1 省'}
              </span>
             </div>

             <div className="bg-slate-50 px-1.5 py-1 rounded border border-slate-100">
              <span className="text-slate-400 block text-[9px]">工矿产能</span>
              <span className="font-bold text-indigo-700">
               {totalCivFactories + totalMilFactories} 座
              </span>
             </div>
            </div>

            {/* Leader & Douyin Row */}
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
             <div className="flex items-center gap-1.5 truncate">
              <span className="text-slate-400">领主:</span>
              <span className="font-medium text-slate-700 truncate">
               {nation.ownerUsername}
              </span>
              {nation.ownerDouyinName && (
               <span className="inline-flex items-center gap-0.5 text-slate-500">
                <TikTokIcon className="w-2.5 h-2.5 text-rose-500" />
                {nation.ownerDouyinName}
               </span>
              )}
             </div>
            </div>

            {/* War & Treaty Status Alerts */}
            {isAtWar && (
             <div className="mt-2 p-1.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-rose-500 flex-shrink-0 animate-pulse" />
              <span className="truncate">
               交战中: 与{' '}
               {activeWars.map((w) => w.withNationName).join(', ')}
              </span>
             </div>
            )}

            {!isAtWar && activeTreaties.length > 0 && (
             <div className="mt-2 p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-500 flex-shrink-0" />
              <span className="truncate">
               已签署 {activeTreaties.length} 项和平/同盟条约
              </span>
             </div>
            )}

            {/* Action Buttons Row */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 justify-end">
             <button
              type="button"
              onClick={() => onViewNationDetail(nation)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold border border-slate-200 transition cursor-pointer"
             >
              国家档案
             </button>

             <button
              type="button"
              onClick={() => onOpenDiplomacy(nation)}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold border border-indigo-600 transition cursor-pointer flex items-center gap-1 shadow-2xs"
             >
              <Swords className="w-3 h-3 text-indigo-100" />
              外交派遣
             </button>
            </div>
           </div>
          </div>
         );
        })
       )}
      </div>

      {/* Bottom Status bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between flex-shrink-0 font-mono">
       {totalNations === 0 ? (
        <>
         <span className="text-amber-700 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-amber-600" />
          <span>沙盘待勘界 · 暂无入驻势力</span>
         </span>
         <span className="text-slate-400">支持一键载入列强或创作者构筑沙盘</span>
        </>
       ) : (
        <>
         <span>共 {filteredNations.length} / {nations.length} 方地缘势力</span>
         <span className="text-slate-400">点击「对焦」锁定地图坐标</span>
        </>
       )}
      </div>
     </motion.aside>
    </>
   )}
  </AnimatePresence>
 );
};
