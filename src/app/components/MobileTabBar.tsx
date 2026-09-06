import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileTabBarProps {
  activeTab: 'lobby' | 'my_nation' | 'world_map' | 'admin' | 'national_focus' | 'workspace' | string;
  setActiveTab: (tab: any) => void;
  onOpenCreateNation?: () => void;
  onOpenWorkspace?: () => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenWorkspace,
}) => {
  const { user } = useAuth();
  const [unreadMessagesCount] = useState(1);

  // 判定是否具备创作者特权
  const isCreator = Boolean(
    user?.isCreator ||
    user?.isLingyuBaby ||
    user?.role === 'admin' ||
    user?.creatorId ||
    localStorage.getItem('creator_profile_auth')
  );

  const handleCreateClick = () => {
    // 非创作者不可点击进入新建工作区
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

    // 创作者进入新建工作区页面
    if (onOpenWorkspace) {
      onOpenWorkspace();
    } else {
      setActiveTab('workspace');
    }

    // 触发打开分步构筑新建工作区向导
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-workspace-wizard'));
    }, 80);
  };

  return (
    <nav
      aria-label="主导航栏"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] select-none"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)',
      }}
    >
      <div className="grid grid-cols-5 items-center w-full max-w-md mx-auto px-2 pt-1 pb-1">
        {/* Tab 1: 首页 (取消图案，仅保留文字) */}
        <button
          id="mobile-tab-lobby"
          type="button"
          onClick={() => setActiveTab('lobby')}
          className={`flex items-center justify-center py-3 cursor-pointer active:scale-95 transition-colors text-[14px] ${
            activeTab === 'lobby'
              ? 'font-bold text-[#6B50F0]'
              : 'font-medium text-slate-600 hover:text-slate-900'
          }`}
        >
          首页
        </button>

        {/* Tab 2: 沙盘 (取消图案，仅保留文字) */}
        <button
          id="mobile-tab-sandboxes"
          type="button"
          onClick={() => setActiveTab('world_map')}
          className={`flex items-center justify-center py-3 cursor-pointer active:scale-95 transition-colors text-[14px] ${
            activeTab === 'world_map'
              ? 'font-bold text-[#6B50F0]'
              : 'font-medium text-slate-600 hover:text-slate-900'
          }`}
        >
          沙盘
        </button>

        {/* Tab 3: 创作 (除此底栏创作按钮外其它按钮均取消图案，且创作按钮不要文字) */}
        <div className="flex items-center justify-center py-1">
          <button
            id="mobile-tab-create"
            type="button"
            onClick={handleCreateClick}
            className={`w-11 h-8 rounded-xl text-white flex items-center justify-center shadow-xs transition ${
              isCreator
                ? 'bg-[#6B50F0] hover:bg-[#5b40e0] active:scale-90 cursor-pointer'
                : 'bg-slate-300 hover:bg-slate-400 text-white active:scale-95 cursor-not-allowed opacity-75'
            }`}
            title={isCreator ? '点击进入新建工作区页面' : '非创作者不可点击'}
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 4: 消息 (取消图案，仅保留文字) */}
        <button
          id="mobile-tab-messages"
          type="button"
          onClick={() => setActiveTab('messages')}
          className={`flex items-center justify-center py-3 cursor-pointer active:scale-95 transition-colors text-[14px] relative ${
            activeTab === 'messages'
              ? 'font-bold text-[#6B50F0]'
              : 'font-medium text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>消息</span>
          {unreadMessagesCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {unreadMessagesCount}
            </span>
          )}
        </button>

        {/* Tab 5: 我的 (取消图案，仅保留文字) */}
        <button
          id="mobile-tab-profile"
          type="button"
          onClick={() => setActiveTab('my_nation')}
          className={`flex items-center justify-center py-3 cursor-pointer active:scale-95 transition-colors text-[14px] ${
            activeTab === 'my_nation'
              ? 'font-bold text-[#6B50F0]'
              : 'font-medium text-slate-600 hover:text-slate-900'
          }`}
        >
          我的
        </button>
      </div>
    </nav>
  );
};


