import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import mapGeoData from '../assets/hoi4_fixed_map.json';
import {
  X,
  Crown,
  Compass,
  MapPin,
  Coins,
  Languages,
  Landmark,
  Scale,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  Palette,
  Search,
  Star,
  Shield,
  Pickaxe,
  Swords,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Globe2,
  Dices,
  Flame,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RegimeType, IdeologyType, ProvinceData } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { renderEmblemIcon } from '../lib/icons';
import { getProvinceChineseName } from '../lib/provinceTranslations';

interface CreateNationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onEnterMapMode?: () => void;
  onMapModeChange?: (isSelecting: boolean) => void;
}

const partyToRegime: Record<'communist' | 'fascist' | 'democratic' | 'neutral', RegimeType> = {
  communist: '苏维埃代表制',
  fascist: '军政府/军国主义',
  democratic: '民主议会制',
  neutral: '君主立宪制',
};

const partyToIdeology: Record<'communist' | 'fascist' | 'democratic' | 'neutral', IdeologyType> = {
  communist: '共产主义',
  fascist: '法西斯主义',
  democratic: '民主主义',
  neutral: '中立主义',
};

const FLAG_COLORS = [
  { name: '皇家紫', value: '#6366f1' },
  { name: '帝国红', value: '#dc2626' },
  { name: '翡翠绿', value: '#059669' },
  { name: '王权金', value: '#d97706' },
  { name: '海军蓝', value: '#2563eb' },
  { name: '夜幕青', value: '#0891b2' },
  { name: '黑曜石', value: '#334155' },
  { name: '蔷薇粉', value: '#db2777' },
];

const EMBLEM_OPTIONS = [
  { id: 'Crown', name: '王冠', icon: Crown },
  { id: 'Shield', name: '盾徽', icon: Shield },
  { id: 'Compass', name: '罗盘', icon: Compass },
  { id: 'Star', name: '星徽', icon: Star },
  { id: 'Swords', name: '双刃', icon: Swords },
  { id: 'Landmark', name: '神殿', icon: Landmark },
  { id: 'Scale', name: '正义', icon: Scale },
  { id: 'Flame', name: '圣火', icon: Flame },
  { id: 'Globe2', name: '全球', icon: Globe2 },
  { id: 'Pickaxe', name: '筑建', icon: Pickaxe },
];

// Predefined geographic regions for quick selection
const REGION_PRESETS: { name: string; keyKeywords: string[] }[] = [
  { name: '东亚', keyKeywords: ['北京', '河北', '山东', '江苏', '浙江', '广东', '四川', '上海', '陕西', '湖北'] },
  { name: '西欧', keyKeywords: ['伦敦', '巴黎', '莱茵兰', '巴伐利亚', '马德里', '罗马', '阿姆斯特丹', '布鲁塞尔'] },
  { name: '北美', keyKeywords: ['纽约', '加利福尼亚', '得克萨斯', '伊利诺伊', '华盛顿', '佛罗里达', '安大略'] },
  { name: '中东', keyKeywords: ['伊斯坦布尔', '君士坦丁堡', '大马士革', '开罗', '巴格达', '德黑兰', '耶路撒冷', '安卡拉'] },
  { name: '东欧', keyKeywords: ['莫斯科', '列宁格勒', '基辅', '明斯克', '华沙', '斯摩棱斯克', '布加勒斯特'] },
  { name: '东南亚', keyKeywords: ['曼谷', '暹罗', '新加坡', '爪哇', '吕宋', '河内', '仰光', '西贡'] },
  { name: '地中海', keyKeywords: ['雅典', '那不勒斯', '西西里', '巴塞罗那', '突尼斯', '阿尔及尔'] },
  { name: '南美', keyKeywords: ['里约热内卢', '圣保罗', '布宜诺斯艾利斯', '波哥大', '利马', '圣地亚哥'] },
  { name: '非洲', keyKeywords: ['约翰内斯堡', '开普敦', '亚的斯亚贝巴', '拉各斯', '内罗毕', '卡萨布兰卡'] },
];

const RANDOM_NAMES = [
  '大玲玉帝国', '东方神州联邦', '北境钢铁阵线', '九渊联合公国', '天星自由联邦',
  '翡翠海岛合众国', '极昼联合帝国', '圣罗兰第三共和国', '大漠金帐汗国', '苍穹开拓同盟',
  '维多利亚自由邦', '南十字星同盟', '阿尔卑斯联邦', '瀚海自治共和国', '赤道自由公国'
];

