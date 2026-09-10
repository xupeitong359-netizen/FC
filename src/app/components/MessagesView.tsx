import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  User as UserIcon,
  Handshake,
  Bell,
  FileText,
  Search,
  MoreHorizontal,
  Archive,
  ChevronRight,
  CheckCheck,
  Trash2,
  X,
  Send,
  Check,
  RotateCcw,
  Sparkles,
  Shield,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Nation, AllianceFaction } from '../types';
import { strategicStorage } from '../services/strategicGameplayService';

interface MessagesViewProps {
  user: User | null;
  myNation: Nation | null;
  nations: Nation[];
  onNavigateTab: (tab: string) => void;
  onOpenDiplomacy?: (targetNation: Nation) => void;
  showToast: (msg: string) => void;
}

export type MessageCategory = 'all' | 'private' | 'diplomacy' | 'system' | 'national_affairs';

export interface DispatchMessage {
  id: string;
  category: MessageCategory;
  categoryLabel: '私人' | '外交' | '系统' | '国家事务';
  title: string;
  senderName: string;
  time: string;
  summary: string;
  content: string;
  unreadCount?: number;
  hasRedDot?: boolean;
  isOnline?: boolean;
  isAllianceInvite?: boolean;
  avatarType: 'compass' | 'eagle' | 'lion' | 'palace' | 'un' | 'anime' | 'fortress';
  isArchived?: boolean;
  actionTaken?: 'accepted' | 'declined' | null;
}

