import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Bell,
  ShieldCheck,
  AlertTriangle,
  Swords,
  Sparkles,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  ChevronRight,
  Clock,
  User as UserIcon,
  Plus,
  X,
  FileText,
  Radio,
  Share2,
  Check,
  ArrowUpRight,
  Globe2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Nation, AppNotification } from '../types';
import { api } from '../services/api';
import { useAppSettings } from '../services/settingsService';

interface MessagesViewProps {
  user: User | null;
  myNation: Nation | null;
  nations: Nation[];
  onNavigateTab: (tab: string) => void;
  onOpenDiplomacy?: (targetNation: Nation) => void;
  showToast: (msg: string) => void;
}

export type MessageCategory = 'all' | 'diplomacy' | 'war' | 'community' | 'system';

interface ExtendedMessage {
  id: string;
  category: MessageCategory;
  title: string;
  senderName: string;
  senderAvatar?: string;
  senderTag?: string;
  summary: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  priority?: 'high' | 'normal' | 'urgent';
  relatedNationId?: string;
  actionType?: 'view_diplomacy' | 'view_war' | 'follow_back' | 'view_profile' | 'none';
}

const PRESET_MESSAGES: ExtendedMessage[] = [
  {
    id: 'msg-seed-1',
    category: 'diplomacy',
    title: '【最高通报】关于签署《泛大陆和平互不侵犯条约》之国书照会',
    senderName: '大韩民国 · 外务总省',
    senderTag: '主权粉陆照会',
    summary: '提议在第 142 演算周期内设立中立边境非军事区，并全面恢复关税互惠互免。',
    content: `致崇高的领主及战略阁下：\n\n鉴于当前地缘走廊局势更迭，为防范边境防卫圈突发摩擦，本国最高防卫评议会决议向贵国提议建立《泛大陆和平互不侵犯条约》。\n\n条约核心要项：\n1. 双方陆上边境接壤省份撤出重装装甲师主力；\n2. 设立 50 公里常态化空域监视巡弋走廊；\n3. 互相开放稀有合金与能源贸易通道。\n\n盼请尽快签署或驳回本公牒。`,
    timestamp: '10分钟前',
    isRead: false,
    priority: 'urgent',
    actionType: 'view_diplomacy',
  },
  {
    id: 'msg-seed-2',
    category: 'war',
    title: '【前沿战况警报】北部走廊要冲爆发局部装甲巡弋冲突',
    senderName: '地缘统帅部·推演预警',
    senderTag: 'DEFENSE-ALERT',
    summary: '边境雷达矩阵监测到异动，请迅速检查军工生产线与师团驻扎阵列。',
    content: `紧急战略通报：\n\n前线雷达侦测站网于 06:15 分捕捉到未报备的机动装甲集群动向。当前边境摩擦系数上升至 42%。\n\n参谋部建议：\n- 立即核查前沿补给站储备。\n- 将步兵师由待命状态调整为边境警戒巡逻。\n- 前往作战厅查阅最新态势图。`,
    timestamp: '35分钟前',
    isRead: false,
    priority: 'high',
    actionType: 'view_war',
  },
  {
    id: 'msg-seed-3',
    category: 'community',
    title: '创作者 @龙神 赞同了您的沙盘构想，并申请加入互关联盟',
    senderName: '创作者 @龙神',
    senderTag: '架构师同行',
    summary: '“您的粉陆设定极其硬核，期待在下一期跨次元沙盘大演练中并肩作战！”',
    content: `你好！在创作者大厅看到了你刚刚发布的粉陆设定，工业产值配比和国策树逻辑非常严谨，很有代入感！\n\n已为您点赞支持，并递交了互相关注文书。希望后续能合作联创一张更大维度的全球演化沙盘！`,
    timestamp: '2小时前',
    isRead: false,
    priority: 'normal',
    actionType: 'follow_back',
  },
  {
    id: 'msg-seed-4',
    category: 'system',
    title: '【推演引擎】全局物理模拟与地缘渲染参数已更新就绪',
    senderName: '沙盘推演内核 60FPS',
    senderTag: 'KERNEL-OK',
    summary: '白纸舆图底层矢量瓦片渲染完毕，全域 193 块粉陆经济指标实时平衡完毕。',
    content: `系统运行日志：\n- 物理渲染循环：已锁定 60 FPS。\n- 多国推演调度线程：健康度 100%。\n- 语言与译名映射表：zh-CN 汉语通名校验通过。\n- 欢迎在系统设置中调整专属底色与推演基准。`,
    timestamp: '昨天 18:40',
    isRead: true,
    priority: 'normal',
    actionType: 'none',
  },
];

