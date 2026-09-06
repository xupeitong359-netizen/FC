import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Eye,
  EyeOff,
  Upload,
  Check,
  X,
  Sparkles,
  Loader2,
  Code,
  ShieldCheck,
  KeyRound,
  User,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isDevTokenValid } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
  initialNickname?: string;
  onSuccess?: () => void;
}

// 预设高颜值创作者/领主头像，方便用户快速点选（满足「账户注册要提供头像」）
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'register',
  initialNickname = '',
  onSuccess,
}) => {
  const { login, register, quickGuestLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  
  // 表单字段：所属账户昵称（如抖音小玲钰）、密码、创作代码（注册时输入）
  const [nickname, setNickname] = useState(initialNickname);
  const [password, setPassword] = useState('');
  const [creationCode, setCreationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 头像选择/上传（注册必须提供头像）
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(PRESET_AVATARS[0]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('请选择图片格式文件');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('头像大小不能超过 4MB');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setTimeout(() => {
        setSelectedAvatarUrl(reader.result as string);
        setIsUploading(false);
        setError(null);
      }, 150);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const cleanNick = nickname.trim();
      if (!cleanNick || cleanNick.length < 2) {
        setError('请输入至少2个字符的账户昵称');
        setIsLoading(false);
        return;
      }
      if (!password || password.length < 4) {
        setError('密码至少需要4位字符');
        setIsLoading(false);
        return;
      }

      if (mode === 'login') {
        // 登录无需创作者ID
        await login(cleanNick, password);
      } else {
        // 注册：需提供所属账户昵称、密码、输入创作者ID（选填，输入后获得创作者身份，否则为普通用户）、头像
        if (!selectedAvatarUrl) {
          setError('请上传或选择您的账户头像');
          setIsLoading(false);
          return;
        }

        const cleanCreatorCode = creationCode.trim();
        const isDev = Boolean(cleanCreatorCode) || isDevTokenValid(cleanCreatorCode);
        const avatarData = {
          avatarUrl: selectedAvatarUrl,
        };

        await register(
          cleanNick,
          password,
          cleanNick,
          isDev,
          cleanCreatorCode || undefined,
          avatarData,
          cleanCreatorCode || undefined
        );
      }

      setIsSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (err: any) {
      setError(err.message || '操作失败，请检查输入');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestQuickEnter = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await quickGuestLogin();
      setIsSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (err: any) {
      setError(err.message || '访客进入失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none">
        {/* Backdrop */}
        <motion.div
          id="auth-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Window Container */}
        <motion.div
          id="auth-modal-container"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ type: 'spring', damping: 28, stiffness: 380, mass: 0.8 }}
          className="relative w-full max-w-[420px] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden text-slate-800"
        >
          {/* Top subtle decorative line */}
          <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700" />

          {/* Top Close Button (2字纯文本或简洁图标) */}
          <button
            id="auth-modal-close-btn"
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-5 sm:p-6">
            {/* Mode Switcher Tabs (2-character buttons: 登录 / 注册) */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-5">
              <button
                id="auth-tab-login"
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer text-center ${
                  mode === 'login'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                登录
              </button>
              <button
                id="auth-tab-register"
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer text-center ${
                  mode === 'register'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                注册
              </button>
            </div>

            {/* Error Notice */}
            {error && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* 1. 账户昵称 (如抖音小玲钰) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  所属账户昵称 <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="auth-input-nickname"
                    type="text"
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="如：抖音小玲钰 / 创联领主"
                    className="w-full h-10 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-hidden transition"
                  />
                </div>
              </div>

              {/* 2. 密码 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  账户密码 <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <KeyRound className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="auth-input-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入账户密码"
                    className="w-full h-10 pl-9 pr-9 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-hidden transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? '隐藏' : '显示'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* 3. 注册专属选填项：输入创作者ID（输入后可获得创作者身份，否则为普通用户） */}
              {mode === 'register' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      输入创作者ID <span className="text-[11px] font-normal text-slate-400">（选填）</span>
                    </label>
                    <span className="text-[10px] text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded">
                      输入后获得创作者身份
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <Code className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="auth-input-creation-code"
                      type="text"
                      value={creationCode}
                      onChange={(e) => setCreationCode(e.target.value)}
                      placeholder="如：CREATOR-888 或专属创作者ID（选填，未输入则为普通用户）"
                      className="w-full h-10 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-hidden transition font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    提示：输入有效创作者ID后将自动赋予创作者权限；未填写则默认注册为普通推演用户。
                  </p>
                </div>
              )}

              {/* 4. 注册专属：账户注册要提供头像 */}
              {mode === 'register' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>账户头像</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <button
                      id="auth-avatar-upload-trigger"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-0.5 bg-white hover:bg-slate-100 text-indigo-600 border border-indigo-200 rounded-md text-[11px] font-bold cursor-pointer transition shadow-2xs flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>上传</span>
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  {/* Preset Avatar Selection Grid */}
                  <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1">
                    {/* Currently selected / uploaded preview */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full border-2 border-indigo-600 p-0.5 overflow-hidden shadow-xs">
                        <img
                          src={selectedAvatarUrl}
                          alt="Avatar"
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[9px]">
                        ✓
                      </span>
                    </div>

                    <div className="h-6 w-px bg-slate-200 mx-1 shrink-0" />

                    {/* Presets */}
                    <div className="flex items-center gap-1.5">
                      {PRESET_AVATARS.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedAvatarUrl(url)}
                          className={`w-8 h-8 rounded-full border overflow-hidden transition cursor-pointer shrink-0 ${
                            selectedAvatarUrl === url
                              ? 'border-indigo-600 ring-2 ring-indigo-200'
                              : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={url} alt="Preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Main Submit Button (2-character pure text: 登录 / 注册) */}
              <button
                id="auth-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSuccess ? (
                  <span>成功</span>
                ) : (
                  <span>{mode === 'login' ? '登录' : '注册'}</span>
                )}
              </button>
            </form>

            {/* Quick Guest Enter (2-character button: 访客) */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">无需注册即可快速体验</span>
              <button
                id="auth-guest-btn"
                type="button"
                onClick={handleGuestQuickEnter}
                disabled={isLoading}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer text-xs"
              >
                访客
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