// 对应参考图的 7 条初始基准消息
const INITIAL_MESSAGES: DispatchMessage[] = [
  {
    id: 'msg_bjtm',
    category: 'diplomacy',
    categoryLabel: '外交',
    title: '北境同盟',
    senderName: '北境同盟最高评议会',
    time: '20:14',
    summary: '关于边境贸易协定的进一步磋商...',
    content: `致崇高执政官阁下：\n\n鉴于北境地缘走廊常态化通商量大幅攀升，我邦统帅部提议在下一演算周期内签订《边境自贸互免关税协定》。\n\n协定要项包括：\n1. 边境接壤省份设立免检通关绿色通道；\n2. 互派商贸武官常驻以处置突发经贸摩擦；\n3. 互相开放紧缺战略工业矿产平价采购配额。\n\n盼请贵邦审议并尽早交换国书。`,
    unreadCount: 2,
    isOnline: true,
    avatarType: 'compass',
  },
  {
    id: 'msg_dlghg',
    category: 'private',
    categoryLabel: '私人',
    title: '东陆共和国',
    senderName: '东陆共和国特使 · 顾远',
    time: '18:27',
    summary: '感谢你的来信，我们期待在下次会议中...',
    content: `领主阁下：\n\n感谢你的亲笔来信！我们在近日的沙盘推演中，注意到了贵邦对于民用工厂与军工生产线的平衡构筑极具战略前瞻性。\n\n我们期待在下次多边圆桌磋商中，能就前线装甲师编制配比深入交换心得。祝沙盘推演顺利，国运昌隆！`,
    unreadCount: 1,
    avatarType: 'eagle',
  },
  {
    id: 'msg_nfwg',
    category: 'diplomacy',
    categoryLabel: '外交',
    title: '南风王国',
    senderName: '南风王国外务总省',
    time: '16:03',
    summary: '已向你发送 同盟邀请',
    content: `【最高同盟公约缔结公文】\n\n尊敬的执政阁下：\n\n南风王国正式向贵国递交同盟公约缔结照会！\n\n根据推演公约法案，同盟规模上限严格限制为最多 3 个国家。若完成签署，同盟双方将享有：\n- 全域共同防御：任一盟友遭受侵略将自动触发防卫义务；\n- 边境免除关税与战略资源互补调配；\n- 联合参谋部作战经验值互通共享。\n\n请阁下在战略决策中审议批准。`,
    hasRedDot: true,
    isAllianceInvite: true,
    avatarType: 'lion',
  },
  {
    id: 'msg_xhlb',
    category: 'national_affairs',
    categoryLabel: '国家事务',
    title: '星海联邦',
    senderName: '星海联邦统筹委员会',
    time: '昨天',
    summary: '我们已完成本周的联合开发计划，...',
    content: `全域内政与基建联合简报：\n\n本周跨省联合基础工程已全线竣工验收。全域 12 个重点工业省份的民用工场配额已按计划调配完毕，民工投产速度提升 12.5%，战略资源储量保持充盈。\n\n请各省长官持续密切监视省份治安镇压与稳定度指数。`,
    avatarType: 'palace',
  },
  {
    id: 'msg_sjyh',
    category: 'system',
    categoryLabel: '系统',
    title: '世界议会',
    senderName: '世界议会秘书处',
    time: '9月5日',
    summary: '关于「粉陆纪元 · 开天辟地」剧本的更新公告',
    content: `【全域世界推演规则升级公告】\n\n世界议会已正式向全域通报第 24 次地缘演算修正：\n1. 同盟规模限制：最多 3 个国家加入同一同盟；\n2. 全球紧张度指数全面取代原旧有冲突计算；\n3. 开放无限省份领土自选建国，赋能领主缔造超大陆文明；\n4. 个人主页现已接入剧本编辑、同盟组建与国家数据整编中枢。\n\n愿世界和平，推演永续！`,
    avatarType: 'un',
  },
  {
    id: 'msg_lcj',
    category: 'private',
    categoryLabel: '私人',
    title: '林初霁',
    senderName: '参谋长 · 林初霁',
    time: '9月4日',
    summary: '下次会议的资料我已经整理好了，记得查看...',
    content: `指挥官：\n\n下次前线演训会议的机要资料我已经全部整理装订就绪了！里面重点标注了西境防线的雷达预警死角以及 3 个装甲师团的补给耗油估算。\n\n有空时记得在终端里过目一下。如果需要调整进攻矛头向量，随时呼叫我哦～`,
    avatarType: 'anime',
  },
  {
    id: 'msg_xjg',
    category: 'diplomacy',
    categoryLabel: '外交',
    title: '西境公国',
    senderName: '西境防务司令部',
    time: '9月3日',
    summary: '关于共同防御条约的意见反馈',
    content: `致战略参谋本部：\n\n西境公国大公府已详阅贵方提交的防务互保备忘录草案。我方防务总监对条约第 2 款之补给线支援持高度认可态度。\n\n建议在后续公约签署仪式上，补充关于航空兵过境走廊的联合雷达识别码细则。期待早日正式换约！`,
    avatarType: 'fortress',
  },
];

// 归档初始种子数据
const INITIAL_ARCHIVED_MESSAGES: DispatchMessage[] = [
  {
    id: 'msg_archived_seed_1',
    category: 'system',
    categoryLabel: '系统',
    title: '推演系统上一纪元归档记录',
    senderName: '历史沙盘文献库',
    time: '8月28日',
    summary: '上一季度全域沙盘推演记录已归入史册，点击查阅历史总结。',
    content: `沙盘推演归档凭证：\n\n上一纪元的 140 场战役与 36 项多边公约已成功生成历史编年史。\n\n领主随时可在【我的】主页中调取历史功勋章与地缘版图演进轨迹。`,
    avatarType: 'un',
    isArchived: true,
  },
];

