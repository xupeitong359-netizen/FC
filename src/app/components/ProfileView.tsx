import React, { useState, useMemo, useEffect } from 'react';
import {
  Crown,
  User,
  MapPin,
  Landmark,
  Compass,
  Edit3,
  Trash2,
  Sparkles,
  Shield,
  ShieldCheck,
  Award,
  Calendar,
  Lock,
  LogOut,
  Copy,
  Check,
  Palette,
  Smile,
  Globe2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  X,
  Building2,
  Scale,
  Swords,
  Scroll,
  FolderGit2,
  Plus,
  Heart,
  MessageSquare,
  Share2,
  Layers,
  Flame,
  FileText,
  SlidersHorizontal,
  BookmarkCheck,
  BadgeCheck,
  CheckCircle2,
  QrCode,
  Camera,
  UserPlus,
  Bell,
  Search,
  MoreHorizontal,
  Menu,
  ChevronDown,
  ChevronUp,
  Settings,
  Languages,
  Sun,
  Moon,
  Database,
  RotateCcw,
  Volume2,
  VolumeX,
  Eye,
  Sliders,
  Cpu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType, Nation, DiplomacyType } from '../types';
import { TikTokIcon } from './TikTokIcon';
import {
  DouyinEditProfileModal,
  PRESET_COVERS,
  PRESET_AVATARS,
  DouyinProfileData,
} from './DouyinEditProfileModal';
import {
  renderEmblemIcon,
  CivilianFactoryPlantIcon,
  MilitaryFactoryPlantIcon,
} from '../lib/icons';
import { getTotalCivilianFactories } from '../lib/economyEngine';
import { getTotalMilitaryFactories } from '../lib/militaryIndustry';
import { workspaceService, WorkspaceItem } from '../services/workspaceService';
import { getSavedMapTheme, saveMapTheme, MapVisualTheme } from '../lib/mapThemes';
import { SettingsDebugModal } from './SettingsDebugModal';
import { useAppSettings } from '../services/settingsService';

