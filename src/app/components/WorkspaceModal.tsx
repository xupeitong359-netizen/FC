import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  MoreVertical,
  Bell,
  Info,
  Layers,
  BookOpen,
  Zap,
  Flag,
  Shield,
  Heart,
  MessageSquare,
  Sparkles,
  Share2,
  RefreshCw,
  FolderGit2,
  Plus,
  Check,
  Globe2,
  Lock,
  ChevronRight,
  X,
  Send,
  Calendar,
  SlidersHorizontal,
  Compass,
  User,
  CornerDownRight,
  Flame,
  Maximize2,
  Minimize2,
  Landmark,
  Crown,
  Castle,
  Anchor,
  Target,
  Feather,
  Swords,
} from 'lucide-react';
import {
  workspaceService,
  WorkspaceItem,
  WorkspaceComment,
} from '../services/workspaceService';
import { useAuth } from '../context/AuthContext';
import { Nation } from '../types';
import { api } from '../services/api';
import { WorldMap } from './WorldMap';
import { WorkspaceScenariosTab } from './WorkspaceScenariosTab';
import { WorkspaceEventsTab } from './WorkspaceEventsTab';
import { WorkspaceNationsTab } from './WorkspaceNationsTab';
import { WorkspaceRulesTab } from './WorkspaceRulesTab';
import { WorkspaceCreationWizard } from './WorkspaceCreationWizard';
import { WorkspaceTimelineTab } from './WorkspaceTimelineTab';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onWorkspaceSelected?: (workspace: WorkspaceItem) => void;
  variant?: 'modal' | 'page';
  nations?: Nation[];
  myNation?: Nation | null;
  onSelectNation?: (nation: Nation) => void;
  onOpenDiplomacy?: (nation: Nation) => void;
}

type WorkspaceNavTab = 'overview' | 'map' | 'scenarios' | 'events' | 'nations' | 'rules';

const getWorkspaceTotemIcon = (id?: string) => {
  switch (id) {
    case 'shield': return Shield;
    case 'crown': return Crown;
    case 'compass': return Compass;
    case 'flag': return Flag;
    case 'globe': return Globe2;
    case 'anchor': return Anchor;
    case 'flame': return Flame;
    case 'zap': return Zap;
    case 'target': return Target;
    case 'feather': return Feather;
    case 'castle': return Castle;
    case 'swords': return Swords;
    default: return Landmark;
  }
};

