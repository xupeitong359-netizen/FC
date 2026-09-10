import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  Check,
  X,
  Palette,
  Smile,
  Lock,
  Sparkles,
  QrCode,
  MapPin,
  Calendar,
  Users,
  MessageCircle,
  HelpCircle,
  FolderGit2,
  Copy,
  Globe,
} from 'lucide-react';
import { TikTokIcon } from './TikTokIcon';
import { User as UserType } from '../types';
import { LOCATION_DATA, parseLocation } from '../lib/locationData';

export interface DouyinProfileData {
  douyinName: string;
  bio: string;
  gender: string;
  birthday: string;
  location: string;
  serviceWidget: string;
  coverUrl: string;
  avatarUrl: string;
  avatarEmoji: string;
  avatarColor: string;
  creatorId: string;
  newPassword?: string;
}

interface DouyinEditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  creatorCode: string;
  onSave: (data: DouyinProfileData) => Promise<void>;
  showToast: (msg: string) => void;
}

// 精选封面壁纸预设（第一款为截图中的同款二次元樱粉日落氛围）
export const PRESET_COVERS = [
  {
    id: 'anime_sakura',
    name: '粉陆纪元 (原版氛围)',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
    color: '#f43f5e',
  },
  {
    id: 'starry_sky',
    name: '极夜星穹 (深空流光)',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80',
    color: '#6366f1',
  },
  {
    id: 'historic_map',
    name: '地缘帝国 (文明地图)',
    url: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&auto=format&fit=crop&q=80',
    color: '#d97706',
  },
  {
    id: 'oriental_ink',
    name: '青绿江山 (东方墨韵)',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    color: '#059669',
  },
  {
    id: 'cyber_gradient',
    name: '赛博霓虹 (潮玩极简)',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    color: '#8b5cf6',
  },
];

// 精选头像预设（第一款为截图中的同款黑白二次元头像）
export const PRESET_AVATARS = [
  {
    id: 'anime_bw',
    name: '二次元·联合黑白',
    url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'anime_color',
    name: '国风·奇幻立绘',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'cyber_avatar',
    name: '科幻·矩阵特工',
    url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&auto=format&fit=crop&q=80',
  },
];

// 创作者专属印记字符
const EMOJI_OPTIONS = [
  '领', '创', '史', '境', '策', '帅', '邦', '盟',
  '极', '枢', '恒', '衡', '星', '宸', '御', '烽',
];

// 创作者主题色
const THEME_COLORS = [
  '#6B50F0', '#4f46e5', '#7c3aed', '#ec4899', '#f43f5e',
  '#ea580c', '#d97706', '#059669', '#0284c7', '#334155',
];