interface ProfileViewProps {
  user: UserType | null;
  myNation: Nation | null;
  nations: Nation[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onQuickGuestLogin: () => Promise<void>;
  onLogout: () => void;
  onOpenCreateNation: () => void;
  onOpenWorkspace?: () => void;
  onEditNation: (nation: Nation) => void;
  onDeleteNation: (nation: Nation) => void;
  onUpdateNation: (updated: Nation) => void;
  onOpenDispute: (nation: Nation) => void;
  onOpenDecrees: () => void;
  onOpenChronicle: () => void;
  onOpenDiplomacy: (nation: Nation, type?: DiplomacyType) => void;
  onTerminateTreaty: (treatyId: string, withNationName: string) => void;
  onOpenConstruction: () => void;
  onNavigateTab: (tab: string) => void;
  showToast: (msg: string) => void;
  updateProfile: (payload: {
    douyinName?: string;
    newPassword?: string;
    avatarColor?: string;
    avatarEmoji?: string;
    avatarUrl?: string;
    coverUrl?: string;
    gender?: string;
    birthday?: string;
    location?: string;
    age?: number | string;
    serviceWidget?: string;
    bio?: string;
    creatorId?: string;
    isCreator?: boolean;
    creatorTitle?: string;
  }) => Promise<void>;
}

// 12款创作者工坊专属主题色
const CREATOR_THEME_COLORS = [
  { name: '创联靛蓝', value: '#4f46e5' },
  { name: '星云紫罗', value: '#7c3aed' },
  { name: '赤焰绯红', value: '#dc2626' },
  { name: '工业赤金', value: '#ea580c' },
  { name: '文明金辉', value: '#d97706' },
  { name: '翡翠地缘', value: '#059669' },
  { name: '普鲁士青', value: '#0284c7' },
  { name: '黑曜铁骑', value: '#334155' },
  { name: '深空矩阵', value: '#0f172a' },
  { name: '圣域玫瑰', value: '#e11d48' },
  { name: '琥珀荣光', value: '#b45309' },
  { name: '寒霜秘银', value: '#475569' },
];

// 24款精选创作者/世界架构师称号印记 (文字印记，去除所有emoji)
const CREATOR_PRESET_EMOJIS = [
  '领', '创', '史', '境', '策', '帅', '邦', '盟',
  '极', '枢', '恒', '衡', '星', '宸', '御', '烽',
  '律', '弈', '拓', '界', '勋', '乾', '坤', '霄',
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  myNation,
  nations,
  isAuthenticated,
  isAdmin,
  onOpenAuth,
  onQuickGuestLogin,
  onLogout,
  onOpenCreateNation,
  onOpenWorkspace,
  onEditNation,
  onDeleteNation,
  onUpdateNation,
  onOpenDispute,
  onOpenDecrees,
  onOpenChronicle,
  onOpenDiplomacy,
  onTerminateTreaty,
  onOpenConstruction,
  onNavigateTab,
  showToast,
  updateProfile,
}) => {
  const { settings } = useAppSettings();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 工作区数据加载
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  useEffect(() => {
    try {
      const list = workspaceService.getWorkspaces();
      setWorkspaces(list);
    } catch {
      setWorkspaces([]);
    }
  }, []);

  // 编辑表单状态
  const [formDouyinName, setFormDouyinName] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formCreatorId, setFormCreatorId] = useState('');
  const [formIsCreator, setFormIsCreator] = useState(true);
  const [formAvatarEmoji, setFormAvatarEmoji] = useState('');
  const [formAvatarColor, setFormAvatarColor] = useState('#4f46e5');
  const [formAvatarUrl, setFormAvatarUrl] = useState('');
  const [formNewPassword, setFormNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 移动端创作者主页交互状态
  const [isDouyinEditOpen, setIsDouyinEditOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // 昵称与创作者代码：不要让「抖音」成为昵称的一部分
  const rawName = user?.douyinName || user?.username || '领主·战略试玩家9796';
  const displayName = rawName.replace(/_抖音$/, '');
  const creatorCode = user?.creatorId || (user?.id ? `CR-${user.id.slice(-4).toUpperCase()}` : 'CR-43HV');

  // 核心字段与默认展示数据（还原图2真实数据呈现）
  const currentCover = user?.coverUrl || PRESET_COVERS[0].url;
  const currentGender = user?.gender || '男';
  const currentBirthday = user?.birthday || '2012-03-30';
  const currentLocation = user?.location || '朝鲜';
  const currentServiceWidget = user?.serviceWidget || '群聊';
  const currentLikes = user?.likesCount || 3466;
  const currentMutual = user?.mutualCount || 123;
  const currentFollowing = user?.followingCount || 153;
  const currentFollowers = user?.followersCount || 268;
  const currentUnreadBadge = user?.unreadBadge || 99;
  const currentDouyinId = user?.douyinName || (rawName.includes('抖音') ? rawName : `${displayName}_抖音`);

  // 计算年龄（基于生日或预设）
  const userAge = useMemo(() => {
    if (user?.age) return `${user.age}`.includes('岁') ? `${user.age}` : `${user.age}岁`;
    if (user?.birthday) {
      try {
        const year = parseInt(user.birthday.split('-')[0], 10);
        if (!isNaN(year)) {
          const currentYear = new Date().getFullYear();
          return `${Math.max(1, currentYear - year)}岁`;
        }
      } catch {
        // fallback
      }
    }
    return '14岁';
  }, [user?.age, user?.birthday]);

  // 分割多行简介并支持@高亮
  const bioLines = useMemo(() => {
    const raw = user?.bio || '创作者联盟成员\n玲玉：@玲玉\n生活号\n恋人：@龙神';
    return raw.split('\n').filter((l) => l.trim().length > 0);
  }, [user?.bio]);

  // 计算创作者头衔 (Creator Title)
  const creatorTitle = useMemo(() => {
    if (user?.creatorTitle) return user.creatorTitle;
    if (isAdmin) return '官方世界观总架构师';
    const totalCiv = myNation ? getTotalCivilianFactories(myNation) : 0;
    const totalMil = myNation ? getTotalMilitaryFactories(myNation) : 0;
    const totalFactories = totalCiv + totalMil;
    if (totalFactories >= 50 || workspaces.length >= 3) return '殿堂级世界观架构师';
    if (myNation && (myNation.completedFocuses || []).length >= 5) return '大战略沙盘策划总编';
    if (myNation) return '地缘文明奠基者';
    if (user?.isCreator) return '认证沙盘架构师';
    return '新星地缘造物者';
  }, [user, myNation, isAdmin, workspaces.length]);

  // 计算加入/参创天数
  const daysSinceJoin = useMemo(() => {
    if (!user?.createdAt) return 1;
    try {
      const created = new Date(user.createdAt);
      const diffTime = Math.abs(Date.now() - created.getTime());
      return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    } catch {
      return 1;
    }
  }, [user?.createdAt]);

  // 筛选用户自身创作的沙盘
  const myWorkspaces = useMemo(() => {
    if (!user) return [];
    return workspaces.filter(
      (ws) =>
        ws.creatorId === user.id ||
        ws.creatorName === user.douyinName ||
        ws.creatorName === user.username
    );
  }, [workspaces, user]);

  // 计算创作者全部作品的获赞总数
  const totalLikesReceived = useMemo(() => {
    const wsLikes = myWorkspaces.reduce((acc, ws) => acc + (ws.likesCount || 0), 0);
    // 加上默认基数与国家活跃度
    const nationLikes = myNation ? (myNation.stabilityIndex || 80) : 0;
    return Math.max(wsLikes + nationLikes, wsLikes);
  }, [myWorkspaces, myNation]);

  // 计算创作者收到的研判讨论留言总数
  const totalCommentsReceived = useMemo(() => {
    return myWorkspaces.reduce((acc, ws) => acc + (ws.comments?.length || 0), 0);
  }, [myWorkspaces]);

  // 打开编辑弹窗时预填数据
  const handleOpenEditModal = () => {
    if (!user) return;
    setFormDouyinName(user.douyinName || '');
    setFormBio(user.bio || '');
    setFormCreatorId(user.creatorId || creatorCode);
    setFormIsCreator(user.isCreator ?? true);
    setFormAvatarEmoji(user.avatarEmoji || '🎨');
    setFormAvatarColor(user.avatarColor || '#4f46e5');
    setFormAvatarUrl(user.avatarUrl || '');
    setFormNewPassword('');
    setEditModalOpen(true);
  };

  // 保存资料更新
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      await updateProfile({
        douyinName: formDouyinName.trim() || user.username,
        bio: formBio.trim(),
        creatorId: formCreatorId.trim() || undefined,
        isCreator: formIsCreator,
        avatarEmoji: formAvatarEmoji,
        avatarColor: formAvatarColor,
        avatarUrl: formAvatarUrl.trim(),
        newPassword: formNewPassword.trim() ? formNewPassword.trim() : undefined,
      });
      showToast('创作者工坊名片与个人资料更新成功！');
      setEditModalOpen(false);
    } catch (err: any) {
      showToast(err.message || '更新资料失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 抖音主页资料更新（完全支持图1中的字段更新并同步到数据库与全站）
  const handleSaveDouyinProfile = async (data: DouyinProfileData) => {
    if (!user) return;
    await updateProfile({
      douyinName: data.douyinName,
      bio: data.bio,
      gender: data.gender,
      birthday: data.birthday,
      location: data.location,
      serviceWidget: data.serviceWidget,
      coverUrl: data.coverUrl,
      avatarUrl: data.avatarUrl,
      avatarEmoji: data.avatarEmoji,
      avatarColor: data.avatarColor,
      creatorId: data.creatorId,
      newPassword: data.newPassword,
    });
  };

  // 复制文本提示
  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    showToast(`已复制：${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // 1. 未登录状态视图
  if (!isAuthenticated || !user) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-12 animate-fadeIn">
        <div className="bg-white border border-slate-200/80 rounded-xl p-8 text-center space-y-6">
          <div className="w-14 h-14 rounded-xl bg-slate-100 text-[#6B50F0] flex items-center justify-center mx-auto">
            <FolderGit2 className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-500">
              创联世界 · 沙盘创作平台
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              登录创联世界
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              自由拟实或架空世界地图、编纂大战略时代剧本、绘制独立主权势力并与全网创作者展开推演博弈。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-xs mx-auto">
            <button
              id="profile-login-btn"
              type="button"
              onClick={() => onOpenAuth('login')}
              className="w-full px-5 py-2.5 bg-[#6B50F0] hover:bg-[#5B3FE0] text-white rounded-lg text-xs font-medium transition active:scale-95 cursor-pointer shadow-2xs"
            >
              登录创作者账户
            </button>
            <button
              id="profile-guest-btn"
              type="button"
              onClick={async () => {
                try {
                  await onQuickGuestLogin();
                  showToast('已进入自由创作者体验模式！');
                } catch (e: any) {
                  showToast(e.message || '快捷试玩登录失败');
                }
              }}
              className="w-full px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition active:scale-95 cursor-pointer"
            >
              快捷试玩体验
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. 已登录状态：个人中心
  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 animate-fadeIn pb-28">
      {/* 2.1 移动端现代创作者主页架构 */}
      <section
        aria-label="创作者主页卡片"
        className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden"
      >
        {/* TOP COVER BANNER (封面大图与精简顶栏) */}
        <div className="relative w-full h-44 sm:h-56 md:h-64 bg-slate-900 overflow-hidden select-none group">
          <img
            src={currentCover}
            alt="主页封面"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* 上下暗调柔光渐变 */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />

          {/* 顶栏操作（左侧添加好友、中间新访客、右侧搜索与更多） */}
          <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 flex items-center justify-between z-10">
            {/* 左侧：添加好友 (取消图案，仅保留文字) */}
            <button
              type="button"
              onClick={() => setShowAddFriendModal(true)}
              className="px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white text-xs font-medium backdrop-blur-xs transition cursor-pointer shadow-xs border border-white/10 active:scale-95"
            >
              <span>+ 添加好友</span>
            </button>

            {/* 中间：新访客 1 */}
            <div className="px-3 py-1.5 rounded-full bg-black/40 text-white text-xs font-medium backdrop-blur-xs flex items-center gap-1.5 border border-white/10">
              <Bell className="w-3.5 h-3.5 text-amber-300" />
              <span>新访客 1</span>
            </div>

            {/* 右侧：搜索 + 更多 (...) */}
            <div className="flex items-center gap-2 relative">
              <button
                type="button"
                onClick={() => {
                  if (onOpenWorkspace) onOpenWorkspace();
                  else showToast('已开启沙盘推演工坊');
                }}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer border border-white/10 active:scale-95"
                title="搜索"
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowMoreMenu((prev) => !prev)}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer border border-white/10 active:scale-95"
                title="更多选项"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {/* 更多菜单下拉浮层 */}
              <AnimatePresence>
                {showMoreMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setShowMoreMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      className="absolute right-0 top-10 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 text-xs text-slate-700 select-none"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreMenu(false);
                          setIsDouyinEditOpen(true);
                        }}
                        className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-left cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-slate-500" />
                        <span>更换主页封面</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreMenu(false);
                          setShowQrModal(true);
                        }}
                        className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-left cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-slate-500" />
                        <span>我的名片码</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreMenu(false);
                          copyToClipboard(window.location.href, 'share');
                          showToast('已复制主页链接');
                        }}
                        className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-left cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>分享主页链接</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreMenu(false);
                          setIsSettingsModalOpen(true);
                        }}
                        className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-left cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-500" />
                        <span>系统设置与偏好</span>
                      </button>
                      <div className="my-1 border-t border-slate-100" />
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreMenu(false);
                          onLogout();
                        }}
                        className="w-full px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 text-left cursor-pointer font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>退出登录</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* PROFILE BODY: 头像与个人名片主体 */}
        <div className="px-4 sm:px-6 pt-0 pb-5 relative">
          {/* 头像区域与右侧操作按钮 */}
          <div className="flex items-end justify-between -mt-12 sm:-mt-14 mb-3">
            {/* 头像 (带白边圈与右下角在线状态) */}
            <div className="relative shrink-0">
              <div
                onClick={() => setIsDouyinEditOpen(true)}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-sm bg-[#6B50F0] overflow-hidden cursor-pointer group select-none relative flex items-center justify-center"
                title="点击更换头像与编辑资料"
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : user?.avatarEmoji ? (
                  <div className="text-4xl sm:text-5xl">{user.avatarEmoji}</div>
                ) : (
                  <div className="text-white font-bold text-3xl sm:text-4xl">
                    {displayName.charAt(0) || '领'}
                  </div>
                )}
              </div>

              {/* 右下角绿色在线状态标识 */}
              <div
                className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-2xs"
                title="在线"
              />
            </div>

            {/* 右侧：主按钮（编辑主页）与次按钮（沙盒工坊） */}
            <div className="flex items-center gap-2.5 pb-1">
              {/* 主按钮：编辑主页 (仅保留文字) */}
              <button
                id="douyin-edit-profile-btn"
                type="button"
                onClick={() => setIsDouyinEditOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#6B50F0] hover:bg-[#5b40e0] text-white text-xs sm:text-sm font-medium transition active:scale-95 cursor-pointer shadow-2xs"
              >
                <span>编辑主页</span>
              </button>

              {/* 次按钮：沙盒工坊 (仅保留文字) */}
              {onOpenWorkspace && (
                <button
                  type="button"
                  onClick={onOpenWorkspace}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition active:scale-95 cursor-pointer"
                >
                  <span>沙盒工坊</span>
                </button>
              )}
            </div>
          </div>

          {/* 昵称区域 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                {displayName}
              </h1>

              {/* ✓ 创作者 (轻量文字标识) */}
              <span className="inline-flex items-center gap-1 text-xs text-[#6B50F0] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>创作者</span>
              </span>
            </div>

            {/* 四项核心数据 (3466 获赞 | 123 作品 | 153 关注 | 268 粉丝) */}
            <div className="grid grid-cols-4 py-3.5 my-2 border-b border-slate-100 text-center">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight">
                  {currentLikes}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">获赞</div>
              </div>

              <div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight">
                  {myWorkspaces.length > 0 ? myWorkspaces.length : 123}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">作品</div>
              </div>

              <div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight">
                  {currentFollowing}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">关注</div>
              </div>

              <div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight">
                  {currentFollowers}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">粉丝</div>
              </div>
            </div>

            {/* 个人简介 */}
            <div className="pt-1 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-1">
              <div>创作者联盟成员</div>
              <div>
                玲玉：
                <span className="text-[#6B50F0] font-semibold hover:underline cursor-pointer">
                  @玲玉
                </span>
              </div>
              <div>生活号</div>
              {bioExpanded && (
                <div className="text-slate-500 pt-1">
                  恋人：@龙神 · 地缘推演策划总编 · 欢迎交流世界观设定与沙盘构建
                </div>
              )}
              <button
                type="button"
                onClick={() => setBioExpanded(!bioExpanded)}
                className="text-xs text-[#6B50F0] hover:text-[#5b40e0] font-medium cursor-pointer block pt-0.5"
              >
                {bioExpanded ? '收起' : '更多...'}
              </button>
            </div>

            {/* 用户信息标签 */}
            <div className="pt-2 space-y-2">
              {/* 行 1：地点、性别年龄、代码 */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {/* 所在地 */}
                <span className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>{currentLocation}</span>
                </span>

                {/* 性别与年龄 */}
                <span className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-medium flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-500" />
                  <span>{currentGender} · {userAge}</span>
                </span>

                {/* 代码 */}
                <button
                  type="button"
                  onClick={() => copyToClipboard(creatorCode, 'creatorCode')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono transition cursor-pointer flex items-center gap-1"
                  title="点击复制代码"
                >
                  <span>代码：{creatorCode}</span>
                  {copiedField === 'creatorCode' ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400" />
                  )}
                </button>
              </div>

              {/* 行 2：服务挂件作为轻量功能入口 */}
              <button
                type="button"
                onClick={() => {
                  showToast('已接入官方创作者交流群');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition cursor-pointer flex items-center justify-between text-xs text-slate-700"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-[#6B50F0]" />
                  <span>服务：{currentServiceWidget}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2.4 系统设置入口 (前卫极简设计) */}
      <section aria-label="系统偏好设置" className="pt-1">
        <button
          id="profile-open-settings-card-btn"
          type="button"
          onClick={() => setIsSettingsModalOpen(true)}
          className="w-full rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 p-3.5 sm:p-4 transition-all duration-200 hover:shadow-xs cursor-pointer flex items-center justify-between group text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 transition-transform group-hover:scale-105 shadow-2xs"
              style={{ backgroundColor: settings.themeAccent }}
            >
              <Sliders className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm tracking-tight group-hover:text-indigo-600 transition-colors">
                  系统设置
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold border border-slate-200/50">
                  {settings.uiLanguage} · {settings.simulationFps}FPS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate font-medium">
                舆图底色 · 译名规范 · 引擎推演
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pl-3 shrink-0">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 group-hover:shadow-2xs"
              style={{
                color: settings.themeAccent,
                borderColor: `${settings.themeAccent}30`,
                backgroundColor: `${settings.themeAccent}0a`,
              }}
            >
              <span>配置</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </button>
      </section>

      {/* 2.5 创作者个性化名片定制弹窗 (Edit Profile Modal) */}
      <AnimatePresence>
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="relative w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Edit3 className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">编辑名片资料</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveProfile} className="p-5 space-y-4 overflow-y-auto">
                {/* 实时名片预览 */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-xl text-white font-bold select-none shrink-0"
                    style={{ backgroundColor: formAvatarColor }}
                  >
                    {formAvatarUrl ? (
                      <img src={formAvatarUrl} alt="预览" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span>{formAvatarEmoji || '创'}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400">名片效果预览</div>
                    <div className="text-sm font-bold text-slate-900 truncate">
                      {formDouyinName || user.username}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[11px] text-slate-600">
                        {formCreatorId || creatorCode}
                      </span>
                      <span>·</span>
                      <span>{creatorTitle}</span>
                    </div>
                  </div>
                </div>

                {/* 创作者公开代号 / 笔名 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <TikTokIcon className="w-3.5 h-3.5 text-slate-700" />
                    <span>创作者称谓 / 抖音号</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formDouyinName}
                    onChange={(e) => setFormDouyinName(e.target.value)}
                    placeholder="请输入公开创作者代号或称谓"
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:border-[#6B50F0] focus:outline-hidden transition"
                  />
                </div>

                {/* 创作宣言 / 个人简介 (Bio) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>创作宣言 / 个人简介</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formBio}
                    onChange={(e) => setFormBio(e.target.value)}
                    placeholder="例如：专注于近代地缘大战略沙盘架构与架空历史剧本创作。"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:border-[#6B50F0] focus:outline-hidden transition resize-none"
                  />
                </div>

                {/* 创作者代码 (Creator ID) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <FolderGit2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>CR 专属创作代码</span>
                    </span>
                    <span className="text-[10px] text-slate-400">用于作品归属核验</span>
                  </label>
                  <input
                    type="text"
                    value={formCreatorId}
                    onChange={(e) => setFormCreatorId(e.target.value)}
                    placeholder="如：CR-43HV 或 T4-PL-9824"
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:border-[#6B50F0] focus:outline-hidden transition font-mono"
                  />
                </div>

                {/* 创作者认证状态切换 */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-[#6B50F0]" />
                    <div>
                      <div className="text-xs font-medium text-slate-800">创作者身份认证</div>
                      <div className="text-[11px] text-slate-400">展示轻量创作者身份标识</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formIsCreator}
                    onChange={(e) => setFormIsCreator(e.target.checked)}
                    className="w-4 h-4 text-[#6B50F0] rounded focus:ring-[#6B50F0] cursor-pointer"
                  />
                </div>

                {/* 创作者专属图腾 Emoji */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Smile className="w-3.5 h-3.5 text-slate-500" />
                    <span>挑选专属头像 Emoji</span>
                  </label>
                  <div className="grid grid-cols-8 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    {CREATOR_PRESET_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setFormAvatarEmoji(emoji);
                          setFormAvatarUrl('');
                        }}
                        className={`h-8 rounded-md flex items-center justify-center text-base transition cursor-pointer ${
                          formAvatarEmoji === emoji && !formAvatarUrl
                            ? 'bg-white shadow-xs ring-2 ring-[#6B50F0]'
                            : 'hover:bg-slate-200/70'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 工坊主色调 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-slate-500" />
                    <span>挑选名片背景色</span>
                  </label>
                  <div className="grid grid-cols-6 gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    {CREATOR_THEME_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setFormAvatarColor(c.value)}
                        className={`h-7 rounded-md transition-transform active:scale-95 flex items-center justify-center cursor-pointer ${
                          formAvatarColor === c.value ? 'ring-2 ring-slate-900 ring-offset-1 scale-105' : ''
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      >
                        {formAvatarColor === c.value && <Check className="w-3 h-3 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 网络头像 URL (选填) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>网络头像图片 URL (选填)</span>
                    {formAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => setFormAvatarUrl('')}
                        className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                      >
                        清除图片
                      </button>
                    )}
                  </label>
                  <input
                    type="url"
                    value={formAvatarUrl}
                    onChange={(e) => setFormAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:border-[#6B50F0] focus:outline-hidden transition font-mono"
                  />
                </div>

                {/* 安全改密 (选填) */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>修改登录密码 (留空则不修改)</span>
                  </label>
                  <input
                    type="password"
                    value={formNewPassword}
                    onChange={(e) => setFormNewPassword(e.target.value)}
                    placeholder="输入新密码 (至少4位字符)"
                    minLength={4}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:border-[#6B50F0] focus:outline-hidden transition"
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 rounded-lg bg-[#6B50F0] hover:bg-[#5B3FE0] text-white text-xs font-medium transition shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? '保存中...' : '保存更改'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 抖音样式个人资料编辑弹窗（图1核心还原） */}
      {user && (
        <DouyinEditProfileModal
          isOpen={isDouyinEditOpen}
          onClose={() => setIsDouyinEditOpen(false)}
          user={user}
          onSave={handleSaveDouyinProfile}
          showToast={showToast}
        />
      )}

      {/* 抖音名片二维码弹窗（点击二维码图标弹出） */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-5 text-center relative overflow-hidden"
            >
              {/* 背景微光 */}
              <div className="absolute -top-16 inset-x-0 h-32 bg-gradient-to-b from-indigo-100 to-transparent pointer-events-none" />

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center space-y-2 pt-2">
                <div
                  className="w-16 h-16 rounded-full border-2 border-white shadow-md overflow-hidden flex items-center justify-center text-2xl text-white font-bold"
                  style={{ backgroundColor: user?.avatarColor || '#6B50F0' }}
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : user?.avatarEmoji ? (
                    <span>{user.avatarEmoji}</span>
                  ) : (
                    <span>{displayName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-lg">{displayName}</h3>
                <p className="text-xs text-slate-500 font-mono">抖音号：{currentDouyinId}</p>
              </div>

              {/* 二维码展示区域 */}
              <div className="mx-auto w-52 h-52 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-4">
                <div className="w-36 h-36 bg-white p-2.5 rounded-xl shadow-xs flex items-center justify-center border border-slate-100">
                  <div className="grid grid-cols-6 gap-1 w-full h-full p-1 bg-slate-900 rounded-lg">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-xs ${
                          (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30 || i === 35
                            ? 'bg-white'
                            : (i * 7) % 5 === 0
                            ? 'bg-indigo-400'
                            : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 mt-2">扫一扫，在创联世界中互关好友</div>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    copyToClipboard(currentDouyinId, 'douyin');
                    showToast('已复制抖音号');
                  }}
                  className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  复制抖音号
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast('名片码已保存至本地相册');
                    setShowQrModal(false);
                  }}
                  className="px-5 py-2 rounded-full bg-[#6B50F0] hover:bg-[#5B3FE0] text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  保存名片码
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 添加好友 / 互关列表弹窗（图2左上角「添加好友」触发） */}
      <AnimatePresence>
        {showAddFriendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 relative"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#6B50F0]" />
                  <h3 className="font-bold text-slate-900 text-base">添加创作者好友</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddFriendModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 搜索创作者 */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="搜索创作者称谓、抖音号或 CR 代码..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#6B50F0] focus:outline-hidden transition"
                />
              </div>

              {/* 推荐互关创作者列表 */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500">推演圈可能认识的人</div>
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                  {[
                    { name: '玲玉', id: 'lingyu_core', desc: '生活号 · 创作者联盟', avatar: '玲' },
                    { name: '龙神', id: 'dragon_god', desc: '大战略沙盘研讨组 · 殿堂架构师', avatar: '龙' },
                    { name: '创联使徒-03', id: 'cl_03', desc: '近代地缘兵推推演者', avatar: '创' },
                  ].map((creator) => (
                    <div key={creator.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700 shrink-0">
                          {creator.avatar}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-slate-800 truncate">{creator.name}</div>
                          <div className="text-[11px] text-slate-400 truncate">{creator.desc}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => showToast(`已向 ${creator.name} 发送互关申请`)}
                        className="px-3 py-1 rounded-full bg-slate-100 hover:bg-[#6B50F0] hover:text-white text-slate-700 text-xs font-semibold transition cursor-pointer shrink-0"
                      >
                        + 关注
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowAddFriendModal(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 系统设置与模拟推演弹窗 */}
      <SettingsDebugModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        showToast={showToast}
      />
    </div>
  );
};