export const CreateNationModal: React.FC<CreateNationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onEnterMapMode,
  onMapModeChange,
}) => {
  const { user, setMyNation } = useAuth();

  // Wizard Step: 1 = Identity & Banner, 2 = Territory & Capital, 3 = Governance, 4 = Proclamation
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [name, setName] = useState('');
  const [capital, setCapital] = useState('');
  const [territory, setTerritory] = useState('');
  const [selectedRulingParty, setSelectedRulingParty] = useState<'communist' | 'fascist' | 'democratic' | 'neutral'>('neutral');
  const [communistPartyName, setCommunistPartyName] = useState('人民劳动共产党');
  const [fascistPartyName, setFascistPartyName] = useState('国家复兴法西斯党');
  const [democraticPartyName, setDemocraticPartyName] = useState('自由民主进步同盟');
  const [neutralPartyName, setNeutralPartyName] = useState('国家中立秩序阵线');
  const [language, setLanguage] = useState('汉语');
  const [currencyMode, setCurrencyMode] = useState<'lingyu' | 'custom'>('lingyu');
  const [customCurrencyName, setCustomCurrencyName] = useState('');
  const [currencyRate, setCurrencyRate] = useState<number>(1);
  const [flagColor, setFlagColor] = useState('#6366f1');
  const [emblemIcon, setEmblemIcon] = useState('Crown');
  const [lng, setLng] = useState('28.97');
  const [lat, setLat] = useState('41.00');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [provinces, setProvinces] = useState<ProvinceData[]>([]);
  const [availableProvinces, setAvailableProvinces] = useState<any[]>([]);
  const [provinceSearch, setProvinceSearch] = useState('');

  const [isSelectingOnMap, setIsSelectingOnMap] = useState(false);
  const [mapSelectSubMode, setMapSelectSubMode] = useState<'territory' | 'capital'>('territory');

  const maxAllowedProvinces = user?.isLingyuBaby ? 12 : 10;

  useEffect(() => {
    onMapModeChange?.(isSelectingOnMap);
  }, [isSelectingOnMap, onMapModeChange]);

  // Sync map preview
  useEffect(() => {
    if (isSelectingOnMap) {
      window.dispatchEvent(
        new CustomEvent('map-preview', {
          detail: { provinces, flagColor, mode: mapSelectSubMode, capital },
        })
      );
    } else {
      window.dispatchEvent(new CustomEvent('map-preview', { detail: null }));
    }
  }, [isSelectingOnMap, provinces, flagColor, mapSelectSubMode, capital]);

  // Load provinces from geo json
  useEffect(() => {
    if (isOpen && (mapGeoData as any)?.features) {
      setAvailableProvinces(
        (mapGeoData as any).features.map((f: any) => {
          const rawName = f.properties?.name || '';
          const stateId = f.properties?.stateId;
          const cnName = getProvinceChineseName(rawName) || getProvinceChineseName(stateId) || rawName || '未知省份';
          return {
            id: stateId || Math.random().toString(),
            name: cnName,
          };
        })
      );
    }
  }, [isOpen]);

  // Map province click listener: Free selection (no adjacency limit)
  useEffect(() => {
    const handleMapSelect = (e: any) => {
      if (!isSelectingOnMap) return;
      const { id, name: pName } = e.detail;

      if (mapSelectSubMode === 'territory') {
        setProvinces((prev) => {
          const exists = prev.some((p) => String(p.id) === String(id) || (p.name && p.name === pName));
          if (exists) {
            const next = prev.filter((p) => String(p.id) !== String(id) && p.name !== pName);
            if (capital === pName) {
              setCapital(next.length > 0 ? next[0].name : '');
            }
            setError(null);
            return next;
          }

          if (prev.length >= maxAllowedProvinces) {
            setError(`初始领土最多只能选择 ${maxAllowedProvinces} 个省份`);
            return prev;
          }

          setError(null);
          const next = [...prev, { id, name: pName, isCore: true, civilianFactories: 1, militaryFactories: 1 }];
          if (!capital) {
            setCapital(pName);
          }
          return next;
        });
      } else if (mapSelectSubMode === 'capital') {
        setCapital(pName);
        setProvinces((prev) => {
          if (!prev.some((p) => String(p.id) === String(id) || (p.name && p.name === pName))) {
            if (prev.length < maxAllowedProvinces) {
              return [...prev, { id, name: pName, isCore: true, civilianFactories: 1, militaryFactories: 1 }];
            }
          }
          return prev;
        });
        setIsSelectingOnMap(false);
      }
    };
    window.addEventListener('map-province-click', handleMapSelect);
    return () => window.removeEventListener('map-province-click', handleMapSelect);
  }, [isSelectingOnMap, mapSelectSubMode, capital, maxAllowedProvinces]);

  if (!isOpen) return null;

  // Region Batch Selection
  const handleSelectRegion = (regionKeywords: string[]) => {
    const matched: any[] = [];
    for (const kw of regionKeywords) {
      const found = availableProvinces.find((p) => p.name.includes(kw) || kw.includes(p.name));
      if (found && !matched.some((m) => m.id === found.id)) {
        matched.push({
          id: found.id,
          name: found.name,
          isCore: true,
          civilianFactories: 1,
          militaryFactories: 1,
        });
      }
      if (matched.length >= maxAllowedProvinces) break;
    }

    if (matched.length > 0) {
      setProvinces(matched);
      if (!capital || !matched.some((m) => m.name === capital)) {
        setCapital(matched[0].name);
      }
      setError(null);
    }
  };

  // Instant Template Archetypes
  const handleApplyTemplate = (tpl: {
    name: string;
    flagColor: string;
    emblem: string;
    regime: RegimeType;
    ideology: IdeologyType;
    party: 'communist' | 'fascist' | 'democratic' | 'neutral';
    language: string;
    currencyMode: 'lingyu' | 'custom';
    customCurrencyName: string;
    currencyRate: number;
    capitalKeyword: string;
    regionKeywords: string[];
  }) => {
    setName(tpl.name);
    setFlagColor(tpl.flagColor);
    setEmblemIcon(tpl.emblem);
    setSelectedRulingParty(tpl.party);
    setLanguage(tpl.language);
    setCurrencyMode(tpl.currencyMode);
    setCustomCurrencyName(tpl.customCurrencyName);
    setCurrencyRate(tpl.currencyRate);
    handleSelectRegion(tpl.regionKeywords);
    if (tpl.capitalKeyword) {
      const foundCap = availableProvinces.find(
        (p) => p.name.includes(tpl.capitalKeyword) || tpl.capitalKeyword.includes(p.name)
      );
      if (foundCap) setCapital(foundCap.name);
    }
    setError(null);
  };

  // Random Name Generator
  const handleRandomizeName = () => {
    const filtered = RANDOM_NAMES.filter((n) => n !== name);
    const chosen = filtered[Math.floor(Math.random() * filtered.length)];
    setName(chosen);
  };

  // Validation before advancing steps
  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      if (!name.trim()) {
        setError('请先为您的粉陆确定名称');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (provinces.length === 0) {
        setError('请至少选择一个省份作为初始领土');
        return;
      }
      if (!capital.trim()) {
        setError('请选定或指定粉陆法定都城');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  // Final Proclamation Submit
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!name.trim()) throw new Error('请填写粉陆名称');
      if (provinces.length === 0) throw new Error('请至少选择一个省份作为初始领土');
      if (!capital.trim()) throw new Error('请确立粉陆都城（首府）');
      if (provinces.length > maxAllowedProvinces) {
        throw new Error(`最多只能选择 ${maxAllowedProvinces} 个省份作为初始领土`);
      }

      const parsedLng = parseFloat(lng) || 0;
      const parsedLat = parseFloat(lat) || 0;

      const finalCurrency = currencyMode === 'lingyu' ? '玲玉币' : (customCurrencyName.trim() || '主权货币');
      const finalCurrencyRate = currencyMode === 'lingyu' ? 1 : (Number(currencyRate) > 0 ? Number(currencyRate) : 1);

      const res = await api.nations.create({
        name: name.trim(),
        capital: capital.trim(),
        territory: territory.trim() || `领土由 ${provinces.map((p) => p.name).join('、')} 构成`,
        provinces,
        description: '粉陆宣告正式开创立宪，万民归附，疆域奠定。',
        regime: partyToRegime[selectedRulingParty] || '君主立宪制',
        ideology: partyToIdeology[selectedRulingParty] || '中立主义',
        rulingPartyId: selectedRulingParty,
        partyNames: {
          communist: communistPartyName.trim() || '人民劳动共产党',
          fascist: fascistPartyName.trim() || '国家复兴法西斯党',
          democratic: democraticPartyName.trim() || '自由民主进步同盟',
          neutral: neutralPartyName.trim() || '国家中立秩序阵线',
        },
        language: language.trim() || '汉语',
        currency: finalCurrency,
        currencyRate: finalCurrencyRate,
        flagColor,
        emblemIcon,
        mapCoordinates: [parsedLng, parsedLat],
      });

      setMyNation(res.nation);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.55 },
        });
        setTimeout(() => {
          confetti({
            particleCount: 60,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
          });
          confetti({
            particleCount: 60,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
          });
        }, 250);
      } catch {
        // ignore
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || '开创粉陆失败');
    } finally {
      setIsLoading(false);
    }
  };

  // Fullscreen Tactical Map Selector HUD
  if (isSelectingOnMap) {
    return (
      <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between animate-fadeIn select-none">
        {/* Top Header Bar */}
        <div className="pointer-events-auto w-full bg-slate-950/90 text-slate-100 backdrop-blur-xl border-b border-white/10 shadow-xl px-3 sm:px-6 py-2 flex items-center justify-between gap-2">
          <button
            id="map-mode-back-btn"
            type="button"
            onClick={() => setIsSelectingOnMap(false)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回设置</span>
          </button>

          <div className="flex-1 min-w-0 px-2 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: flagColor }}
              />
              <span className="text-xs sm:text-sm font-bold text-white">
                {mapSelectSubMode === 'territory' ? '自由圈选领土（无相邻限制）' : '点选国家首都'}
              </span>
              {mapSelectSubMode === 'territory' && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-white/20">
                  {provinces.length}/{maxAllowedProvinces}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {mapSelectSubMode === 'territory'
                ? '点击地图任意地块圈选初始领土'
                : `已选首都: ${capital || '点击地图省份确立首府'}`}
            </span>
          </div>

          <button
            id="map-mode-confirm-top-btn"
            type="button"
            onClick={() => setIsSelectingOnMap(false)}
            className="px-4 py-1.5 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1 cursor-pointer"
            style={{ backgroundColor: flagColor }}
          >
            <Check className="w-3.5 h-3.5" />
            <span>完成圈选</span>
          </button>
        </div>

        {/* Bottom Drawer Bar */}
        <div className="pointer-events-auto w-full bg-slate-950/95 text-white backdrop-blur-2xl border-t border-white/10 shadow-2xl p-3 sm:px-6">
          <div className="max-w-6xl mx-auto flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">
                  已选省份 ({provinces.length}/{maxAllowedProvinces})
                </span>
                {provinces.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setProvinces([])}
                    className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                  >
                    清空
                  </button>
                )}
              </div>

              {/* Color Palette in HUD */}
              <div className="flex items-center gap-1">
                {FLAG_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.name}
                    onClick={() => setFlagColor(c.value)}
                    className={`w-5 h-5 rounded-full cursor-pointer transition ${
                      flagColor === c.value ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>

            {/* Selected Chips */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 overflow-x-auto flex items-center gap-1.5 py-1">
                {provinces.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">
                    在上方地图轻点任意省份即可圈选
                  </span>
                ) : (
                  provinces.map((p) => (
                    <div
                      key={p.id}
                      className="inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded text-xs text-slate-200 shrink-0"
                    >
                      {capital === p.name && <span className="text-amber-400">★</span>}
                      <span>{p.name}</span>
                      <button
                        type="button"
                        onClick={() => setProvinces((prev) => prev.filter((x) => x.id !== p.id))}
                        className="text-slate-400 hover:text-rose-400 p-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsSelectingOnMap(false)}
                className="px-4 py-1.5 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-xs"
                style={{ backgroundColor: flagColor }}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-fadeIn select-none">
      <div
        id="create-nation-modal"
        className="w-full max-w-2xl my-auto bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden relative text-slate-900 max-h-[92vh] flex flex-col"
      >
        {/* Top Flag accent strip */}
        <div
          className="h-1.5 flex-shrink-0 transition-colors duration-300"
          style={{ backgroundColor: flagColor }}
        />

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs text-white transition-colors duration-300"
              style={{ backgroundColor: flagColor }}
            >
              {(() => {
                const IconComp = EMBLEM_OPTIONS.find((e) => e.id === emblemIcon)?.icon || Crown;
                return <IconComp className="w-5 h-5 text-white" />;
              })()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                  开创粉陆
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  第 {step}/4 步
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {step === 1 && '第 1 步：粉陆名号与旗帜图腾'}
                {step === 2 && '第 2 步：疆域确立与法定都城'}
                {step === 3 && '第 3 步：宪纲政制与领土货币'}
                {step === 4 && '第 4 步：粉陆开创文牒核验'}
              </p>
            </div>
          </div>

          <button
            id="create-nation-close-btn"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/80 transition cursor-pointer"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="px-4 sm:px-6 py-2 bg-white border-b border-slate-100 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          {[
            { num: 1, label: '1. 陆名旗徽' },
            { num: 2, label: '2. 疆域都城' },
            { num: 3, label: '3. 宪纲政制' },
            { num: 4, label: '4. 开创文牒' },
          ].map((item) => {
            const isDone = step > item.num;
            const isCurrent = step === item.num;
            return (
              <button
                key={item.num}
                type="button"
                onClick={() => {
                  if (item.num === 1) setStep(1);
                  else if (item.num === 2 && name.trim()) setStep(2);
                  else if (item.num === 3 && provinces.length > 0 && capital) setStep(3);
                  else if (item.num === 4 && name.trim() && provinces.length > 0 && capital) setStep(4);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : isDone
                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    : 'text-slate-400 hover:text-slate-600 bg-slate-50'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                ) : (
                  <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono border border-current">
                    {item.num}
                  </span>
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mx-4 sm:mx-6 mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step Contents Container with Non-linear Spring Transition */}
        <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            {/* STEP 1: 国号、旗徽与极速模板 */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="space-y-4"
              >
                {/* 极速一键立国模板 */}
                <div className="p-3 bg-gradient-to-r from-amber-50/80 via-indigo-50/60 to-purple-50/60 border border-amber-200/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>一键立国模板（推荐新手使用）</span>
                    </div>
                    <span className="text-[10px] text-amber-700 font-bold bg-white px-2 py-0.5 rounded-full border border-amber-200">
                      快速启程
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {[
                      {
                        title: '🏮 华夏神州同盟',
                        data: {
                          name: '华夏神州同盟',
                          flagColor: '#dc2626',
                          emblem: 'Crown',
                          regime: '君主立宪制' as RegimeType,
                          ideology: '中立主义' as IdeologyType,
                          party: 'neutral' as const,
                          language: '汉语',
                          currencyMode: 'lingyu' as const,
                          customCurrencyName: '玲玉币',
                          currencyRate: 1,
                          capitalKeyword: '北京',
                          regionKeywords: ['北京', '河北', '山东', '江苏', '浙江', '广东', '四川'],
                        },
                      },
                      {
                        title: '🦅 欧陆自由联邦',
                        data: {
                          name: '欧罗巴自由同盟',
                          flagColor: '#2563eb',
                          emblem: 'Shield',
                          regime: '民主议会制' as RegimeType,
                          ideology: '民主主义' as IdeologyType,
                          party: 'democratic' as const,
                          language: '法语',
                          currencyMode: 'custom' as const,
                          customCurrencyName: '欧陆自由盾',
                          currencyRate: 1.2,
                          capitalKeyword: '巴黎',
                          regionKeywords: ['巴黎', '伦敦', '莱茵兰', '巴伐利亚', '马德里', '罗马'],
                        },
                      },
                      {
                        title: '🗽 新大陆合众国',
                        data: {
                          name: '新大陆联邦共和国',
                          flagColor: '#0891b2',
                          emblem: 'Star',
                          regime: '民主议会制' as RegimeType,
                          ideology: '民主主义' as IdeologyType,
                          party: 'democratic' as const,
                          language: '英语',
                          currencyMode: 'custom' as const,
                          customCurrencyName: '合众金元',
                          currencyRate: 1.5,
                          capitalKeyword: '华盛顿',
                          regionKeywords: ['华盛顿', '纽约', '加利福尼亚', '得克萨斯', '佛罗里达'],
                        },
                      },
                      {
                        title: '⚔️ 北方钢铁苏维埃',
                        data: {
                          name: '北方钢铁苏维埃共和国',
                          flagColor: '#b91c1c',
                          emblem: 'Swords',
                          regime: '苏维埃代表制' as RegimeType,
                          ideology: '共产主义' as IdeologyType,
                          party: 'communist' as const,
                          language: '俄语',
                          currencyMode: 'custom' as const,
                          customCurrencyName: '红星卢布',
                          currencyRate: 0.9,
                          capitalKeyword: '莫斯科',
                          regionKeywords: ['莫斯科', '列宁格勒', '基辅', '明斯克', '斯摩棱斯克'],
                        },
                      },
                      {
                        title: '🌴 泛南洋自由海邦',
                        data: {
                          name: '泛南洋自由贸易公国',
                          flagColor: '#059669',
                          emblem: 'Compass',
                          regime: '君主立宪制' as RegimeType,
                          ideology: '中立主义' as IdeologyType,
                          party: 'neutral' as const,
                          language: '汉语',
                          currencyMode: 'custom' as const,
                          customCurrencyName: '海峡金盾',
                          currencyRate: 1.1,
                          capitalKeyword: '新加坡',
                          regionKeywords: ['新加坡', '曼谷', '暹罗', '爪哇', '吕宋'],
                        },
                      },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyTemplate(item.data)}
                        className="py-1.5 px-2 bg-white/90 hover:bg-white text-slate-800 rounded-lg border border-slate-200 hover:border-indigo-300 text-left text-xs font-bold transition shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer truncate"
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1. 粉陆名称（陆名）与灵感骰子 */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>
                      粉陆名称 <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      响亮独特的粉陆名号
                    </span>
                  </label>
                  <div className="relative flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Crown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        id="input-nation-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="例：大玲玉公国 / 泛南洋粉陆"
                        className="w-full pl-9 pr-3 h-10 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-600 transition"
                      />
                    </div>
                    {/* Random Dice Button */}
                    <button
                      type="button"
                      onClick={handleRandomizeName}
                      className="h-10 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shrink-0 border border-slate-200"
                      title="随机生成国号灵感"
                    >
                      <Dices className="w-4 h-4 text-indigo-600" />
                      <span className="hidden xs:inline">灵感</span>
                    </button>
                  </div>
                </div>

                {/* 2. 国旗色彩与主权图腾 */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  {/* Flag Color Palette */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Palette className="w-3.5 h-3.5 text-indigo-600" />
                        <span>国旗基色</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono font-bold">
                        {FLAG_COLORS.find((c) => c.value === flagColor)?.name || flagColor}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {FLAG_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setFlagColor(c.value)}
                          className={`w-7 h-7 rounded-xl cursor-pointer transition-all ${
                            flagColor === c.value
                              ? 'ring-2 ring-indigo-600 ring-offset-2 scale-110 shadow-xs'
                              : 'opacity-80 hover:opacity-100 hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Emblem Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Star className="w-3.5 h-3.5 text-indigo-600" />
                        <span>粉陆图腾徽记</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-bold">
                        {EMBLEM_OPTIONS.find((e) => e.id === emblemIcon)?.name || '徽标'}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {EMBLEM_OPTIONS.map((item) => {
                        const IconComponent = item.icon;
                        const isSelected = emblemIcon === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setEmblemIcon(item.id)}
                            className={`py-1.5 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs scale-105'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                            <span className="text-[10px] font-bold">{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: 疆域与都城 */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="space-y-4"
              >
                {/* 疆域圈选控制台 */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Compass className="w-4 h-4 text-indigo-600" />
                        <span>初始领土圈定（已移除非相邻限制）</span>
                        <span className="text-rose-500">*</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        当前已圈定 {provinces.length} / 上限 {maxAllowedProvinces} 个省份
                      </p>
                    </div>

                    {/* Fullscreen Map Mode Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setMapSelectSubMode('territory');
                        setIsSelectingOnMap(true);
                        onEnterMapMode?.();
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>全景沙盘圈选</span>
                    </button>
                  </div>

                  {/* 大洲与地理区域一键速选 */}
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                      <Globe2 className="w-3 h-3 text-indigo-500" />
                      <span>大洲与区域一键速选：</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {REGION_PRESETS.map((reg) => (
                        <button
                          key={reg.name}
                          type="button"
                          onClick={() => handleSelectRegion(reg.keyKeywords)}
                          className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs active:scale-95"
                        >
                          {reg.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Provinces Chips */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                      <span>已选领土列表：</span>
                      {provinces.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setProvinces([])}
                          className="text-rose-500 hover:underline cursor-pointer"
                        >
                          清空
                        </button>
                      )}
                    </div>
                    {provinces.length === 0 ? (
                      <div className="p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        尚未圈选领土，可点击上方「全景沙盘圈选」或「区域一键速选」
                      </div>
                    ) : (
                      <div className="p-2 bg-white rounded-xl border border-slate-200 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                        {provinces.map((prov) => {
                          const isCap = capital === prov.name;
                          return (
                            <div
                              key={prov.id}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition ${
                                isCap
                                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold shadow-2xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {isCap && <span className="text-amber-500">★</span>}
                              <span>{prov.name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setProvinces((prev) => prev.filter((p) => p.id !== prov.id));
                                  if (capital === prov.name) {
                                    setCapital(provinces.filter((p) => p.id !== prov.id)[0]?.name || '');
                                  }
                                }}
                                className="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
                                title="移除"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 法定首都 */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Landmark className="w-4 h-4 text-amber-500" />
                      <span>粉陆法定都城（首府）</span>
                      <span className="text-rose-500">*</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {capital ? `★ 当前法定都城：${capital}` : '尚未指定首府地块'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {provinces.length > 0 && (
                      <select
                        value={capital}
                        onChange={(e) => setCapital(e.target.value)}
                        className="h-8 px-2 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-800 cursor-pointer"
                      >
                        {provinces.map((p) => (
                          <option key={p.id} value={p.name}>
                            首都：{p.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMapSelectSubMode('capital');
                        setIsSelectingOnMap(true);
                        onEnterMapMode?.();
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-amber-700 border border-amber-300 text-xs font-bold rounded-lg transition cursor-pointer shadow-2xs"
                    >
                      地图点选
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: 宪纲与政体 */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="space-y-4"
              >
                {/* 四大主流政体制度 */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-indigo-600" />
                    <span>立宪政体与执政意识形态</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      {
                        id: 'communist' as const,
                        name: '苏维埃代表制 (共产主义)',
                        desc: '人民工农委员会执政，高度计划重工动员',
                        border: 'border-rose-400 bg-rose-50/50',
                      },
                      {
                        id: 'fascist' as const,
                        name: '军政府/军国主义 (法西斯主义)',
                        desc: '铁血元首与国家安全总动员，强权扩张',
                        border: 'border-amber-400 bg-amber-50/50',
                      },
                      {
                        id: 'democratic' as const,
                        name: '民主议会制 (民主主义)',
                        desc: '普选多党轮替制宪，自由商贸与金融繁荣',
                        border: 'border-blue-400 bg-blue-50/50',
                      },
                      {
                        id: 'neutral' as const,
                        name: '君主立宪制 (中立主义)',
                        desc: '传统王权与宪政议会并存，保持均势不结盟',
                        border: 'border-slate-400 bg-slate-50/50',
                      },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedRulingParty(item.id)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          selectedRulingParty === item.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs font-bold">{item.name}</div>
                        <div
                          className={`text-[11px] mt-0.5 ${
                            selectedRulingParty === item.id ? 'text-indigo-100' : 'text-slate-500'
                          }`}
                        >
                          {item.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 执政党名称 */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    当前执政党正式全称
                  </label>
                  <input
                    type="text"
                    value={
                      selectedRulingParty === 'communist'
                        ? communistPartyName
                        : selectedRulingParty === 'fascist'
                        ? fascistPartyName
                        : selectedRulingParty === 'democratic'
                        ? democraticPartyName
                        : neutralPartyName
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (selectedRulingParty === 'communist') setCommunistPartyName(val);
                      else if (selectedRulingParty === 'fascist') setFascistPartyName(val);
                      else if (selectedRulingParty === 'democratic') setDemocraticPartyName(val);
                      else setNeutralPartyName(val);
                    }}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-600 transition"
                  />
                </div>

                {/* 官方语言与货币结算模式 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Language */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Languages className="w-3.5 h-3.5 text-indigo-600" />
                      <span>官方通行语言</span>
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full h-8 px-2 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-800 cursor-pointer"
                    >
                      <option value="汉语">汉语 (Mandarin)</option>
                      <option value="英语">英语 (English)</option>
                      <option value="俄语">俄语 (Russian)</option>
                      <option value="法语">法语 (French)</option>
                      <option value="德语">德语 (German)</option>
                      <option value="西班牙语">西班牙语 (Spanish)</option>
                      <option value="日语">日语 (Japanese)</option>
                      <option value="阿拉伯语">阿拉伯语 (Arabic)</option>
                    </select>
                  </div>

                  {/* Currency */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span>法定货币制度</span>
                    </label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCurrencyMode('lingyu')}
                        className={`flex-1 py-1 px-1.5 text-xs font-bold rounded-lg border transition cursor-pointer text-center ${
                          currencyMode === 'lingyu'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        玲玉币本位
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrencyMode('custom')}
                        className={`flex-1 py-1 px-1.5 text-xs font-bold rounded-lg border transition cursor-pointer text-center ${
                          currencyMode === 'custom'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        自拟主权货币
                      </button>
                    </div>
                    {currencyMode === 'custom' && (
                      <input
                        type="text"
                        value={customCurrencyName}
                        onChange={(e) => setCustomCurrencyName(e.target.value)}
                        placeholder="输入自拟货币名称（如：银元）"
                        className="w-full mt-1.5 h-7 px-2 text-xs bg-white border border-slate-200 rounded text-slate-900"
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: 国牒诏书预览与庄严宣告 */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="space-y-4"
              >
                {/* Holographic Passport ID Card */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-5 space-y-4">
                  {/* Glowing Top Banner */}
                  <div
                    className="absolute top-0 left-0 right-0 h-2"
                    style={{ backgroundColor: flagColor }}
                  />

                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg border border-white/20"
                        style={{ backgroundColor: flagColor }}
                      >
                        {(() => {
                          const IconComp = EMBLEM_OPTIONS.find((e) => e.id === emblemIcon)?.icon || Crown;
                          return <IconComp className="w-6 h-6 text-white" />;
                        })()}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono tracking-widest text-indigo-300 uppercase">
                          SOVEREIGN PROCLAMATION
                        </span>
                        <h3 className="text-lg font-black tracking-tight text-white">{name}</h3>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">法定都城</span>
                      <span className="text-xs font-bold text-amber-400">{capital}</span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-400 block">粉陆政体</span>
                      <span className="font-bold text-slate-100">{partyToRegime[selectedRulingParty]}</span>
                    </div>
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-400 block">意识形态</span>
                      <span className="font-bold text-indigo-300">{partyToIdeology[selectedRulingParty]}</span>
                    </div>
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-400 block">法定疆域</span>
                      <span className="font-bold text-emerald-300">{provinces.length} 个省份</span>
                    </div>
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-400 block">官方货币</span>
                      <span className="font-bold text-amber-300">
                        {currencyMode === 'lingyu' ? '玲玉币' : customCurrencyName || '自拟货币'}
                      </span>
                    </div>
                  </div>

                  {/* Territory Overview */}
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-slate-300 leading-relaxed">
                    <div className="font-bold text-slate-200 mb-1 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>粉陆立宪文牒通告：</span>
                    </div>
                    <span>
                      粉陆奠基，兹宣告【{name}】正式开创立宪。法定都城设于【{capital}】，领土总括{' '}
                      {provinces.map((p) => p.name).join('、')} 共 {provinces.length}{' '}
                      处名山重镇。宪纲昭昭，千秋永固。
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev > 1 ? ((prev - 1) as any) : 1))}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>上一步</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-slate-500 hover:bg-slate-200/80 text-xs font-bold transition cursor-pointer"
            >
              取消
            </button>
          )}

          <div className="flex items-center gap-2">
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>
                  {step === 1 && '继续：圈定疆域'}
                  {step === 2 && '继续：宪纲政制'}
                  {step === 3 && '继续：颁布诏书'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                id="submit-create-nation-btn"
                type="button"
                disabled={isLoading}
                onClick={() => handleSubmit()}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-indigo-600 to-indigo-700 hover:opacity-95 text-white font-black rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Crown className="w-4 h-4 text-amber-300" />
                    <span>开创粉陆 · 鸣放礼炮</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
