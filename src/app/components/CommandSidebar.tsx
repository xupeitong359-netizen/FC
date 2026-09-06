import React, { useRef } from 'react';
import {
  Globe,
  Landmark,
  FolderGit2,
  User,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CommandSidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  activeWarsCount?: number;
  unreadNotifsCount?: number;
  onOpenAdminPrompt?: () => void;
}

export const CommandSidebar: React.FC<CommandSidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAdminPrompt,
}) => {
  const { user, myNation, isAdmin } = useAuth();
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleBrandClick = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      if (onOpenAdminPrompt) {
        onOpenAdminPrompt();
      }
      return;
    }

    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 2500);

    setActiveTab('lobby');
  };

  const navItems = [
    {
      id: 'lobby',
      label: '万国国牒大厅',
      icon: Landmark,
      desc: '全球主权万邦大厅',
    },
    {
      id: 'world_map',
      label: '战略大地图',
      icon: Globe,
      hotkey: 'F1',
      badge: '核心',
      desc: '地缘沙盘与省份拓扑',
    },
    {
      id: 'workspace',
      label: '推演工作区',
      icon: FolderGit2,
      badge: '剧本',
      badgeColor: 'bg-indigo-600 text-white font-bold',
      desc: '全景剧本与推演中心',
    },
    {
      id: 'my_nation',
      label: '个人主页',
      icon: User,
      badge: myNation ? myNation.name : '领主',
      badgeColor: myNation ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700',
      desc: myNation ? '粉陆治理与战略公报' : '领主中心与开创粉陆',
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-200/90 h-screen sticky top-0 z-30 select-none overflow-y-auto">
      {/* Sidebar Trademark Header */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBrandClick}
          className="flex items-center gap-2.5 text-left w-full rounded-xl p-1 -m-1 cursor-default outline-hidden"
          title="T3.0测试版本"
        >
          <div className="w-11 h-11 flex items-center justify-center flex-shrink-0">
            <img
              src="/Tm.png"
              alt="商标"
              className="w-full h-full object-contain select-none"
              draggable={false}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-800 tracking-tight truncate">
                T3.0测试版本
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">NATIONAL TERMINAL</p>
          </div>
        </button>
      </div>

      {/* Core Navigation Items */}
      <div className="flex-1 py-3 px-2 space-y-1.5">
        <div className="px-2.5 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          核心系统导航
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition cursor-pointer font-medium ${
                isActive
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-600'
                  }`}
                />
                <div className="text-left min-w-0">
                  <div className="truncate text-xs font-bold leading-tight">{item.label}</div>
                  <div
                    className={`text-[10px] truncate leading-tight mt-0.5 ${
                      isActive ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {item.desc}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold truncate max-w-[65px] ${
                      item.badgeColor ||
                      (isActive ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-800')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.hotkey && (
                  <span
                    className={`text-[9px] font-mono px-1 py-0.5 rounded border ${
                      isActive
                        ? 'border-slate-700 text-slate-300 bg-slate-800'
                        : 'border-slate-200 text-slate-600 bg-slate-50'
                    }`}
                  >
                    {item.hotkey}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {isAdmin && (
          <div className="pt-3 mt-3 border-t border-slate-100 space-y-1">
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              最高权限
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition cursor-pointer font-medium ${
                activeTab === 'admin'
                  ? 'bg-rose-900 text-white font-bold shadow-xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <div className="text-left min-w-0">
                <div className="text-xs font-bold">统帅管理控制台</div>
                <div className="text-[10px] text-rose-400 truncate">数据审查与全局治理</div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-500 font-mono flex items-center justify-between">
        <span>战备态势：DEFCON 3</span>
        <span className="text-emerald-700 font-bold">● ONLINE</span>
      </div>
    </aside>
  );
};
