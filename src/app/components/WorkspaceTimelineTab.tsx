import React, { useState, useEffect } from 'react';
import {
  Zap,
  Flame,
  Globe2,
  Calendar,
  Filter,
  Search,
  Plus,
  Heart,
  Share2,
  Copy,
  ChevronRight,
  Shield,
  BookOpen,
  Sword,
  FileText,
  AlertTriangle,
  Sparkles,
  Check,
  TrendingUp,
  TrendingDown,
  Layers,
  X,
  Landmark,
  Target,
} from 'lucide-react';
import {
  workspaceService,
  WorkspaceItem,
  WorkspaceChronicle,
} from '../services/workspaceService';
import { useAuth } from '../context/AuthContext';

interface WorkspaceTimelineTabProps {
  workspace: WorkspaceItem;
  onOpenCommentWithTag?: (tag: string) => void;
  showToast?: (msg: string) => void;
}

const CATEGORY_CONFIG: Record<
  WorkspaceChronicle['category'],
  { label: string; bg: string; text: string; border: string; Icon: React.ComponentType<any> }
> = {
  battle: {
    label: '前线战报',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    Icon: Sword,
  },
  treaty: {
    label: '国际条约',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    Icon: FileText,
  },
  crisis: {
    label: '地缘危机',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    Icon: Zap,
  },
  politics: {
    label: '内政政局',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    Icon: Landmark,
  },
  focus: {
    label: '国策达成',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    Icon: Target,
  },
};