export const DouyinEditProfileModal: React.FC<DouyinEditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  creatorCode,
  onSave,
  showToast,
}) => {
  // 当前正在编辑的字段抽屉：null | 'cover' | 'avatar' | 'name' | 'bio' | 'gender' | 'birthday' | 'location' | 'douyinId' | 'serviceWidget' | 'creatorCode' | 'password'
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  // 表单状态
  const [formDouyinName, setFormDouyinName] = useState(user.douyinName || user.username || '联合玲玉');
  const [formBio, setFormBio] = useState(
    user.bio || '创作者联盟成员\n玲玉：@玲玉\n生活号\n恋人：@龙神'
  );
  const [formGender, setFormGender] = useState(user.gender || '男');
  const [formBirthday, setFormBirthday] = useState(user.birthday || '2012-03-30');
  const [formLocation, setFormLocation] = useState(user.location || '朝鲜');

  // 国家、省份、城市联动状态
  const initialLoc = useMemo(() => parseLocation(user.location || '朝鲜'), [user.location]);
  const [selectedCountry, setSelectedCountry] = useState(initialLoc.country);
  const [selectedProvince, setSelectedProvince] = useState(initialLoc.province);
  const [selectedCity, setSelectedCity] = useState(initialLoc.city);

  const currentCountryObj = useMemo(() => {
    return LOCATION_DATA.find((c) => c.name === selectedCountry) || LOCATION_DATA[0];
  }, [selectedCountry]);

  const currentProvinceObj = useMemo(() => {
    return (
      currentCountryObj?.provinces.find((p) => p.name === selectedProvince) ||
      currentCountryObj?.provinces[0]
    );
  }, [currentCountryObj, selectedProvince]);

  const handleCountryChange = (cName: string) => {
    setSelectedCountry(cName);
    const countryObj = LOCATION_DATA.find((c) => c.name === cName);
    const firstProv = countryObj?.provinces[0];
    const newProv = firstProv?.name || '';
    const newCity = firstProv?.cities[0] || '';
    setSelectedProvince(newProv);
    setSelectedCity(newCity);

    if (newCity && newProv) {
      setFormLocation(`${cName} · ${newProv} · ${newCity}`);
    } else if (newProv) {
      setFormLocation(`${cName} · ${newProv}`);
    } else {
      setFormLocation(cName);
    }
  };

  const handleProvinceChange = (pName: string) => {
    setSelectedProvince(pName);
    const provObj = currentCountryObj?.provinces.find((p) => p.name === pName);
    const newCity = provObj?.cities[0] || '';
    setSelectedCity(newCity);

    if (newCity) {
      setFormLocation(`${selectedCountry} · ${pName} · ${newCity}`);
    } else {
      setFormLocation(`${selectedCountry} · ${pName}`);
    }
  };

  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    if (cityName) {
      setFormLocation(`${selectedCountry} · ${selectedProvince} · ${cityName}`);
    } else {
      setFormLocation(`${selectedCountry} · ${selectedProvince}`);
    }
  };
  const [formDouyinId, setFormDouyinId] = useState(user.douyinName || '77876871989');
  const [formServiceWidget, setFormServiceWidget] = useState(user.serviceWidget || '群聊');
  const [formCoverUrl, setFormCoverUrl] = useState(user.coverUrl || PRESET_COVERS[0].url);
  const [formAvatarUrl, setFormAvatarUrl] = useState(user.avatarUrl || PRESET_AVATARS[0].url);
  const [formAvatarEmoji, setFormAvatarEmoji] = useState(user.avatarEmoji || '');
  const [formAvatarColor, setFormAvatarColor] = useState(user.avatarColor || '#6B50F0');
  const [formCreatorId, setFormCreatorId] = useState(user.creatorId || creatorCode);
  const [formNewPassword, setFormNewPassword] = useState('');
  const [customCoverInput, setCustomCoverInput] = useState('');
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 计算资料完成度 (百分比)
  const completenessPercent = useMemo(() => {
    const fields = [
      formDouyinName,
      formBio,
      formGender,
      formBirthday,
      formLocation,
      formDouyinId,
      formCoverUrl,
      formAvatarUrl || formAvatarEmoji,
    ];
    const filled = fields.filter((f) => Boolean(f && String(f).trim().length > 0)).length;
    return Math.min(100, Math.round((filled / fields.length) * 100));
  }, [
    formDouyinName,
    formBio,
    formGender,
    formBirthday,
    formLocation,
    formDouyinId,
    formCoverUrl,
    formAvatarUrl,
    formAvatarEmoji,
  ]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        douyinName: formDouyinId.trim() || formDouyinName.trim(),
        bio: formBio.trim(),
        gender: formGender,
        birthday: formBirthday,
        location: formLocation.trim(),
        serviceWidget: formServiceWidget.trim(),
        coverUrl: formCoverUrl.trim(),
        avatarUrl: formAvatarUrl.trim(),
        avatarEmoji: formAvatarEmoji,
        avatarColor: formAvatarColor,
        creatorId: formCreatorId.trim(),
        newPassword: formNewPassword.trim() || undefined,
      });
      showToast('资料已成功保存并同步！');
      onClose();
    } catch (err: any) {
      showToast(err.message || '保存资料失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 animate-fadeIn">
      {/* Container simulating high-end Douyin mobile view */}
      <div className="relative w-full max-w-lg h-full sm:h-[92vh] sm:max-h-[860px] sm:rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* TOP COVER BANNER (头部封面与居中高亮头像) */}
        <div className="relative w-full bg-slate-800 select-none">
          {/* Cover Background Image with subtle overlay */}
          <div className="relative w-full h-44 sm:h-48 overflow-hidden">
            <img
              src={formCoverUrl}
              alt="封面图"
              className="w-full h-full object-cover transition-all duration-300 filter brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50" />

            {/* Top Bar: Back Button & Change Cover Button */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer"
                title="返回主页"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveSheet('cover')}
                className="px-3 py-1 rounded-full bg-black/40 hover:bg-black/60 text-white text-xs font-medium backdrop-blur-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>更换封面</span>
              </button>
            </div>
          </div>

          {/* AVATAR AT CENTER - 扩大占比并置于封面边缘居中，完全不被遮挡 */}
          <div className="relative -mt-12 sm:-mt-14 flex justify-center z-20">
            <div
              onClick={() => setActiveSheet('avatar')}
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white bg-slate-200 shadow-xl overflow-hidden cursor-pointer group select-none ring-1 ring-black/5"
              style={{ backgroundColor: formAvatarColor }}
            >
              {formAvatarUrl ? (
                <img src={formAvatarUrl} alt="头像" className="w-full h-full object-cover" />
              ) : formAvatarEmoji ? (
                <div className="w-full h-full flex items-center justify-center text-4xl sm:text-5xl">
                  {formAvatarEmoji}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-3xl sm:text-4xl">
                  {formDouyinName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Camera Hover / Touch Overlay */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/55 flex flex-col items-center justify-center text-white transition-opacity">
                <Camera className="w-5 h-5 mb-1 text-white drop-shadow-xs" />
                <span className="text-[11px] font-semibold leading-none drop-shadow-xs">更换头像</span>
              </div>
            </div>
          </div>
        </div>

        {/* PROFILE COMPLETION BADGE (图1: 资料完成度 100%) */}
        <div className="pt-3 pb-3 text-center border-b border-slate-100 flex items-center justify-center gap-1 text-xs text-slate-700 font-medium">
          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
          <span>资料完成度 {completenessPercent}%</span>
        </div>

        {/* GROUPED LIST ITEMS (图1标准列表配置) */}
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 text-sm">
          {/* 1. 名字 */}
          <button
            type="button"
            onClick={() => setActiveSheet('name')}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer"
          >
            <span className="text-slate-900 font-medium w-24 shrink-0">名字</span>
            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
              <span className="text-slate-800 font-medium truncate">{formDouyinName}</span>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          </button>

          {/* 2. 简介 */}
          <button
            type="button"
            onClick={() => setActiveSheet('bio')}
            className="w-full px-5 py-3.5 flex items-start justify-between text-left hover:bg-slate-50 transition cursor-pointer"
          >
            <span className="text-slate-900 font-medium w-24 shrink-0 pt-0.5">简介</span>
            <div className="flex items-start gap-2 min-w-0 flex-1 justify-end">
              <span className="text-slate-600 text-xs line-clamp-2 text-right whitespace-pre-line leading-relaxed">
                {formBio || '暂未填写个人简介'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            </div>
          </button>

          {/* 3. 性别 */}
          <button
            type="button"
            onClick={() => setActiveSheet('gender')}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer"
          >
            <span className="text-slate-900 font-medium w-24 shrink-0">性别</span>
            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
              <span className="text-slate-800 font-medium">{formGender}</span>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          </button>

          {/* 4. 生日 */}
          <button
            type="button"
            onClick={() => setActiveSheet('birthday')}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer"
          >
            <span className="text-slate-900 font-medium w-24 shrink-0">生日</span>
            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
              <span className="text-slate-800 font-mono">{formBirthday}</span>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          </button>

          {/* 5. 所在地 */}
          <button
            type="button"
            onClick={() => setActiveSheet('location')}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer"
          >
            <span className="text-slate-900 font-medium w-24 shrink-0">所在地</span>
            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
              <span className="text-slate-800 font-medium truncate max-w-[220px]">{formLocation}</span>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          </button>

          {/* 6. 抖音号 */}
          <button
            type="button"
            onClick={() => setActiveSheet('douyinId')}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer"
          >
            <span className="text-slate-900 font-medium w-24 shrink-0">抖音号</span>
            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
              <span className="text-slate-800 font-mono">{formDouyinId}</span>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          </button>

          {/* 7. 专属创作代码（只读项） */}
          <div className="w-full px-5 py-3.5 flex items-center justify-between text-left select-none bg-slate-50/40">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-900 font-medium">创作代码</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-500 font-medium tracking-wide">
                只读
              </span>
            </div>
            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
              <span className="text-slate-700 font-mono text-xs select-all">
                {formCreatorId || creatorCode}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(formCreatorId || creatorCode);
                  showToast('创作代码已复制到剪贴板');
                }}
                className="p-1 hover:bg-slate-200/80 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer"
                title="复制创作代码"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 9. 修改密码 */}
          <button
            type="button"
            onClick={() => setActiveSheet('password')}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer"
          >
            <span className="text-slate-900 font-medium w-24 shrink-0">登录密码</span>
            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
              <span className="text-slate-400 text-xs">
                {formNewPassword ? '已设置新密码' : '点击修改'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          </button>
        </div>

        {/* BOTTOM SAVE BAR */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-white transition cursor-pointer"
          >
            返回主页
          </button>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-lg bg-[#6B50F0] hover:bg-[#5B3FE0] text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? '保存中...' : '保存更改'}
          </button>
        </div>

        {/* SUB-EDITORS SHEETS / MODALS (针对具体点击项弹出的小抽屉) */}
        <AnimatePresence>
          {activeSheet && (
            <div
              onClick={() => setActiveSheet(null)}
              className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end"
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="w-full bg-white rounded-t-2xl p-5 shadow-2xl min-h-[62%] sm:min-h-[480px] max-h-[88%] flex flex-col justify-between space-y-4"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    {activeSheet === 'cover' && '更换主页封面壁纸'}
                    {activeSheet === 'avatar' && '更换头像'}
                    {activeSheet === 'name' && '修改名字'}
                    {activeSheet === 'bio' && '编辑个人简介'}
                    {activeSheet === 'gender' && '选择性别'}
                    {activeSheet === 'birthday' && '修改生日'}
                    {activeSheet === 'location' && '修改所在地'}
                    {activeSheet === 'douyinId' && '修改抖音号'}
                    {activeSheet === 'password' && '修改登录密码'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sub-Editor Content Body */}
                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-0.5">
                  {/* Content: COVER PICKER */}
                {activeSheet === 'cover' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2.5">
                      {PRESET_COVERS.map((cov) => (
                        <div
                          key={cov.id}
                          onClick={() => {
                            setFormCoverUrl(cov.url);
                            showToast(`已选择：${cov.name}`);
                          }}
                          className={`relative h-24 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                            formCoverUrl === cov.url
                              ? 'border-[#6B50F0] ring-2 ring-[#6B50F0]/30 scale-[1.02]'
                              : 'border-transparent hover:border-slate-300'
                          }`}
                        >
                          <img src={cov.url} alt={cov.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[11px] text-white font-medium truncate">
                            {cov.name}
                          </div>
                          {formCoverUrl === cov.url && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#6B50F0] text-white flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <label className="text-xs font-semibold text-slate-700">自定义封面图片 URL</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={customCoverInput}
                          onChange={(e) => setCustomCoverInput(e.target.value)}
                          placeholder="https://...图片链接"
                          className="flex-1 h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:border-[#6B50F0] focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customCoverInput.trim()) {
                              setFormCoverUrl(customCoverInput.trim());
                              setCustomCoverInput('');
                              showToast('自定义封面已更新');
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition cursor-pointer"
                        >
                          应用
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content: AVATAR PICKER */}
                {activeSheet === 'avatar' && (
                  <div className="space-y-4">
                    {/* Presets */}
                    <div className="flex items-center gap-3">
                      {PRESET_AVATARS.map((av) => (
                        <div
                          key={av.id}
                          onClick={() => {
                            setFormAvatarUrl(av.url);
                            setFormAvatarEmoji('');
                            showToast(`已选择：${av.name}`);
                          }}
                          className={`relative w-16 h-16 rounded-full overflow-hidden cursor-pointer border-2 transition-all ${
                            formAvatarUrl === av.url
                              ? 'border-[#6B50F0] ring-2 ring-[#6B50F0]/30 scale-105'
                              : 'border-transparent hover:border-slate-300'
                          }`}
                        >
                          <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>

                    {/* Emoji Matrix */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <label className="text-xs font-semibold text-slate-700">精选印记</label>
                      <div className="grid grid-cols-8 gap-1 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                        {EMOJI_OPTIONS.map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => {
                              setFormAvatarEmoji(em);
                              setFormAvatarUrl('');
                            }}
                            className={`h-8 rounded-md flex items-center justify-center text-lg transition cursor-pointer ${
                              formAvatarEmoji === em && !formAvatarUrl
                                ? 'bg-white shadow-xs ring-2 ring-[#6B50F0]'
                                : 'hover:bg-slate-200/70'
                            }`}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Colors */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">背景底色</label>
                      <div className="grid grid-cols-5 gap-2">
                        {THEME_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setFormAvatarColor(c)}
                            className={`h-7 rounded-md transition cursor-pointer ${
                              formAvatarColor === c ? 'ring-2 ring-slate-900 ring-offset-1 scale-105' : ''
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Custom URL */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <label className="text-xs font-semibold text-slate-700">网络头像 URL</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={customAvatarInput}
                          onChange={(e) => setCustomAvatarInput(e.target.value)}
                          placeholder="https://...头像图片链接"
                          className="flex-1 h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:border-[#6B50F0] focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customAvatarInput.trim()) {
                              setFormAvatarUrl(customAvatarInput.trim());
                              setFormAvatarEmoji('');
                              setCustomAvatarInput('');
                              showToast('头像链接已更新');
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition cursor-pointer"
                        >
                          应用
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content: NAME */}
                {activeSheet === 'name' && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formDouyinName}
                      onChange={(e) => setFormDouyinName(e.target.value)}
                      placeholder="输入名字"
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-[#6B50F0] focus:outline-hidden"
                    />
                  </div>
                )}

                {/* Content: BIO */}
                {activeSheet === 'bio' && (
                  <div className="flex-1 flex flex-col space-y-3">
                    <textarea
                      rows={6}
                      value={formBio}
                      onChange={(e) => setFormBio(e.target.value)}
                      placeholder="填写个人简介..."
                      className="w-full flex-1 min-h-[180px] p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-[#6B50F0] focus:outline-hidden resize-none leading-relaxed"
                    />
                  </div>
                )}

                {/* Content: GENDER */}
                {activeSheet === 'gender' && (
                  <div className="space-y-2">
                    {['男', '女', '保密'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          setFormGender(g);
                          setActiveSheet(null);
                        }}
                        className={`w-full p-3 rounded-lg border text-sm font-medium flex items-center justify-between cursor-pointer transition ${
                          formGender === g
                            ? 'border-[#6B50F0] bg-[#6B50F0]/5 text-[#6B50F0]'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>{g}</span>
                        {formGender === g && <Check className="w-4 h-4 text-[#6B50F0]" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* Content: BIRTHDAY */}
                {activeSheet === 'birthday' && (
                  <div className="space-y-3">
                    <input
                      type="date"
                      value={formBirthday}
                      onChange={(e) => setFormBirthday(e.target.value)}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-[#6B50F0] focus:outline-hidden font-mono"
                    />
                  </div>
                )}

                {/* Content: LOCATION (国家 / 省份 / 城市 三级联动选择) */}
                {activeSheet === 'location' && (
                  <div className="space-y-3">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B50F0]" />
                      <input
                        type="text"
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                        placeholder="输入或选择所在地"
                        className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-[#6B50F0] focus:outline-hidden font-medium"
                      />
                    </div>

                    {/* 三级级联选择器（国家、省份、城市） */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={selectedCountry}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:border-[#6B50F0] focus:outline-hidden cursor-pointer"
                      >
                        {LOCATION_DATA.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={selectedProvince}
                        onChange={(e) => handleProvinceChange(e.target.value)}
                        className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:border-[#6B50F0] focus:outline-hidden cursor-pointer"
                      >
                        {currentCountryObj?.provinces.map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={selectedCity}
                        onChange={(e) => handleCityChange(e.target.value)}
                        className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:border-[#6B50F0] focus:outline-hidden cursor-pointer"
                      >
                        {currentProvinceObj?.cities.map((ct) => (
                          <option key={ct} value={ct}>
                            {ct}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Content: DOUYIN ID */}
                {activeSheet === 'douyinId' && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formDouyinId}
                      onChange={(e) => setFormDouyinId(e.target.value)}
                      placeholder="输入抖音账号"
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-[#6B50F0] focus:outline-hidden font-mono"
                    />
                  </div>
                )}

                {/* Content: PASSWORD */}
                {activeSheet === 'password' && (
                  <div className="space-y-3">
                    <input
                      type="password"
                      value={formNewPassword}
                      onChange={(e) => setFormNewPassword(e.target.value)}
                      placeholder="新密码（留空则不修改）"
                      minLength={4}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-[#6B50F0] focus:outline-hidden"
                    />
                  </div>
                )}
                </div>

                {/* Drawer Footer Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="px-5 py-2 bg-[#6B50F0] hover:bg-[#5B3FE0] text-white text-xs font-semibold rounded-lg shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    确定
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