// 高保真 SVG 头像渲染器
export const MessageAvatar: React.FC<{ type: DispatchMessage['avatarType']; isOnline?: boolean }> = ({
  type,
  isOnline,
}) => {
  return (
    <div className="relative w-12 h-12 rounded-full shrink-0 select-none shadow-2xs">
      {type === 'compass' && (
        <svg viewBox="0 0 48 48" className="w-full h-full rounded-full">
          <circle cx="24" cy="24" r="24" fill="#0b132b" />
          <circle cx="24" cy="24" r="18" fill="none" stroke="#1c2541" strokeWidth="1.2" />
          <circle cx="24" cy="24" r="12" fill="none" stroke="#3a506b" strokeWidth="0.8" />
          {/* 四角罗盘星 */}
          <path d="M24 5 L27 21 L43 24 L27 27 L24 43 L21 27 L5 24 L21 21 Z" fill="#ffffff" />
          <path d="M24 5 L24 24 L27 21 Z" fill="#cbd5e1" />
          <path d="M43 24 L24 24 L27 27 Z" fill="#94a3b8" />
          <path d="M24 43 L24 24 L21 27 Z" fill="#64748b" />
          <path d="M5 24 L24 24 L21 21 Z" fill="#94a3b8" />
          <circle cx="24" cy="24" r="2.5" fill="#38bdf8" />
        </svg>
      )}

      {type === 'eagle' && (
        <svg viewBox="0 0 48 48" className="w-full h-full rounded-full">
          <circle cx="24" cy="24" r="24" fill="#ffffff" />
          <circle cx="24" cy="24" r="23" fill="none" stroke="#1d4ed8" strokeWidth="2" />
          {/* 双头鹰金徽 */}
          <path
            d="M24 10 L22 13 L20 12 L20 15 L18 16 L17 19 L19 21 L16 23 L14 27 L17 28 L16 32 L20 35 L22 33 L24 36 L26 33 L28 35 L32 32 L31 28 L34 27 L32 23 L29 21 L31 19 L30 16 L28 15 L28 12 L26 13 Z"
            fill="#d97706"
          />
          <path d="M24 17 L27 21 L27 27 L24 29 L21 27 L21 21 Z" fill="#b45309" />
          <rect x="22.5" y="7.5" width="3" height="3" fill="#f59e0b" rx="0.5" />
        </svg>
      )}

      {type === 'lion' && (
        <svg viewBox="0 0 48 48" className="w-full h-full rounded-full">
          <circle cx="24" cy="24" r="24" fill="#7f1d1d" />
          {/* 金边盾牌 */}
          <path
            d="M12 12 C12 12 16 10 24 10 C32 10 36 12 36 12 L36 26 C36 34 24 38 24 38 C24 38 12 34 12 26 Z"
            fill="#991b1b"
            stroke="#fbbf24"
            strokeWidth="1.2"
          />
          {/* 跃立雄狮金影 */}
          <path
            d="M23 15 C24 14 26 14 27 15 C27 16 26 17 27 18 C29 17 30 19 29 21 C28 22 26 21 25 22 C26 24 28 25 27 27 C26 29 23 27 23 28 C23 30 25 32 23 33 C21 34 20 32 19 30 C19 28 21 27 21 25 C20 25 19 26 18 25 C17 23 20 22 21 21 C20 19 21 16 23 15 Z"
            fill="#fbbf24"
          />
        </svg>
      )}

      {type === 'palace' && (
        <svg viewBox="0 0 48 48" className="w-full h-full rounded-full">
          <defs>
            <linearGradient id="msgPalaceBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <circle cx="24" cy="24" r="24" fill="url(#msgPalaceBg)" />
          {/* 尖顶宫殿城堡 */}
          <path d="M24 8 L26 16 L27 26 L21 26 L22 16 Z" fill="#0f172a" />
          <path d="M16 14 L18 20 L19 28 L13 28 L14 20 Z" fill="#1e293b" />
          <path d="M32 14 L34 20 L35 28 L29 28 L30 20 Z" fill="#1e293b" />
          <rect x="12" y="27" width="24" height="13" rx="2" fill="#334155" />
          <circle cx="24" cy="33" r="3" fill="#ffffff" />
          <path d="M6 38 C12 36 36 36 42 38 L42 48 L6 48 Z" fill="#475569" />
        </svg>
      )}

      {type === 'un' && (
        <svg viewBox="0 0 48 48" className="w-full h-full rounded-full">
          <circle cx="24" cy="24" r="24" fill="#1e293b" />
          {/* 联合国式地球经纬与橄榄枝 */}
          <circle cx="24" cy="24" r="9.5" fill="none" stroke="#f1f5f9" strokeWidth="1.2" />
          <ellipse cx="24" cy="24" rx="4.8" ry="9.5" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
          <line x1="14.5" y1="24" x2="33.5" y2="24" stroke="#f1f5f9" strokeWidth="0.8" />
          <line x1="16.5" y1="19.5" x2="31.5" y2="19.5" stroke="#f1f5f9" strokeWidth="0.8" />
          <line x1="16.5" y1="28.5" x2="31.5" y2="28.5" stroke="#f1f5f9" strokeWidth="0.8" />
          {/* 橄榄枝叶 */}
          <path
            d="M10 27 C9 22 13 15 19 12 M9 23 C11 22 13 23 13 23 M10 19 C12 18 14 20 14 20 M12 15 C14 15 16 17 16 17"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M38 27 C39 22 35 15 29 12 M39 23 C37 22 35 23 35 23 M38 19 C36 18 34 20 34 20 M36 15 C34 15 32 17 32 17"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      )}

      {type === 'anime' && (
        <svg viewBox="0 0 48 48" className="w-full h-full rounded-full">
          <defs>
            <linearGradient id="msgAnimeBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e0e7ff" />
              <stop offset="100%" stopColor="#c7d2fe" />
            </linearGradient>
          </defs>
          <circle cx="24" cy="24" r="24" fill="url(#msgAnimeBg)" />
          {/* 军装领与白发少女 */}
          <path d="M12 44 C12 36 16 33 24 33 C32 33 36 36 36 44 Z" fill="#1e293b" />
          <path d="M20 33 L24 38 L28 33 Z" fill="#ffffff" />
          <circle cx="24" cy="23" r="11" fill="#f8fafc" />
          <path
            d="M17 21 C17 27 21 30 24 30 C27 30 31 27 31 21 C31 16 27 15 24 15 C21 15 17 16 17 21 Z"
            fill="#fed7aa"
          />
          <ellipse cx="21" cy="22" rx="1.5" ry="2" fill="#3b82f6" />
          <ellipse cx="27" cy="22" rx="1.5" ry="2" fill="#3b82f6" />
          <circle cx="21.5" cy="21.5" r="0.5" fill="#ffffff" />
          <circle cx="27.5" cy="21.5" r="0.5" fill="#ffffff" />
          <path d="M14 19 C15 13 20 10 24 10 C28 10 33 13 34 19 C31 17 28 19 25 18 C22 17 17 19 14 19 Z" fill="#ffffff" />
          <path d="M16 18 L18 24 L19 18 Z" fill="#e2e8f0" />
          <path d="M32 18 L30 24 L29 18 Z" fill="#e2e8f0" />
        </svg>
      )}

      {type === 'fortress' && (
        <svg viewBox="0 0 48 48" className="w-full h-full rounded-full">
          <defs>
            <linearGradient id="msgDuchyBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
          <circle cx="24" cy="24" r="24" fill="url(#msgDuchyBg)" />
          {/* 高山堡垒石塔 */}
          <polygon points="10,42 24,18 38,42" fill="#475569" />
          <rect x="20" y="22" width="8" height="15" fill="#ffffff" />
          <polygon points="18,22 24,14 30,22" fill="#1e293b" />
          <polygon points="12,40 18,28 22,40" fill="#64748b" />
          <polygon points="26,40 30,28 36,40" fill="#64748b" />
        </svg>
      )}

      {/* 在线绿点 */}
      {isOnline && (
        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
      )}
    </div>
  );
};

export const MessagesView: React.FC<MessagesViewProps> = ({
  user,
  myNation,
  nations,
  onNavigateTab,
  onOpenDiplomacy,
  showToast,
}) => {
  // 消息状态管理
  const [messages, setMessages] = useState<DispatchMessage[]>(() => {
    try {
      const saved = localStorage.getItem('fc_messages_store_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_MESSAGES;
  });

  const [archivedMessages, setArchivedMessages] = useState<DispatchMessage[]>(() => {
    try {
      const saved = localStorage.getItem('fc_messages_archived_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_ARCHIVED_MESSAGES;
  });

  // 分类筛选与搜索
  const [activeCategory, setActiveCategory] = useState<MessageCategory>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // 弹窗状态
  const [selectedMessage, setSelectedMessage] = useState<DispatchMessage | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);

  // 撰写公牒表单
  const [composeCategory, setComposeCategory] = useState<MessageCategory>('diplomacy');
  const [composeRecipient, setComposeRecipient] = useState('');
  const [composeTitle, setComposeTitle] = useState('');
  const [composeContent, setComposeContent] = useState('');

  // 同步本地存储
  useEffect(() => {
    try {
      localStorage.setItem('fc_messages_store_v2', JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem('fc_messages_archived_v2', JSON.stringify(archivedMessages));
    } catch {
      // ignore
    }
  }, [archivedMessages]);

  // 计算全部未读数（完全还原参考图“全部 5”）
  const totalUnreadCount = useMemo(() => {
    return messages.reduce((acc, m) => {
      if (m.unreadCount) return acc + m.unreadCount;
      if (m.hasRedDot) return acc + 1;
      return acc;
    }, 0);
  }, [messages]);

  // 筛选消息
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      if (activeCategory !== 'all') {
        if (msg.category !== activeCategory) return false;
      }
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        return (
          msg.title.toLowerCase().includes(q) ||
          msg.senderName.toLowerCase().includes(q) ||
          msg.summary.toLowerCase().includes(q) ||
          msg.content.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [messages, activeCategory, searchKeyword]);

  // 操作：标记为已读
  const handleOpenMessage = (msg: DispatchMessage) => {
    if (msg.unreadCount || msg.hasRedDot) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, unreadCount: undefined, hasRedDot: false } : m
        )
      );
    }
    setSelectedMessage(msg);
  };

  // 操作：全部已读
  const handleMarkAllAsRead = () => {
    setMessages((prev) =>
      prev.map((m) => ({ ...m, unreadCount: undefined, hasRedDot: false }))
    );
    setMoreMenuOpen(false);
    showToast('全部消息已标为已读');
  };

  // 操作：归档单个消息
  const handleArchiveMessage = (msg: DispatchMessage, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    setArchivedMessages((prev) => [{ ...msg, isArchived: true }, ...prev]);
    if (selectedMessage?.id === msg.id) setSelectedMessage(null);
    showToast(`已归档【${msg.title}】`);
  };

  // 操作：从归档恢复消息
  const handleRestoreMessage = (msg: DispatchMessage) => {
    setArchivedMessages((prev) => prev.filter((m) => m.id !== msg.id));
    setMessages((prev) => [{ ...msg, isArchived: false }, ...prev]);
    showToast(`已将【${msg.title}】恢复至消息列表`);
  };

  // 操作：接受同盟公约邀请
  const handleAcceptAlliance = (msg: DispatchMessage) => {
    try {
      const existing = strategicStorage.getAlliances();
      const newAlliance: AllianceFaction = {
        id: `alliance_nfwg_${Date.now()}`,
        name: '南风-华夏多边同盟公约',
        tag: 'SOUTH-PACT',
        leaderNationId: 'nation_nfwg',
        leaderNationName: '南风王国',
        memberNationIds: ['nation_nfwg', myNation?.id || 'nation_my'],
        memberNationNames: ['南风王国', myNation?.name || '华夏执政国'],
        description: '南风王国与盟友共同建立的多边安全互助公约，遵循最多 3 国公约上限',
        mutualDefense: true,
        bannerColor: '#991b1b',
        createdAt: new Date().toISOString(),
        chatMessages: [],
      };
      strategicStorage.saveAlliances([newAlliance, ...existing]);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, actionTaken: 'accepted' } : m))
      );
      if (selectedMessage) {
        setSelectedMessage((prev) => (prev ? { ...prev, actionTaken: 'accepted' } : null));
      }
      showToast('🎉 已正式签署公约，成功与南风王国结为同盟！');
    } catch {
      showToast('同盟公约签署失败，请重试');
    }
  };

  // 发送自定义牒文
  const handleSendCompose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTitle.trim() || !composeContent.trim()) {
      showToast('请填写完整的牒文标题与正文');
      return;
    }

    const catLabelMap: Record<MessageCategory, '私人' | '外交' | '系统' | '国家事务'> = {
      all: '外交',
      private: '私人',
      diplomacy: '外交',
      system: '系统',
      national_affairs: '国家事务',
    };

    const newMsg: DispatchMessage = {
      id: `msg_user_${Date.now()}`,
      category: composeCategory,
      categoryLabel: catLabelMap[composeCategory],
      title: composeRecipient.trim() || '全域通报牒文',
      senderName: myNation?.name || user?.username || '我方中枢指挥部',
      time: '刚刚',
      summary: composeTitle.trim(),
      content: composeContent.trim(),
      avatarType: 'compass',
      isOnline: true,
    };

    setMessages((prev) => [newMsg, ...prev]);
    setIsComposeModalOpen(false);
    setComposeTitle('');
    setComposeContent('');
    setComposeRecipient('');
    showToast('公牒已正式加密下达');
  };

  // 渲染分类标签配置（与参考图完全一致：全部 5、私人、外交、系统、国家事务）
  const FILTER_PILLS: Array<{
    id: MessageCategory;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }> = [
    { id: 'all', label: '全部', icon: Mail, count: totalUnreadCount },
    { id: 'private', label: '私人', icon: UserIcon },
    { id: 'diplomacy', label: '外交', icon: Handshake },
    { id: 'system', label: '系统', icon: Bell },
    { id: 'national_affairs', label: '国家事务', icon: FileText },
  ];

  return (
    <div className="flex-1 w-full bg-white text-slate-800 min-h-screen pb-24 select-none">
      <div className="w-full">
        {/* 顶部主功能栏：铺满全屏，两边无间距 */}
        <header className="w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-slate-200/80 bg-white sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                消息
              </h1>
              {totalUnreadCount > 0 ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                  {totalUnreadCount} 条未读
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-slate-400 bg-slate-100">
                  全部已读
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">国家事务、外交信函与系统通报</p>
          </div>

          {/* 右侧操作区：搜索、更多 */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                searchOpen
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="搜索消息"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">搜索</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center justify-center transition cursor-pointer active:scale-95"
                title="更多操作"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {/* 更多菜单浮层 */}
              <AnimatePresence>
                {moreMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white border border-slate-200 shadow-lg py-1 z-30 text-xs font-medium"
                  >
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>全部标为已读</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMoreMenuOpen(false);
                        setIsArchiveModalOpen(true);
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5 text-slate-500" />
                      <span>打开归档信箱</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* 展开的搜索输入栏 */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden px-4 sm:px-6 py-2.5 border-b border-slate-100 bg-slate-50/50"
            >
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜索消息标题、发函国、正文关键词..."
                  autoFocus
                  className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 shadow-2xs text-slate-800 placeholder-slate-400"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => setSearchKeyword('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 分类胶囊标签栏 */}
        <div className="w-full px-4 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar py-2.5 border-b border-slate-100 bg-white">
          {FILTER_PILLS.map((pill) => {
            const Icon = pill.icon;
            const isActive = activeCategory === pill.id;

            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setActiveCategory(pill.id as MessageCategory)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none active:scale-95 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{pill.label}</span>
                {pill.count !== undefined && pill.count > 0 && (
                  <span
                    className={`ml-0.5 text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {pill.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 4. 消息列表（两边无距离、铺满全屏、长方形列表，对话之间 0 距离） */}
        <div className="w-full bg-white divide-y divide-slate-100 border-b border-slate-200">
          {filteredMessages.length === 0 ? (
            <div className="w-full py-16 text-center px-4">
              <Mail className="w-9 h-9 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
              <div className="text-xs font-bold text-slate-700">当前分类暂无相关消息</div>
              <p className="text-[11px] text-slate-400 mt-1">
                当前分类下暂无新的来信或通报
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              return (
                <div
                  key={msg.id}
                  onClick={() => handleOpenMessage(msg)}
                  className="w-full px-4 sm:px-6 py-3.5 bg-white hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-3 active:bg-slate-100/70"
                >
                  {/* 左侧：头像 */}
                  <MessageAvatar type={msg.avatarType} isOnline={msg.isOnline} />

                  {/* 中间：标题与内容预览 */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {msg.title}
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5 text-xs truncate">
                      {/* 分类标签 */}
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.2 rounded shrink-0 ${
                          msg.category === 'diplomacy'
                            ? 'bg-[#EEF4FF] text-[#3B82F6]'
                            : msg.category === 'private'
                            ? 'bg-slate-100 text-slate-600'
                            : msg.category === 'national_affairs'
                            ? 'bg-[#E8F4FD] text-[#0284C7]'
                            : 'bg-[#FEF3E8] text-[#EA580C]'
                        }`}
                      >
                        {msg.categoryLabel}
                      </span>

                      {/* 内容文案 */}
                      <span className="text-slate-500 truncate text-xs">
                        {msg.isAllianceInvite ? (
                          <>
                            已向你发送{' '}
                            <span className="text-[#3B82F6] font-medium">同盟邀请</span>
                          </>
                        ) : (
                          msg.summary
                        )}
                      </span>
                    </div>
                  </div>

                  {/* 右侧：时间与未读红点/角标 */}
                  <div className="flex flex-col items-end justify-between h-10 shrink-0">
                    <span className="text-[11px] text-slate-400 font-normal">
                      {msg.time}
                    </span>

                    <div className="h-4 flex items-center justify-end">
                      {msg.unreadCount !== undefined && msg.unreadCount > 0 ? (
                        <span className="min-w-4 h-4 px-1 rounded-full bg-[#3B82F6] text-white text-[10px] font-bold flex items-center justify-center font-sans shadow-2xs">
                          {msg.unreadCount}
                        </span>
                      ) : msg.hasRedDot ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-2xs" />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* 5. 底部入口：已归档的消息 */}
          <div
            onClick={() => setIsArchiveModalOpen(true)}
            className="w-full px-4 sm:px-6 py-3.5 bg-slate-50/50 hover:bg-slate-100/70 transition-colors cursor-pointer flex items-center justify-between gap-3 active:bg-slate-100"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                <Archive className="w-4 h-4 stroke-[1.8]" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800">已归档的消息</div>
                <div className="text-xs text-slate-400 mt-0.5">查看已归档的历史消息</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-xs font-mono">{archivedMessages.length}</span>
              <ChevronRight className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
        </div>
      </div>

      {/* 弹窗 1：消息详阅与回复/结盟处置弹窗 */}
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
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 max-h-[88vh] flex flex-col"
            >
              {/* 弹窗头部 */}
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      selectedMessage.category === 'diplomacy'
                        ? 'bg-[#EEF4FF] text-[#3B82F6]'
                        : selectedMessage.category === 'private'
                        ? 'bg-slate-100 text-slate-600'
                        : selectedMessage.category === 'national_affairs'
                        ? 'bg-[#E8F4FD] text-[#0284C7]'
                        : 'bg-[#FEF3E8] text-[#EA580C]'
                    }`}
                  >
                    {selectedMessage.categoryLabel}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedMessage.time}
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

              {/* 弹窗主体 */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
                <div className="flex items-center gap-3">
                  <MessageAvatar
                    type={selectedMessage.avatarType}
                    isOnline={selectedMessage.isOnline}
                  />
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                      {selectedMessage.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      发件方：{selectedMessage.senderName}
                    </p>
                  </div>
                </div>

                {/* 正文卡片 */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-sans">
                  {selectedMessage.content}
                </div>

                {/* 针对“南风王国 同盟邀请”特别呈现同盟公约专属操作卡 */}
                {selectedMessage.isAllianceInvite && (
                  <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
                      <Shield className="w-4 h-4 text-sky-600" />
                      <span>同盟条约签署议案（最多 3 国同一同盟）</span>
                    </div>
                    <p className="text-[11px] text-sky-700 leading-relaxed">
                      同意接纳后，将立即在推演中枢与南风王国结成集体防卫多边同盟，可在【我的】主页中随时查阅盟约与退盟。
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      {selectedMessage.actionTaken === 'accepted' ? (
                        <div className="w-full py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1">
                          <Check className="w-4 h-4" />
                          <span>已正式签署同盟条约</span>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAcceptAlliance(selectedMessage)}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
                          >
                            <Handshake className="w-3.5 h-3.5" />
                            <span>接受同盟邀请</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMessage((prev) =>
                                prev ? { ...prev, actionTaken: 'declined' } : null
                              );
                              showToast('已委婉谢绝同盟邀请');
                            }}
                            className="py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                          >
                            委婉谢绝
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 弹窗底部操作条 */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleArchiveMessage(selectedMessage)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1.5 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-slate-200/60 transition"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>归档此消息</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      showToast('已调取外交文书通道');
                      setSelectedMessage(null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#3B82F6] text-white text-xs font-bold hover:bg-blue-600 transition cursor-pointer shadow-xs active:scale-95"
                  >
                    回复牒文
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMessage(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition cursor-pointer"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 弹窗 2：已归档消息列表抽屉/弹窗 */}
      <AnimatePresence>
        {isArchiveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsArchiveModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 max-h-[85vh] flex flex-col"
            >
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-slate-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    已归档的历史消息 ({archivedMessages.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsArchiveModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5">
                {archivedMessages.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    暂无归档历史消息
                  </div>
                ) : (
                  archivedMessages.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MessageAvatar type={item.avatarType} />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {item.summary}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRestoreMessage(item)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold shrink-0 cursor-pointer flex items-center gap-1"
                        title="恢复至主列表"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>恢复</span>
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setArchivedMessages([]);
                    showToast('已清空归档信箱');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                >
                  清空归档信箱
                </button>

                <button
                  type="button"
                  onClick={() => setIsArchiveModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 弹窗 3：起草通牒 / 发送公文 */}
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
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 max-h-[88vh] flex flex-col"
            >
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">起草地缘牒文</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsComposeModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendCompose} className="p-5 overflow-y-auto space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    公牒分类
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'diplomacy', label: '外交' },
                      { id: 'private', label: '私人' },
                      { id: 'national_affairs', label: '国家事务' },
                      { id: 'system', label: '系统' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setComposeCategory(c.id as MessageCategory)}
                        className={`py-1.5 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                          composeCategory === c.id
                            ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    接收方 / 目标粉陆或组织
                  </label>
                  <input
                    type="text"
                    value={composeRecipient}
                    onChange={(e) => setComposeRecipient(e.target.value)}
                    placeholder="例如：北境同盟、西境公国或全域通报"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    牒文主题
                  </label>
                  <input
                    type="text"
                    value={composeTitle}
                    onChange={(e) => setComposeTitle(e.target.value)}
                    placeholder="例如：关于共同防空协定的议案"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    详细国书正文
                  </label>
                  <textarea
                    rows={4}
                    value={composeContent}
                    onChange={(e) => setComposeContent(e.target.value)}
                    placeholder="阐述具体公文细则、战略诉求与换约倡议..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none font-sans"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsComposeModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
                  >
                    取消
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>正式加密送达</span>
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