export const MessagesView: React.FC<MessagesViewProps> = ({
  user,
  myNation,
  nations,
  onNavigateTab,
  onOpenDiplomacy,
  showToast,
}) => {
  const { settings } = useAppSettings();

  const [messages, setMessages] = useState<ExtendedMessage[]>(() => {
    try {
      const saved = localStorage.getItem('app_messages_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return PRESET_MESSAGES;
  });

  const [selectedCategory, setSelectedCategory] = useState<MessageCategory>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ExtendedMessage | null>(null);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);

  // New message form state
  const [composeTargetNation, setComposeTargetNation] = useState('');
  const [composeCategory, setComposeCategory] = useState<MessageCategory>('diplomacy');
  const [composeTitle, setComposeTitle] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('app_messages_v1', JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Fetch real notifications from api and integrate
  useEffect(() => {
    let active = true;
    api.notifications
      .list()
      .then((res) => {
        if (!active || !res?.notifications) return;
        if (res.notifications.length === 0) return;

        const converted: ExtendedMessage[] = res.notifications.map((n) => {
          let cat: MessageCategory = 'system';
          if (n.type === 'dip_request' || n.type === 'dip_result') cat = 'diplomacy';
          else if (n.type === 'war_alert') cat = 'war';

          return {
            id: n.id,
            category: cat,
            title: n.title,
            senderName: n.relatedNationName || '地缘信息通告署',
            senderTag: cat === 'diplomacy' ? '外交照会' : cat === 'war' ? '战事预警' : '官方信函',
            summary: n.content.slice(0, 60) + (n.content.length > 60 ? '...' : ''),
            content: n.content,
            timestamp: new Date(n.createdAt).toLocaleDateString(),
            isRead: n.isRead,
            relatedNationId: n.relatedNationId,
            actionType: cat === 'diplomacy' ? 'view_diplomacy' : cat === 'war' ? 'view_war' : 'none',
          };
        });

        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const newItems = converted.filter((c) => !ids.has(c.id));
          return [...newItems, ...prev];
        });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  // Filtered list
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      if (selectedCategory !== 'all' && msg.category !== selectedCategory) return false;
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        return (
          msg.title.toLowerCase().includes(q) ||
          msg.senderName.toLowerCase().includes(q) ||
          msg.summary.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [messages, selectedCategory, searchKeyword]);

  const unreadTotal = useMemo(() => messages.filter((m) => !m.isRead).length, [messages]);

  // Actions
  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isRead: true } : m))
    );
    api.notifications.markAsRead(id).catch(() => {});
  };

  const handleMarkAllAsRead = () => {
    setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
    api.notifications.markAllAsRead().catch(() => {});
    showToast('全部消息已标为已读');
  };

  const handleDeleteMessage = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (selectedMessage?.id === id) setSelectedMessage(null);
    api.notifications.delete(id).catch(() => {});
    showToast('消息已删除');
  };

  const handleClearRead = () => {
    setMessages((prev) => prev.filter((m) => !m.isRead));
    showToast('已清理全部已读消息');
  };

  const handleSendCompose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTitle.trim() || !composeContent.trim()) {
      showToast('请填写完整的标题与正文内容');
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      const newMsg: ExtendedMessage = {
        id: `msg-user-${Date.now()}`,
        category: composeCategory,
        title: composeTitle.trim(),
        senderName: myNation?.name || user?.username || '我方中枢指挥部',
        senderTag: '已发出公牒',
        summary: composeContent.trim().slice(0, 60) + '...',
        content: composeContent.trim(),
        timestamp: '刚刚',
        isRead: true,
        priority: 'normal',
      };

      setMessages((prev) => [newMsg, ...prev]);
      setIsSending(false);
      setIsComposeModalOpen(false);
      setComposeTitle('');
      setComposeContent('');
      setComposeTargetNation('');
      showToast('通报公文已加密发出');
    }, 400);
  };

  // Category Pills config
  const CATEGORIES: { id: MessageCategory; label: string; count: number }[] = [
    { id: 'all', label: '全部', count: messages.length },
    {
      id: 'diplomacy',
      label: '外交照会',
      count: messages.filter((m) => m.category === 'diplomacy').length,
    },
    {
      id: 'war',
      label: '战事警报',
      count: messages.filter((m) => m.category === 'war').length,
    },
    {
      id: 'community',
      label: '创作者互动',
      count: messages.filter((m) => m.category === 'community').length,
    },
    {
      id: 'system',
      label: '系统推演',
      count: messages.filter((m) => m.category === 'system').length,
    },
  ];

  return (
    <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto px-3 sm:px-6 py-2 sm:py-4 animate-fadeIn pb-24">
      {/* 1. Header Bar (Avant-garde layout) */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 mb-3 border-b border-slate-200/80 gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs shrink-0"
            style={{ backgroundColor: settings.themeAccent }}
          >
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                消息中心
              </h1>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>实时通联</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block font-medium">
              粉陆照会 · 战术警报 · 创作者信函
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsComposeModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: settings.themeAccent }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">撰写牒文</span>
            <span className="sm:hidden">发信</span>
          </button>

          {unreadTotal > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer flex items-center gap-1 shadow-2xs"
              title="全部标为已读"
            >
              <CheckCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden md:inline">全部已读</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClearRead}
            className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-rose-600 transition cursor-pointer shadow-2xs"
            title="清空所有已读消息"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Filter Tabs & Search Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <span>{cat.label}</span>
              {cat.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedCategory === cat.id
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {cat.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索消息、粉陆、发件人..."
            className="w-full pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 shadow-2xs"
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={() => setSearchKeyword('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Messages List */}
      <div className="space-y-2.5">
        {filteredMessages.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">暂无相关消息</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              当前分类下暂无通讯公文或通知。您可以通过上方“撰写牒文”向其他粉陆或创作者主动发起通报。
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isDiplomacy = msg.category === 'diplomacy';
            const isWar = msg.category === 'war';
            const isCommunity = msg.category === 'community';

            return (
              <div
                key={msg.id}
                onClick={() => {
                  handleMarkAsRead(msg.id);
                  setSelectedMessage(msg);
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer group select-none ${
                  !msg.isRead
                    ? 'bg-white border-indigo-200/90 shadow-xs hover:border-indigo-300'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Category Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                        isDiplomacy
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                          : isWar
                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                          : isCommunity
                          ? 'bg-purple-50 text-purple-600 border border-purple-100'
                          : 'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {isDiplomacy ? (
                        <Globe2 className="w-4 h-4" />
                      ) : isWar ? (
                        <Swords className="w-4 h-4" />
                      ) : isCommunity ? (
                        <Sparkles className="w-4 h-4" />
                      ) : (
                        <Radio className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content preview */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Unread indicator */}
                        {!msg.isRead && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 ring-2 ring-rose-100 animate-pulse" />
                        )}

                        <span className="font-bold text-sm text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors truncate">
                          {msg.title}
                        </span>

                        {msg.senderTag && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0">
                            {msg.senderTag}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed font-normal">
                        {msg.summary}
                      </p>

                      {/* Meta footer */}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-medium">
                        <span className="text-slate-600 font-semibold">{msg.senderName}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{msg.timestamp}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions right */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteMessage(msg.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer rounded-lg hover:bg-rose-50"
                      title="删除消息"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Message Detail Reader Modal */}
      <AnimatePresence>
        {selectedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMessage(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden z-10 max-h-[85vh] flex flex-col"
            >
              {/* Modal Top Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    {selectedMessage.category} // DISPATCH
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedMessage.timestamp}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {selectedMessage.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 font-medium">
                    <span>发自：</span>
                    <span className="text-slate-800 font-bold">{selectedMessage.senderName}</span>
                    {selectedMessage.senderTag && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                        {selectedMessage.senderTag}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-mono">
                  {selectedMessage.content}
                </div>
              </div>

              {/* Modal Action Footer */}
              <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  className="px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>删除此公文</span>
                </button>

                <div className="flex items-center gap-2">
                  {selectedMessage.category === 'diplomacy' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMessage(null);
                        onNavigateTab('lobby');
                        showToast('已跳转至粉陆地缘大厅');
                      }}
                      className="px-3.5 py-2 rounded-xl text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                      style={{ backgroundColor: settings.themeAccent }}
                    >
                      <Globe2 className="w-3.5 h-3.5" />
                      <span>查看粉陆</span>
                    </button>
                  )}

                  {selectedMessage.category === 'war' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMessage(null);
                        onNavigateTab('wars');
                        showToast('已进入战区指挥部');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>战区作战厅</span>
                    </button>
                  )}

                  {selectedMessage.category === 'community' && (
                    <button
                      type="button"
                      onClick={() => {
                        showToast(`已向 ${selectedMessage.senderName} 发送回关信件`);
                        setSelectedMessage(null);
                      }}
                      className="px-3.5 py-2 rounded-xl text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                      style={{ backgroundColor: settings.themeAccent }}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>接受并回关</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedMessage(null)}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition cursor-pointer"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Compose Dispatch Modal */}
      <AnimatePresence>
        {isComposeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsComposeModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden z-10 max-h-[90vh] flex flex-col"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    起草通报牒文 / 发送消息
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setIsComposeModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendCompose} className="p-5 overflow-y-auto space-y-4">
                {/* Category select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    公牒分类
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'diplomacy', label: '外交牒文' },
                      { id: 'war', label: '战时通报' },
                      { id: 'community', label: '创作者函' },
                      { id: 'system', label: '推演记录' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setComposeCategory(c.id as MessageCategory)}
                        className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                          composeCategory === c.id
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target nation or recipient */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    目标粉陆 / 接收方
                  </label>
                  <input
                    type="text"
                    value={composeTargetNation}
                    onChange={(e) => setComposeTargetNation(e.target.value)}
                    placeholder="输入目标粉陆名称、创作者账号或【全域公开通报】"
                    className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    牒文题头
                  </label>
                  <input
                    type="text"
                    value={composeTitle}
                    onChange={(e) => setComposeTitle(e.target.value)}
                    placeholder="例如：关于建立经贸走廊及战略互信的倡议书"
                    className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                  />
                </div>

                {/* Body Content */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    正文细节与条款
                  </label>
                  <textarea
                    rows={5}
                    value={composeContent}
                    onChange={(e) => setComposeContent(e.target.value)}
                    placeholder="请阐述具体的战略合作项、条约细则或致辞内容..."
                    className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 resize-none font-mono"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsComposeModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="px-5 py-2 rounded-xl text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    style={{ backgroundColor: settings.themeAccent }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? '正在加密发送...' : '发送公牒'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