const PRESET_ERAS = [
  '1936年',
  '1939年',
  '1942—1945年',
  '冷战时期',
  '21世纪初',
  '近未来',
  '架空纪元',
];

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
  onWorkspaceSelected,
  variant = 'page',
  nations: initialNations,
  myNation,
  onSelectNation,
  onOpenDiplomacy,
}) => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [internalNations, setInternalNations] = useState<Nation[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>(() =>
    workspaceService.getWorkspaces()
  );
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() =>
    workspaceService.getActiveWorkspaceId()
  );

  useEffect(() => {
    if (!initialNations || initialNations.length === 0) {
      api.nations.list().then((data) => {
        if (data && data.nations) setInternalNations(data.nations);
      }).catch(() => {});
    }
  }, [initialNations]);

  const activeNations = (initialNations && initialNations.length > 0) ? initialNations : internalNations;

  // Active top-level subtab: 概览 | 地图 | 剧本 | 事件 | 国家 | 规则
  const [activeNavTab, setActiveNavTab] = useState<WorkspaceNavTab>('overview');

  // Secondary Drawer states: 'info' | 'comments' | 'create' | 'edit' | null
  const [activeDrawer, setActiveDrawer] = useState<'info' | 'comments' | 'create' | 'edit' | null>(
    null
  );

  // Step-by-step Creation Wizard state
  const [isCreationWizardOpen, setIsCreationWizardOpen] = useState(false);

  // More menu dropdown
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Creator privilege
  const isCreator = Boolean(
    user?.isCreator ||
      user?.isLingyuBaby ||
      user?.role === 'admin' ||
      Boolean(localStorage.getItem('creator_profile_auth'))
  );

  // New Workspace form state
  const [newName, setNewName] = useState('粉陆纪元·开天辟地');
  const [newEra, setNewEra] = useState('1936年');
  const [newCustomEra, setNewCustomEra] = useState('');
  const [newScenarioType, setNewScenarioType] = useState<'拟实' | '架空'>('架空');
  const [newVisibility, setNewVisibility] = useState<'public' | 'private'>('public');
  const [newDescription, setNewDescription] = useState(
    '粉陆大陆秩序初定，万邦立宪自决，重构全球文明版图与政治格局。'
  );

  // Comment input state
  const [commentText, setCommentText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [likedCommentIds, setLikedCommentIds] = useState<Record<string, boolean>>({});
  const [commentExtraLikes, setCommentExtraLikes] = useState<Record<string, number>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleToggleCommentLike = (commentId: string) => {
    setLikedCommentIds((prev) => {
      const isLiked = !!prev[commentId];
      setCommentExtraLikes((likes) => ({
        ...likes,
        [commentId]: (likes[commentId] || 0) + (isLiked ? -1 : 1),
      }));
      return { ...prev, [commentId]: !isLiked };
    });
  };

  const handleReplyToComment = (authorName: string) => {
    setCommentText((prev) => {
      const prefix = `@${authorName} `;
      if (prev.startsWith(prefix)) return prev;
      return prefix + prev;
    });
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleInsertTopicTag = (tag: string) => {
    setCommentText((prev) => {
      if (prev.includes(tag)) return prev;
      return `${tag} ${prev}`.trim();
    });
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const formatCommentTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 60) return '刚刚';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}分钟前`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}小时前`;
      return date.toLocaleDateString([], {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Edit workspace state
  const [editingWorkspace, setEditingWorkspace] = useState<WorkspaceItem | null>(null);

  // Fullscreen Map State and Auto-Fullscreen Preference
  const [isFullscreenMap, setIsFullscreenMap] = useState(false);
  const [autoFullscreenMap, setAutoFullscreenMap] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ws_auto_fullscreen_map') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreenMap(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleOpenCreationWizard = () => {
    if (!isCreator) {
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: {
            message: '仅已注册的创作者可构筑推演沙盘，请先注册/认证创作者账户',
          },
        })
      );
      onOpenAuth('register');
      return;
    }
    setIsCreationWizardOpen(true);
  };

  useEffect(() => {
    const handleOpenWizard = () => {
      handleOpenCreationWizard();
    };
    window.addEventListener('open-workspace-wizard', handleOpenWizard);
    return () => window.removeEventListener('open-workspace-wizard', handleOpenWizard);
  }, [isCreator]);

  const handleEnterFullscreenMap = async () => {
    setActiveNavTab('map');
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreenMap(true);
      }
    } catch (err) {
      console.warn('Fullscreen entry prevented or unsupported in context', err);
    }
    showToast('已开启全景沉浸推演地图模式');
  };

  const handleExitFullscreenMap = async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      // ignore
    }
    setIsFullscreenMap(false);
  };

  // Trigger fullscreen automatically when entering map tab if preference enabled
  useEffect(() => {
    if (activeNavTab === 'map' && autoFullscreenMap && !document.fullscreenElement) {
      try {
        document.documentElement.requestFullscreen?.();
      } catch {
        // ignore
      }
    }
  }, [activeNavTab, autoFullscreenMap]);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const activeWs =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  useEffect(() => {
    const handleUpdate = () => {
      setWorkspaces(workspaceService.getWorkspaces());
      setActiveWorkspaceId(workspaceService.getActiveWorkspaceId());
    };
    window.addEventListener('workspaces-updated', handleUpdate);
    window.addEventListener('active-workspace-changed', handleUpdate);
    return () => {
      window.removeEventListener('workspaces-updated', handleUpdate);
      window.removeEventListener('active-workspace-changed', handleUpdate);
    };
  }, []);

  // Close more menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const currentDeviceId =
    user?.id ||
    'guest_device_' +
      (localStorage.getItem('chuanglian_guest_device_id') ||
        (() => {
          const gen = Math.random().toString(36).substring(2, 10);
          localStorage.setItem('chuanglian_guest_device_id', gen);
          return gen;
        })());

  const hasLikedCurrent = activeWs
    ? workspaceService.hasLiked(activeWs.id, currentDeviceId)
    : false;

  const activeChronicles = activeWs
    ? workspaceService.getChronicles(activeWs.id)
    : [];

  const handleLike = (wsId: string) => {
    workspaceService.toggleLike(wsId, currentDeviceId);
    setWorkspaces(workspaceService.getWorkspaces());
  };

  const handleSelectWorkspace = (ws: WorkspaceItem) => {
    workspaceService.setActiveWorkspaceId(ws.id);
    setActiveWorkspaceId(ws.id);
    if (onWorkspaceSelected) onWorkspaceSelected(ws);
    setActiveDrawer(null);
    showToast(`已载入工作区：${ws.name}`);
  };

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const chosenEra =
      newEra === '自定义' ? newCustomEra.trim() || '自定义纪元' : newEra;
    const creatorName =
      user?.douyinName || user?.username || '创联推演者';
    const creatorId =
      user?.id || 'usr_creator_' + Math.random().toString(36).substring(2, 7);

    const created = workspaceService.createWorkspace({
      name: newName.trim(),
      era: chosenEra,
      scenarioType: newScenarioType,
      scenarioName: newName.trim(),
      scenarioEra: chosenEra,
      scenarioDesc: newDescription.trim(),
      visibility: newVisibility,
      description: newDescription.trim(),
      creatorId,
      creatorName,
    });

    setWorkspaces(workspaceService.getWorkspaces());
    setActiveWorkspaceId(created.id);
    if (onWorkspaceSelected) onWorkspaceSelected(created);
    setActiveDrawer(null);
    showToast(`已成功创建并激活工作区：${created.name}`);
    setNewName('');
    setNewDescription('');
  };

  const handleUpdateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkspace) return;

    workspaceService.updateWorkspace(editingWorkspace.id, {
      name: editingWorkspace.name,
      era: editingWorkspace.era,
      visibility: editingWorkspace.visibility,
      description: editingWorkspace.description,
    });

    setWorkspaces(workspaceService.getWorkspaces());
    setEditingWorkspace(null);
    setActiveDrawer(null);
    showToast('工作区设置已更新');
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentError(null);

    const isGuest = !isAuthenticated;
    const authorName = isAuthenticated
      ? user?.douyinName || user?.username || '领主'
      : guestName.trim() || '访客探员';

    const result = workspaceService.addComment(activeWs.id, {
      authorName,
      authorAvatar: user?.avatarUrl,
      authorColor: user?.avatarColor || '#6366f1',
      content: commentText.trim(),
      isGuest,
    });

    if (!result.success) {
      if (result.requiresAuth) {
        setCommentError(
          result.message || '访客免登录留言已达上限（3条），请注册账户继续互动'
        );
        setTimeout(() => {
          onOpenAuth('register');
        }, 1200);
      } else {
        setCommentError(result.message || '留言失败');
      }
      return;
    }

    setCommentText('');
    setWorkspaces(workspaceService.getWorkspaces());
  };

  // Swipe-to-exit gesture state (大幅度向右滑动页面退出进入主页)
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isExitingViaSwipe, setIsExitingViaSwipe] = useState(false);
  const touchStartPos = useRef<{ x: number; y: number; time: number } | null>(null);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const handleOpenSettings = () => {
    if (activeWs) {
      setEditingWorkspace(activeWs);
      setActiveDrawer('edit');
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // If a drawer or wizard is open, let drawer handle its own touches
    if (activeDrawer || isCreationWizardOpen) return;

    // Avoid hijacking inputs, buttons, sliders, or map canvas panning
    const target = e.target as HTMLElement | null;
    if (
      target?.closest(
        'input, textarea, select, button, .leaflet-container, canvas, [data-prevent-swipe="true"]'
      )
    ) {
      return;
    }

    const touch = e.touches[0];
    // If on map tab, only allow edge swipe from left side (e.g. x < 45) to not conflict with map panning
    if (activeNavTab === 'map' && touch.clientX > 45) {
      return;
    }

    touchStartPos.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    isHorizontalSwipe.current = null;
    setIsSwiping(false);
    setSwipeX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current || isExitingViaSwipe) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartPos.current.x;
    const deltaY = touch.clientY - touchStartPos.current.y;

    // Determine direction on first subtle movement (> 5px)
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        // Only trigger if moving rightwards and horizontal movement clearly leads
        if (deltaX > 0 && deltaX > Math.abs(deltaY) * 1.05) {
          isHorizontalSwipe.current = true;
        } else {
          isHorizontalSwipe.current = false;
        }
      }
    }

    if (isHorizontalSwipe.current) {
      if (deltaX > 0) {
        setIsSwiping(true);
        // Dampen swipe smoothly for responsive, natural physical feel
        const dampenedX = deltaX > 90 ? 90 + (deltaX - 90) * 0.35 : deltaX;
        setSwipeX(dampenedX);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartPos.current || !isHorizontalSwipe.current || isExitingViaSwipe) {
      touchStartPos.current = null;
      isHorizontalSwipe.current = null;
      setIsSwiping(false);
      setSwipeX(0);
      return;
    }

    const elapsed = Date.now() - touchStartPos.current.time;
    const velocity = swipeX / Math.max(elapsed, 1); // px/ms

    // Natural shortened threshold: Distance >= 52px, or distance >= 32px with flick velocity > 0.30 px/ms
    const isExitSwipe = swipeX >= 52 || (swipeX >= 32 && velocity > 0.30);

    if (isExitSwipe) {
      setIsExitingViaSwipe(true);
      showToast('正在退出工作区，返回主页...');
      setTimeout(() => {
        onClose();
        setIsExitingViaSwipe(false);
        setSwipeX(0);
        setIsSwiping(false);
      }, 180);
    } else {
      setSwipeX(0);
      setIsSwiping(false);
    }

    touchStartPos.current = null;
    isHorizontalSwipe.current = null;
  };

  const handleTouchCancel = () => {
    touchStartPos.current = null;
    isHorizontalSwipe.current = null;
    setIsSwiping(false);
    setSwipeX(0);
  };

  // Content for the entire workstation (Full-Screen Single-Page Experience)
  const renderWorkstationContent = () => (
    <div
      className="w-full h-full bg-[#F8F9FC] text-slate-800 flex flex-col overflow-hidden select-none relative"
      style={{
        transform: isExitingViaSwipe
          ? 'translateX(100%)'
          : isSwiping
          ? `translateX(${Math.min(swipeX * 0.28, 48)}px)`
          : 'none',
        opacity: isExitingViaSwipe ? 0 : 1,
        transition: isExitingViaSwipe
          ? 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease-out'
          : isSwiping
          ? 'none'
          : 'transform 0.25s ease-out, opacity 0.25s ease-out',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {/* Dynamic Gesture Feedback Indicator on Left Screen Edge */}
      {swipeX > 6 && (
        <div
          className="fixed top-1/2 -translate-y-1/2 left-0 z-50 pointer-events-none transition-all duration-75 flex items-center"
          style={{
            transform: `translateX(${Math.min(swipeX * 0.6, 52)}px) translateY(-50%)`,
            opacity: Math.min(swipeX / 30, 1),
          }}
        >
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-r-2xl shadow-xl backdrop-blur-md border transition-all duration-150 ${
              swipeX >= 52
                ? 'bg-indigo-600 text-white border-indigo-500 scale-105 shadow-indigo-500/25'
                : 'bg-white/95 text-slate-800 border-slate-200/90 shadow-slate-900/10'
            }`}
          >
            <ArrowRight
              className={`w-4 h-4 transition-transform duration-150 shrink-0 ${
                swipeX >= 52 ? 'translate-x-1 text-white' : 'text-indigo-600'
              }`}
            />
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-tight leading-tight">
                {swipeX >= 52 ? '松手立即退出' : '轻滑退出'}
              </span>
              <span
                className={`text-[10px] font-medium leading-none ${
                  swipeX >= 52 ? 'text-indigo-100' : 'text-slate-400'
                }`}
              >
                返回大厅主页
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 1. TOP HEADER: 工作区全局顶栏 (← 推演工作区 · 导航标签 · 快捷操作) */}
      <header className="shrink-0 bg-white/98 backdrop-blur-md border-b border-slate-200/90 px-2 sm:px-4 py-2 flex items-center justify-between gap-1.5 sm:gap-2 shadow-2xs relative z-50">
        {/* Left: Back & Workspace Identity */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
          <button
            id="ws-header-back-btn"
            type="button"
            onClick={activeNavTab !== 'overview' ? () => setActiveNavTab('overview') : onClose}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1 font-bold text-xs"
            title={activeNavTab !== 'overview' ? '返回工作区总览' : '返回主页（亦可向右轻滑页面退出）'}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{activeNavTab !== 'overview' ? '返回总览' : '返回主页'}</span>
          </button>

          <div className="h-4 w-px bg-slate-200 shrink-0 hidden sm:block" />

          {/* Workspace Title & Era Badge */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
              <FolderGit2 className="w-4 h-4" />
            </div>

            <div className="min-w-0 flex items-center gap-1.5 flex-1">
              <h1 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight truncate max-w-[170px] xs:max-w-[230px] sm:max-w-[340px] md:max-w-[460px]">
                {activeWs?.name || '1936 全球风云地缘沙盘'}
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 shrink-0">
                {activeWs?.era || '1936年'}
              </span>
              <span
                className={`hidden sm:inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold items-center gap-0.5 shrink-0 ${
                  activeWs?.visibility === 'public'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    activeWs?.visibility === 'public' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <span>{activeWs?.visibility === 'public' ? '公开' : '私密'}</span>
              </span>

              {/* Sub-view Breadcrumb indicator when inside a module */}
              {activeNavTab !== 'overview' && (
                <div className="flex items-center gap-1 shrink-0 ml-1">
                  <span className="text-slate-300 text-xs">/</span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100/80">
                    {activeNavTab === 'scenarios' && '剧本库'}
                    {activeNavTab === 'events' && '战报大事记'}
                    {activeNavTab === 'nations' && '参演国家'}
                    {activeNavTab === 'rules' && '推演规则'}
                    {activeNavTab === 'map' && '全景地图'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions (全屏地图 | 设置 | 沙盘库 | 更多 | 退出) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0" ref={moreMenuRef}>
          {/* 全屏地图 快捷入口 */}
          <button
            id="ws-header-fullscreen-btn"
            type="button"
            onClick={isFullscreenMap ? handleExitFullscreenMap : handleEnterFullscreenMap}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer border ${
              isFullscreenMap || activeNavTab === 'map'
                ? 'bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border-indigo-200/90 shadow-2xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90'
            }`}
            title={isFullscreenMap ? '退出全屏沉浸地图' : '全屏进入推演地图'}
          >
            {isFullscreenMap ? (
              <Minimize2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            )}
            <span className="hidden xs:inline sm:inline">{isFullscreenMap ? '退出全屏' : '全屏地图'}</span>
          </button>

          {/* 设置 快捷入口 (沙盘参数配置与编辑) */}
          <button
            id="ws-header-settings-btn"
            type="button"
            onClick={handleOpenSettings}
            className="flex items-center gap-1 p-1.5 sm:px-2 sm:py-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer active:scale-95 text-xs font-bold"
            title="沙盘设置与参数调整"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-600" />
            <span className="hidden md:inline">设置</span>
          </button>

          {/* 沙盘库 */}
          <button
            id="ws-info-pill-btn"
            type="button"
            onClick={() => setActiveDrawer('info')}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
            title="工作区信息与切换沙盘"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-slate-600" />
            <span>沙盘库</span>
          </button>

          {/* More Options Dropdown Button */}
          <div className="relative">
            <button
              id="ws-header-more-btn"
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer active:scale-95"
              title="更多操作"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <>
                {/* Fullscreen transparent backdrop to capture clicks outside and prevent click-through */}
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setShowMoreMenu(false)}
                />
                <div className="absolute right-0 mt-1.5 w-52 sm:w-56 bg-white/98 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl p-1.5 z-50 space-y-1 animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenSettings();
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer transition"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>沙盘设置与规则调整</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDrawer('info');
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer transition"
                  >
                    <FolderGit2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>切换推演工作区</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleOpenCreationWizard();
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>分步构筑新沙盘</span>
                  </button>

                  {/* 次级研判留言记录入口 */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDrawer('comments');
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>推演研判记录</span>
                    {(activeWs?.comments || []).length > 0 && (
                      <span className="ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200/60">
                        {(activeWs?.comments || []).length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      showToast('已复制工作区直达链接');
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer transition"
                  >
                    <Share2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>分享沙盘链接</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.reload();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>刷新沙盘数据</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            id="ws-header-close-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer active:scale-95"
            title="退出工作区返回主页"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN CONTENT VIEW CONTAINER (一页看完整体页面 / 纯净全屏沉浸式) */}
      <main className="flex-1 w-full h-[calc(100vh-52px)] overflow-hidden p-2 sm:p-3">
        {/* VIEW 1: 概览 (OVERVIEW) - Single-Screen Fitted Dashboard */}
        {activeNavTab === 'overview' && (
          <div className="h-full w-full">
            {/* Desktop & Tablet Layout (sm and up >= 640px): 2 Columns fitting 100% of viewport, maximizing map width */}
            <div className="hidden sm:flex gap-2 lg:gap-2.5 h-full overflow-hidden">
              {/* Left Column: Hero Interactive Map (Expanded, takes 80-88% of screen) */}
              <section
                aria-label="核心地图区域"
                className="flex-1 h-full min-w-0 rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs relative bg-slate-100 flex flex-col"
              >
                <WorldMap
                  nations={activeNations}
                  myNation={myNation}
                  onSelectNation={onSelectNation}
                  onOpenDiplomacy={onOpenDiplomacy}
                  onToggleFullscreen={handleEnterFullscreenMap}
                  isFullscreen={isFullscreenMap}
                />
              </section>

              {/* Right Column: Status & 2x2 Modules (Ultra-compact slim width: 190px - 225px) */}
              <aside
                aria-label="工作区状态与模块"
                className="w-44 md:w-48 lg:w-52 xl:w-56 shrink-0 h-full flex flex-col justify-between gap-1.5 overflow-y-auto no-scrollbar"
              >
                {/* 1. Workspace Info & Status Card */}
                <div className="bg-white border border-slate-200/90 rounded-xl p-2 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="text-[11px] font-black text-slate-800 truncate">活跃推演沙盘</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveDrawer('info')}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer shrink-0"
                    >
                      切换
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-600 font-medium leading-relaxed bg-slate-50/80 p-1.5 rounded-lg border border-slate-100 line-clamp-2">
                    {activeWs?.description ||
                      '1936年欧亚大陆地缘大变局，世界秩序重构的前夜。包含完备的国界拓扑、工业实力与地缘条约。'}
                  </p>
                </div>

                {/* 2. 2x2 Core Functional Modules */}
                <div className="bg-white border border-slate-200/90 rounded-xl p-2 shadow-2xs flex-1 flex flex-col justify-center space-y-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[11px] font-black text-slate-900 tracking-tight">工作区模块</h2>
                    <button
                      type="button"
                      onClick={() => setActiveDrawer('info')}
                      className="text-[10px] font-bold text-indigo-600 flex items-center gap-0.5 cursor-pointer hover:text-indigo-700"
                    >
                      <span>管理</span>
                      <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1 flex-1 items-stretch">
                    {/* Module 1: 剧本 */}
                    <button
                      id="ws-module-scenarios"
                      type="button"
                      onClick={() => setActiveNavTab('scenarios')}
                      className="p-1.5 rounded-lg bg-slate-50/80 hover:bg-purple-50/50 border border-slate-100 hover:border-purple-200 transition text-left flex flex-col justify-between cursor-pointer active:scale-98 group"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="w-5 h-5 rounded-md bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                          <BookOpen className="w-2.5 h-2.5" />
                        </div>
                        <ChevronRight className="w-2.5 h-2.5 text-slate-300 group-hover:text-purple-600 transition-colors" />
                      </div>
                      <div className="mt-0.5 min-w-0">
                        <div className="font-bold text-[10px] text-slate-900 truncate">剧本</div>
                        <div className="text-[9px] text-slate-400 font-medium truncate">2 个剧本</div>
                      </div>
                    </button>

                    {/* Module 2: 战报大事记 */}
                    <button
                      id="ws-module-events"
                      type="button"
                      onClick={() => setActiveNavTab('events')}
                      className="p-1.5 rounded-lg bg-slate-50/80 hover:bg-rose-50/50 border border-slate-100 hover:border-rose-200 transition text-left flex flex-col justify-between cursor-pointer active:scale-98 group"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="w-5 h-5 rounded-md bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                          <Flame className="w-2.5 h-2.5" />
                        </div>
                        <ChevronRight className="w-2.5 h-2.5 text-slate-300 group-hover:text-rose-600 transition-colors" />
                      </div>
                      <div className="mt-0.5 min-w-0">
                        <div className="font-bold text-[10px] text-slate-900 truncate">战报大事记</div>
                        <div className="text-[9px] text-slate-400 font-medium truncate">
                          {activeChronicles.length} 条战报
                        </div>
                      </div>
                    </button>

                    {/* Module 3: 国家 */}
                    <button
                      id="ws-module-nations"
                      type="button"
                      onClick={() => setActiveNavTab('nations')}
                      className="p-1.5 rounded-lg bg-slate-50/80 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 transition text-left flex flex-col justify-between cursor-pointer active:scale-98 group"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="w-5 h-5 rounded-md bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                          <Flag className="w-2.5 h-2.5" />
                        </div>
                        <ChevronRight className="w-2.5 h-2.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div className="mt-0.5 min-w-0">
                        <div className="font-bold text-[10px] text-slate-900 truncate">国家</div>
                        <div className="text-[9px] text-slate-400 font-medium truncate">193 个国家</div>
                      </div>
                    </button>

                    {/* Module 4: 规则 */}
                    <button
                      id="ws-module-rules"
                      type="button"
                      onClick={() => setActiveNavTab('rules')}
                      className="p-1.5 rounded-lg bg-slate-50/80 hover:bg-amber-50/50 border border-slate-100 hover:border-amber-200 transition text-left flex flex-col justify-between cursor-pointer active:scale-98 group"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="w-5 h-5 rounded-md bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                          <Shield className="w-2.5 h-2.5" />
                        </div>
                        <ChevronRight className="w-2.5 h-2.5 text-slate-300 group-hover:text-amber-600 transition-colors" />
                      </div>
                      <div className="mt-0.5 min-w-0">
                        <div className="font-bold text-[10px] text-slate-900 truncate">规则</div>
                        <div className="text-[9px] text-slate-400 font-medium truncate">8 条规则</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2.5 Micro Chronicle Timeline Pulse */}
                <div className="bg-white border border-slate-200/90 rounded-xl p-2 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 min-w-0">
                      <Flame className="w-3 h-3 text-rose-500 animate-pulse shrink-0" />
                      <span className="text-[11px] font-black text-slate-800 truncate">推演战报大事记</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveNavTab('events')}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer shrink-0 flex items-center gap-0.5"
                    >
                      <span>大事记轴</span>
                      <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {(activeChronicles.length > 0
                      ? activeChronicles.slice(0, 2)
                      : [
                          { id: 'def_c1', year: '1939.09', title: '突入边境要塞群，主力部队完成合围', tensionChange: '+20%' },
                          { id: 'def_c2', year: '1939.08', title: '苏德互不侵犯条约签署，东欧局势突变', tensionChange: '+10%' },
                        ]
                    ).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setActiveNavTab('events')}
                        className="p-1.5 rounded-lg bg-slate-50/90 hover:bg-indigo-50/60 border border-slate-100 hover:border-indigo-200 transition cursor-pointer text-left group"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-900 text-white shrink-0">
                            {item.year}
                          </span>
                          {item.tensionChange && item.tensionChange !== '0%' && (
                            <span className="text-[9px] font-bold text-rose-600 font-mono">
                              {item.tensionChange}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-800 line-clamp-1 mt-0.5 group-hover:text-indigo-600 transition-colors">
                          {item.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Bottom Quick Actions Strip */}
                <div className="bg-white border border-slate-200/90 rounded-xl p-1.5 shadow-2xs flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={handleOpenCreationWizard}
                    className="flex-1 py-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold transition cursor-pointer active:scale-95 flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3 h-3 text-emerald-400" />
                    <span>分步新建沙盘</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      showToast('已复制工作区直达链接');
                    }}
                    className="py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-[10px] font-bold transition cursor-pointer active:scale-95 flex items-center gap-0.5"
                    title="分享沙盘"
                  >
                    <Share2 className="w-3 h-3 text-blue-600" />
                    <span>分享</span>
                  </button>
                </div>
              </aside>
            </div>

            {/* Mobile Layout (< sm): Seamless fitting scroll view with compact centered card */}
            <div className="sm:hidden h-full overflow-y-auto space-y-2 pb-20">
              {/* Mobile Hero Map (expanded height) */}
              <section
                aria-label="核心地图区域"
                className="w-full h-[58vh] min-h-[340px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs relative bg-slate-100"
              >
                <WorldMap
                  nations={activeNations}
                  myNation={myNation}
                  onSelectNation={onSelectNation}
                  onOpenDiplomacy={onOpenDiplomacy}
                  onToggleFullscreen={handleEnterFullscreenMap}
                  isFullscreen={isFullscreenMap}
                />
              </section>

              {/* 2x2 Module Cards (constrained max width, slim and compact) */}
              <section
                aria-label="工作区功能模块"
                className="w-full max-w-[340px] mx-auto bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black text-slate-900 tracking-tight">工作区模块</h2>
                  <button
                    type="button"
                    onClick={() => setActiveDrawer('info')}
                    className="text-xs font-bold text-indigo-600 flex items-center gap-0.5"
                  >
                    <span>管理</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveNavTab('scenarios')}
                    className="p-2 rounded-lg bg-slate-50/80 border border-slate-100 text-left flex items-start gap-1.5 active:scale-98"
                  >
                    <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <BookOpen className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-[11px] text-slate-900">剧本</div>
                      <div className="text-[9px] text-slate-400">2 个剧本</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveNavTab('events')}
                    className="p-2 rounded-lg bg-slate-50/80 border border-slate-100 text-left flex items-start gap-1.5 active:scale-98"
                  >
                    <div className="w-6 h-6 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <Flame className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-[11px] text-slate-900">战报大事记</div>
                      <div className="text-[9px] text-slate-400">{activeChronicles.length} 条编年战报</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveNavTab('nations')}
                    className="p-2 rounded-lg bg-slate-50/80 border border-slate-100 text-left flex items-start gap-1.5 active:scale-98"
                  >
                    <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Flag className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-[11px] text-slate-900">国家</div>
                      <div className="text-[9px] text-slate-400">193 个国家</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveNavTab('rules')}
                    className="p-2 rounded-lg bg-slate-50/80 border border-slate-100 text-left flex items-start gap-1.5 active:scale-98"
                  >
                    <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Shield className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-[11px] text-slate-900">规则</div>
                      <div className="text-[9px] text-slate-400">8 条规则</div>
                    </div>
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* VIEW 2: 地图 (MAP) - Full Viewport Interactive Map */}
        {activeNavTab === 'map' && (
          <div className="h-full w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs relative bg-slate-100">
            <WorldMap
              nations={activeNations}
              myNation={myNation}
              onSelectNation={onSelectNation}
              onOpenDiplomacy={onOpenDiplomacy}
              onToggleFullscreen={isFullscreenMap ? handleExitFullscreenMap : handleEnterFullscreenMap}
              isFullscreen={isFullscreenMap}
            />
          </div>
        )}

        {/* VIEW 3: 剧本 (SCENARIOS) */}
        {activeNavTab === 'scenarios' && (
          <div className="h-full overflow-y-auto max-w-5xl mx-auto p-1 pb-16">
            <WorkspaceScenariosTab
              activeWorkspace={activeWs}
              onSelectScenario={(scName) => {
                showToast(`已成功载入剧本：${scName}`);
              }}
            />
          </div>
        )}

        {/* VIEW 4: 推演战报大事记 (EVENTS & CHRONICLES TIMELINE) */}
        {activeNavTab === 'events' && (
          <div className="h-full overflow-y-auto max-w-5xl mx-auto p-1 pb-16">
            <WorkspaceTimelineTab
              workspace={activeWs}
              onOpenCommentWithTag={(tag) => {
                handleInsertTopicTag(tag);
                setActiveDrawer('comments');
              }}
              showToast={showToast}
            />
          </div>
        )}

        {/* VIEW 5: 国家 (NATIONS) */}
        {activeNavTab === 'nations' && (
          <div className="h-full overflow-y-auto max-w-5xl mx-auto p-1 pb-16">
            <WorkspaceNationsTab />
          </div>
        )}

        {/* VIEW 6: 规则 (RULES) */}
        {activeNavTab === 'rules' && (
          <div className="h-full overflow-y-auto max-w-5xl mx-auto p-1 pb-16">
            <WorkspaceRulesTab />
          </div>
        )}
      </main>

      {/* 3. DRAWERS & MODALS (切换工作区 / 新建 / 留言板) */}
      <AnimatePresence>
        {activeDrawer && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveDrawer(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs cursor-pointer"
            />

            {/* Bottom Sheet / Modal Card */}
            <motion.div
              initial={{ y: '100%', opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.8 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className={`relative w-full ${
                activeDrawer === 'comments' ? 'max-w-xl' : 'max-w-lg'
              } bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden max-h-[88vh] flex flex-col z-10`}
            >
              {/* Drawer Header */}
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  {activeDrawer === 'info' && (
                    <FolderGit2 className="w-4 h-4 text-indigo-600" />
                  )}
                  {activeDrawer === 'comments' && (
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                  )}
                  {activeDrawer === 'create' && (
                    <Plus className="w-4 h-4 text-emerald-600" />
                  )}
                  {activeDrawer === 'edit' && (
                    <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                  )}

                  <h3 className="text-sm font-black text-slate-900">
                    {activeDrawer === 'info' && '推演工作区库'}
                    {activeDrawer === 'comments' && '推演研判留言板'}
                    {activeDrawer === 'create' && '新建推演工作区'}
                    {activeDrawer === 'edit' && '编辑工作区设置'}
                  </h3>

                  {activeDrawer === 'comments' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                      {(activeWs?.comments || []).length} 条研判
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveDrawer(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  title="关闭"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
                {/* DRAWER 1: INFO & SWITCH WORKSPACES */}
                {activeDrawer === 'info' && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-bold">
                        所有沙盘工作区（{workspaces.length}）
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenCreationWizard();
                          setActiveDrawer(null);
                        }}
                        className="text-indigo-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>分步新建向导</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {workspaces.map((ws) => {
                        const isActive = ws.id === activeWorkspaceId;
                        const isOwner = user?.id === ws.creatorId || isAdmin;
                        return (
                          <div
                            key={ws.id}
                            onClick={() => handleSelectWorkspace(ws)}
                            className={`p-3.5 rounded-xl border transition cursor-pointer ${
                              isActive
                                ? 'bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-200'
                                : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                {(() => {
                                  const TotemComp = getWorkspaceTotemIcon(ws.totemIcon);
                                  return (
                                    <span className="w-5 h-5 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                      <TotemComp className="w-3.5 h-3.5" />
                                    </span>
                                  );
                                })()}
                                <span className="font-bold text-xs text-slate-900 truncate">
                                  {ws.name}
                                </span>
                                {ws.scenarioType && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 shrink-0">
                                    {ws.scenarioType}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                                  {ws.era}
                                </span>
                                {isActive ? (
                                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                                    当前使用
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400">
                                    点击切换
                                  </span>
                                )}
                              </div>
                            </div>

                            {ws.description && (
                              <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                                {ws.description}
                              </p>
                            )}

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                              <span>创作者：{ws.creatorName}</span>
                              <div className="flex items-center gap-2">
                                <span>战报 {(ws.chronicles || []).length || 3}</span>
                                <span>点赞 {ws.likesCount || 0}</span>
                                <span>研讨 {ws.comments?.length || 0}</span>
                                {isOwner && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingWorkspace(ws);
                                      setActiveDrawer('edit');
                                    }}
                                    className="px-2 py-0.5 text-xs text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded font-bold transition cursor-pointer"
                                  >
                                    编辑
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* DRAWER 2: COMMENTS (推演研判留言板) */}
                {activeDrawer === 'comments' && (
                  <div className="space-y-3.5">
                    {/* 1. Header Atmosphere & Identity Status */}
                    <div className="p-3 bg-gradient-to-r from-indigo-50/90 via-slate-50 to-purple-50/60 border border-indigo-100/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-900 text-xs">
                              地缘战略研讨区
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100/80 text-indigo-700">
                              共 {(activeWs?.comments || []).length} 条研判
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                            探讨欧亚战役演进、国界划定与地缘同盟策略
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isAuthenticated ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/95 border border-indigo-200 rounded-lg text-[11px] font-bold text-indigo-700 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="truncate max-w-[120px]">
                              {user?.douyinName || user?.username || '已认证领主'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200/80 rounded-lg text-[10px] text-amber-800 font-medium">
                            <span>免登录访客</span>
                            <span className="font-bold text-indigo-600">
                              ({workspaceService.getGuestCommentCount()}/3 条)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                onOpenAuth('register');
                                setActiveDrawer(null);
                              }}
                              className="ml-1 text-indigo-600 hover:underline font-bold cursor-pointer"
                            >
                              注册解锁
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2. Quick Strategic Topic Tags */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                      <span className="text-[10px] text-slate-400 font-bold shrink-0 flex items-center gap-0.5">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>研讨标签:</span>
                      </span>
                      {[
                        '战略研判',
                        '历史复盘',
                        '外交斡旋',
                        '战况前线',
                        '规则建议',
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleInsertTopicTag(tag)}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-600 transition border border-slate-200/80 shrink-0 cursor-pointer active:scale-95"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    {/* 3. Comment Error Alert */}
                    {commentError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center justify-between">
                        <span>{commentError}</span>
                        <button
                          type="button"
                          onClick={() => setCommentError(null)}
                          className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* 4. Interactive Input Box */}
                    <form
                      onSubmit={handleSendComment}
                      className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100/80 transition"
                    >
                      {!isAuthenticated && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50/80 rounded-lg border border-slate-200/80">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            placeholder="您的推演代号/称谓（选填，默认：访客探员）"
                            className="w-full text-xs bg-transparent border-none text-slate-800 focus:outline-hidden font-medium placeholder-slate-400"
                          />
                        </div>
                      )}

                      <div className="relative">
                        <textarea
                          ref={textareaRef}
                          rows={3}
                          required
                          maxLength={300}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                              e.preventDefault();
                              handleSendComment(e);
                            }
                          }}
                          placeholder="输入您的战略洞见、战役推演部署或地缘博弈建言... (按 Ctrl+Enter 快捷发送)"
                          className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden resize-none leading-relaxed p-0.5"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                          <span>{commentText.length}/300 字</span>
                          <span className="hidden sm:inline">·</span>
                          <span className="hidden sm:inline">Ctrl+Enter 快捷发送</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {commentText && (
                            <button
                              type="button"
                              onClick={() => setCommentText('')}
                              className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs font-medium cursor-pointer"
                            >
                              清空
                            </button>
                          )}
                          <button
                            id="ws-drawer-comment-submit"
                            type="submit"
                            disabled={!commentText.trim()}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1 active:scale-95 disabled:pointer-events-none"
                          >
                            <Send className="w-3 h-3" />
                            <span>发表战论</span>
                          </button>
                        </div>
                      </div>
                    </form>

                    {/* 5. Comments Stream */}
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center justify-between px-0.5 text-xs">
                        <div className="flex items-center gap-1.5 font-black text-slate-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>研讨发言流</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({(activeWs?.comments || []).length})
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2.5 max-h-[380px] sm:max-h-[420px] overflow-y-auto pr-1">
                        {(activeWs?.comments || []).length === 0 ? (
                          <div className="text-center py-8 px-4 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-slate-400 space-y-2">
                            <div className="w-10 h-10 mx-auto rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
                              <MessageSquare className="w-5 h-5" />
                            </div>
                            <div className="font-bold text-slate-700 text-xs">
                              暂无推演研判记录
                            </div>
                            <p className="text-[11px] max-w-xs mx-auto text-slate-400">
                              成为第一位对当前沙盘发表战略剖析的领主，开启天下推演大局！
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setCommentText('愿与诸位推演领主共商地缘变局，共谋破局之道！');
                                setTimeout(() => textareaRef.current?.focus(), 50);
                              }}
                              className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer pt-1 inline-block"
                            >
                              一键填入探讨问候语
                            </button>
                          </div>
                        ) : (
                          (activeWs?.comments || []).map((cmt) => {
                            const isAuthor =
                              cmt.authorName === activeWs?.creatorName ||
                              cmt.authorName === '创联世界官方';
                            const isLiked = !!likedCommentIds[cmt.id];
                            const extraLikes = commentExtraLikes[cmt.id] || 0;
                            const totalCommentLikes = (isLiked ? 1 : 0) + extraLikes;

                            return (
                              <div
                                key={cmt.id}
                                className="p-3 bg-white border border-slate-200/90 rounded-xl text-xs space-y-2 hover:border-indigo-200 hover:shadow-2xs transition group"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div
                                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] text-white shrink-0 shadow-2xs"
                                      style={{
                                        backgroundColor: cmt.authorColor || '#6366f1',
                                      }}
                                    >
                                      {cmt.authorName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="font-bold text-slate-900 truncate max-w-[120px]">
                                        {cmt.authorName}
                                      </span>
                                      {isAuthor && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                          沙盘作者
                                        </span>
                                      )}
                                      {!isAuthor && !cmt.isGuest && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                                          推演领主
                                        </span>
                                      )}
                                      {cmt.isGuest && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded font-normal bg-slate-100 text-slate-500 shrink-0">
                                          访客
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                    {formatCommentTime(cmt.createdAt)}
                                  </span>
                                </div>

                                <p className="text-slate-700 text-xs leading-relaxed pl-8 font-normal whitespace-pre-wrap">
                                  {cmt.content}
                                </p>

                                <div className="flex items-center justify-end gap-3 pl-8 pt-1 text-[11px] text-slate-400">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCommentLike(cmt.id)}
                                    className={`flex items-center gap-1 text-[10px] font-bold transition cursor-pointer hover:text-pink-600 ${
                                      isLiked ? 'text-pink-600' : 'text-slate-400'
                                    }`}
                                    title="赞同发言"
                                  >
                                    <Heart
                                      className={`w-3 h-3 ${
                                        isLiked ? 'fill-pink-500 text-pink-500' : ''
                                      }`}
                                    />
                                    <span>{totalCommentLikes > 0 ? totalCommentLikes : '赞'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleReplyToComment(cmt.authorName)}
                                    className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                                    title="回复此条"
                                  >
                                    <CornerDownRight className="w-3 h-3" />
                                    <span>回复</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* DRAWER 3: CREATE WORKSPACE */}
                {activeDrawer === 'create' && (
                  <div>
                    {!isCreator ? (
                      <div className="py-6 px-3 text-center space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                          <Shield className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">
                            工作区是申请后创建的
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            普通用户可自由参与所有公开工作区的沙盘推演与留言；独立创建全新推演剧本工作区需具备创作者身份。
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onOpenAuth('register');
                            setActiveDrawer(null);
                          }}
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>注册创作者账户（免申请）</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3.5 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border border-indigo-200/90 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-indigo-600" />
                              <h4 className="text-xs font-black text-slate-900">推荐：分步创世向导 (3步打造定制沙盘)</h4>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                              包含预设历史模版、战备税率、阵营划分与沙盘专属图腾，打造沉浸式大战略推演。
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleOpenCreationWizard();
                              setActiveDrawer(null);
                            }}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shrink-0 shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                          >
                            <span>启动向导</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider py-0.5">
                          <div className="flex-1 h-px bg-slate-200" />
                          <span>或使用简易快速表单</span>
                          <div className="flex-1 h-px bg-slate-200" />
                        </div>

                        <form onSubmit={handleCreateWorkspace} className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            剧本名称 <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="如：粉陆纪元·开天辟地"
                            className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-600 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            剧本年代 <span className="text-rose-500">*</span>
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {PRESET_ERAS.map((era) => (
                              <button
                                key={era}
                                type="button"
                                onClick={() => setNewEra(era)}
                                className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition truncate ${
                                  newEra === era
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {era}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            剧本性质
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setNewScenarioType('拟实')}
                              className={`py-1.5 rounded-lg text-xs font-bold border transition ${
                                newScenarioType === '拟实'
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                  : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              拟实 (历史地缘)
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewScenarioType('架空')}
                              className={`py-1.5 rounded-lg text-xs font-bold border transition ${
                                newScenarioType === '架空'
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                  : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              架空 (自设大陆)
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            剧本简介
                          </label>
                          <textarea
                            rows={2}
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-600 transition resize-none"
                          />
                        </div>

                        <div className="pt-2 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveDrawer(null)}
                            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                          >
                            取消
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs"
                          >
                            立即创建
                          </button>
                        </div>
                      </form>
                    </div>
                    )}
                  </div>
                )}

                {/* DRAWER 4: EDIT WORKSPACE */}
                {activeDrawer === 'edit' && editingWorkspace && (
                  <form onSubmit={handleUpdateWorkspace} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        工作区名称
                      </label>
                      <input
                        type="text"
                        required
                        value={editingWorkspace.name}
                        onChange={(e) =>
                          setEditingWorkspace({
                            ...editingWorkspace,
                            name: e.target.value,
                          })
                        }
                        className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-600 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        推演年代
                      </label>
                      <input
                        type="text"
                        required
                        value={editingWorkspace.era}
                        onChange={(e) =>
                          setEditingWorkspace({
                            ...editingWorkspace,
                            era: e.target.value,
                          })
                        }
                        className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-600 transition"
                      />
                    </div>

                    {/* 全屏地图推演设置 */}
                    <div className="p-3 bg-gradient-to-br from-indigo-50/80 to-purple-50/50 border border-indigo-100 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>全屏进入推演地图</span>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-200/80">
                          沉浸全景
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        开启全屏沉浸后，沙盘完全铺满屏幕并隐藏多余边框，适配触控双指缩放与大屏推演研判。
                      </p>
                      <div className="pt-1 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDrawer(null);
                            handleEnterFullscreenMap();
                          }}
                          className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>立即全屏进入地图</span>
                        </button>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-indigo-100/80">
                        <label htmlFor="toggle-auto-fullscreen-map" className="text-xs font-bold text-slate-700 cursor-pointer">
                          进入地图选项卡时自动全屏
                        </label>
                        <input
                          id="toggle-auto-fullscreen-map"
                          type="checkbox"
                          checked={autoFullscreenMap}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setAutoFullscreenMap(checked);
                            try {
                              localStorage.setItem('ws_auto_fullscreen_map', String(checked));
                            } catch {
                              // ignore
                            }
                            showToast(checked ? '已开启：进入地图时自动全屏' : '已关闭：进入地图时自动全屏');
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveDrawer(null)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs"
                      >
                        保存设置
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. WORKSPACE CREATION WIZARD (分步创建向导) */}
      <WorkspaceCreationWizard
        isOpen={isCreationWizardOpen}
        onClose={() => setIsCreationWizardOpen(false)}
        isCreator={isCreator}
        onOpenAuth={onOpenAuth}
        user={user}
        onSuccess={(createdWs) => {
          setWorkspaces(workspaceService.getWorkspaces());
          setActiveWorkspaceId(createdWs.id);
          if (onWorkspaceSelected) onWorkspaceSelected(createdWs);
          showToast(`已成功构筑并进入推演工作区：${createdWs.name}`);
        }}
      />

      {/* Floating Toast Message */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg backdrop-blur-sm pointer-events-none"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 select-none overflow-hidden bg-[#F8F9FC]">
        {renderWorkstationContent()}
      </div>
    </AnimatePresence>
  );
};