export const WorkspaceTimelineTab: React.FC<WorkspaceTimelineTabProps> = ({
  workspace,
  onOpenCommentWithTag,
  showToast = (msg: string) => alert(msg),
}) => {
  const { user } = useAuth();
  const [chronicles, setChronicles] = useState<WorkspaceChronicle[]>(() =>
    workspaceService.getChronicles(workspace.id)
  );

  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddingChronicle, setIsAddingChronicle] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states for adding new battle report
  const [formYear, setFormYear] = useState('1939.09');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<WorkspaceChronicle['category']>('battle');
  const [formContent, setFormContent] = useState('');
  const [formFactions, setFormFactions] = useState('');
  const [formTension, setFormTension] = useState('+5%');
  const [formAuthorRole, setFormAuthorRole] = useState('战区观察员');

  useEffect(() => {
    setChronicles(workspaceService.getChronicles(workspace.id));
  }, [workspace.id]);

  useEffect(() => {
    const handleAdd = (e: any) => {
      if (e.detail?.workspaceId === workspace.id) {
        setChronicles(workspaceService.getChronicles(workspace.id));
      }
    };
    window.addEventListener('chronicle-added', handleAdd);
    return () => window.removeEventListener('chronicle-added', handleAdd);
  }, [workspace.id]);

  // Calculate dynamic tension index
  const tensionScore = Math.min(
    95,
    Math.max(
      15,
      chronicles.reduce((acc, item) => {
        const val = parseInt(item.tensionChange || '0', 10);
        return isNaN(val) ? acc : acc + val;
      }, 25)
    )
  );

  const filteredChronicles = chronicles.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchContent = item.content.toLowerCase().includes(q);
      const matchFactions = (item.factions || []).some((f) => f.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchFactions) return false;
    }
    return true;
  });

  const handleLike = (id: string) => {
    workspaceService.toggleChronicleLike(workspace.id, id);
    setChronicles(workspaceService.getChronicles(workspace.id));
    showToast('已赞同战报与推演记录');
  };

  const handleCopy = (item: WorkspaceChronicle) => {
    const factionsStr = item.factions && item.factions.length > 0 ? ` [参演：${item.factions.join(' / ')}]` : '';
    const text = `【${item.year} 推演战报大事记】${item.title}${factionsStr}\n${item.content}\n（记录人：${item.authorName} · ${item.authorRole || '参谋'}）`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    showToast('战报公报已复制至剪贴板');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateChronicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      showToast('请完整填写战报标题与内容');
      return;
    }

    const factionsArray = formFactions
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);

    workspaceService.addChronicle(workspace.id, {
      year: formYear.trim() || workspace.era || '1939年',
      title: formTitle.trim(),
      category: formCategory,
      content: formContent.trim(),
      factions: factionsArray,
      tensionChange: formTension.trim(),
      authorName: user?.username || user?.name || '战区参谋部',
      authorRole: formAuthorRole,
    });

    setIsAddingChronicle(false);
    setFormTitle('');
    setFormContent('');
    setFormFactions('');
    showToast('推演战报大事记已载入史册');
  };

  return (
    <div className="space-y-4 py-2">
      {/* 1. TOP STRATEGIC PULSE & METRICS */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
                推演战报大事记编年轴
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/15">
                {workspace.name}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black tracking-tight truncate">
              地缘风云实录：从破晓动员到全面战局
            </h2>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 bg-white/5 border border-white/10 rounded-xl p-2 sm:px-3">
            <div>
              <div className="text-[10px] text-slate-400">全球紧张度</div>
              <div className="text-xs sm:text-sm font-black text-rose-400 flex items-center gap-1 font-mono">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>{tensionScore}%</span>
              </div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <div className="text-[10px] text-slate-400">已载入大事记</div>
              <div className="text-xs sm:text-sm font-black text-white font-mono">
                {chronicles.length} 件
              </div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <button
              type="button"
              onClick={() => setIsAddingChronicle(true)}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>载入战报</span>
            </button>
          </div>
        </div>

        {/* Global Tension Gauge Bar */}
        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-2">
          <span className="text-[10px] text-slate-400 shrink-0">地缘摩擦指数</span>
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600 transition-all duration-500 rounded-full"
              style={{ width: `${tensionScore}%` }}
            />
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-300">
            {tensionScore > 75 ? '高危临界' : tensionScore > 40 ? '剑拔弩张' : '常态对峙'}
          </span>
        </div>
      </div>

      {/* 2. CONTROLS BAR (Filters, Search & View Toggle) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200/90 rounded-xl p-2 shadow-2xs">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            全部 ({chronicles.length})
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
            const count = chronicles.filter((c) => c.category === key).length;
            const isSelected = selectedCategory === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedCategory(key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? `${cfg.bg} ${cfg.text} ring-1 ring-inset ${cfg.border}`
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <span>{cfg.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Right tools: Search & View Toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="relative min-w-[140px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="检索阵营、战报标题..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-7 pl-8 pr-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-2 py-0.5 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>时间轴</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2 py-0.5 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>图鉴网格</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. ADD BATTLE REPORT FORM MODAL / DRAWER */}
      {isAddingChronicle && (
        <div className="p-4 bg-white border border-indigo-200 rounded-2xl shadow-md space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <Sword className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-black text-slate-900">载入推演战报 / 录入历史大事记</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingChronicle(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateChronicle} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  推演发生时间 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="如：1939.09 或 1941年冬"
                  value={formYear}
                  onChange={(e) => setFormYear(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  战报性质分类
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="battle">前线战报</option>
                  <option value="treaty">国际条约</option>
                  <option value="crisis">地缘危机</option>
                  <option value="politics">内政政局</option>
                  <option value="focus">国策达成</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  紧张度预期变动
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {['+5%', '+15%', '-5%'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setFormTension(item)}
                      className={`h-8 text-xs font-bold rounded-lg border ${
                        formTension === item
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                战报标题 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="如：突入边境要塞群，主力部队完成两翼合围"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                涉及参演阵营 / 国家
              </label>
              <input
                type="text"
                placeholder="用逗号隔开，如：德意志国, 法兰西, 大英帝国"
                value={formFactions}
                onChange={(e) => setFormFactions(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                详细战况战果 / 大事纪要 <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="描述前线兵团部署、战损与战果、或外交条约要点..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingChronicle(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                确认载入史册
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. MAIN CONTENT DISPLAY (Timeline vs Grid) */}
      {filteredChronicles.length === 0 ? (
        <div className="py-12 text-center bg-white border border-slate-200/90 rounded-2xl">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600">未检索到匹配的推演战报大事记</p>
          <p className="text-[11px] text-slate-400 mt-0.5">可点击上方“载入战报”按钮亲手录入历史事件</p>
        </div>
      ) : viewMode === 'timeline' ? (
        /* TIMELINE VIEW (Vertical with elegant milestone badges) */
        <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-slate-300 before:to-indigo-200">
          {filteredChronicles.map((item, idx) => {
            const catCfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.crisis;
            const isTensionUp = item.tensionChange?.startsWith('+');
            const isCopied = copiedId === item.id;

            return (
              <div key={item.id} className="relative group">
                {/* Timeline node dot */}
                <div className="absolute -left-6 sm:-left-8 top-3.5 w-6 h-6 rounded-full bg-white border-2 border-indigo-600 shadow-xs flex items-center justify-center -translate-x-1/2 group-hover:scale-110 transition-transform">
                  <catCfg.Icon className="w-3 h-3 text-indigo-600" />
                </div>

                {/* Milestone card */}
                <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition space-y-2.5">
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-black bg-slate-900 text-white shrink-0 shadow-2xs">
                        {item.year}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${catCfg.bg} ${catCfg.text} ${catCfg.border}`}
                      >
                        {catCfg.label}
                      </span>
                      {item.tensionChange && item.tensionChange !== '0%' && (
                        <span
                          className={`text-[10px] font-mono font-bold flex items-center gap-0.5 shrink-0 ${
                            isTensionUp ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {isTensionUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>紧张度 {item.tensionChange}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
                        title="复制战报公报"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLike(item.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50/60 transition cursor-pointer text-xs"
                      >
                        <Heart className="w-3.5 h-3.5" />
                        <span className="font-mono text-[11px]">{item.likesCount || 0}</span>
                      </button>
                    </div>
                  </div>

                  {/* Title & Body */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {item.content}
                    </p>
                  </div>

                  {/* Factions Pills */}
                  {item.factions && item.factions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <span className="text-[10px] text-slate-400">涉及焦点：</span>
                      {item.factions.map((fac) => (
                        <span
                          key={fac}
                          className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[10px] font-medium"
                        >
                          {fac}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer Meta */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <span>记录人：</span>
                      <span className="font-bold text-slate-600">{item.authorName}</span>
                      {item.authorRole && (
                        <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-500 text-[9px]">
                          {item.authorRole}
                        </span>
                      )}
                    </div>
                    {onOpenCommentWithTag && (
                      <button
                        type="button"
                        onClick={() => onOpenCommentWithTag(`[关于${item.year}：${item.title}]`)}
                        className="text-indigo-600 hover:underline font-bold cursor-pointer flex items-center gap-0.5"
                      >
                        <span>发起研讨</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* GRID VIEW (Card Catalog) */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredChronicles.map((item) => {
            const catCfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.crisis;
            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-xs font-black text-slate-900 truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 text-white">
                      {item.year}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-2">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${catCfg.bg} ${catCfg.text} ${catCfg.border}`}
                    >
                      {catCfg.label}
                    </span>
                    {item.tensionChange && (
                      <span className="text-[10px] font-mono font-bold text-rose-600">
                        {item.tensionChange}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-2">
                    {item.content}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="truncate max-w-[160px]">
                    {item.factions?.join(' / ') || '大国地缘'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleLike(item.id)}
                      className="flex items-center gap-0.5 hover:text-rose-600 cursor-pointer"
                    >
                      <Heart className="w-3 h-3" />
                      <span className="font-mono">{item.likesCount || 0}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(item)}
                      className="hover:text-indigo-600 cursor-pointer p-0.5"
                      title="复制公报"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
