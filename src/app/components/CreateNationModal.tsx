import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import mapGeoData from '../assets/hoi4_fixed_map.json';
import {
  X,
  Crown,
  Compass,
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
  Globe2,
  Dices,
  Flame,
  CheckCircle2,
  Building2,
  Users,
  ShieldAlert,
  Vote,
  MapPin,
  FileCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RegimeType, IdeologyType, ProvinceData } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getProvinceChineseName } from '../lib/provinceTranslations';

interface CreateNationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onEnterMapMode?: () => void;
  onMapModeChange?: (isSelecting: boolean) => void;
  initialMapMode?: boolean;
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

// 严选地缘推演配色谱系（典雅克制、高辨识度）
const FLAG_COLORS = [
  { name: '赤红', value: '#dc2626' },
  { name: '普鲁士蓝', value: '#1d4ed8' },
  { name: '松绿', value: '#059669' },
  { name: '深黛紫', value: '#4f46e5' },
  { name: '琥珀金', value: '#d97706' },
  { name: '石青', value: '#0891b2' },
  { name: '玄黑', value: '#1e293b' },
  { name: '朱砂', value: '#b91c1c' },
];

const EMBLEM_OPTIONS = [
  { id: 'Crown', name: '王冠', icon: Crown },
  { id: 'Shield', name: '盾徽', icon: Shield },
  { id: 'Compass', name: '罗盘', icon: Compass },
  { id: 'Star', name: '星徽', icon: Star },
  { id: 'Swords', name: '双刃', icon: Swords },
  { id: 'Landmark', name: '神殿', icon: Landmark },
  { id: 'Scale', name: '天平', icon: Scale },
  { id: 'Flame', name: '圣火', icon: Flame },
  { id: 'Globe2', name: '寰宇', icon: Globe2 },
  { id: 'Pickaxe', name: '筑垒', icon: Pickaxe },
];

// 地理区域快速圈选
const REGION_PRESETS: { name: string; keyKeywords: string[] }[] = [
  { name: '东亚', keyKeywords: ['北京', '河北', '山东', '江苏', '浙江', '广东', '四川', '上海', '陕西', '湖北'] },
  { name: '西欧', keyKeywords: ['伦敦', '巴黎', '莱茵兰', '巴伐利亚', '马德里', '罗马', '阿姆斯特丹', '布鲁塞尔'] },
  { name: '北美', keyKeywords: ['纽约', '加利福尼亚', '得克萨斯', '伊利诺伊', '华盛顿', '佛罗里达', '安大略'] },
  { name: '中东', keyKeywords: ['伊斯坦布尔', '君士坦丁堡', '大马士革', '开罗', '巴格达', '德黑兰', '耶路撒冷', '安卡拉'] },
  { name: '东欧', keyKeywords: ['莫斯科', '列宁格勒', '基辅', '明斯克', '华沙', '斯摩棱斯克', '布加勒斯特'] },
  { name: '东南亚', keyKeywords: ['曼谷', '暹罗', '新加坡', '爪哇', '吕宋', '河内', '仰光', '西贡'] },
  { name: '地中海', keyKeywords: ['雅典', '那不勒斯', '西西里', '巴塞罗那', '突尼斯', '阿尔及尔'] },
];

// 专业严谨的地缘政体原型（替代 Emoji 模板）
const NATION_ARCHETYPES = [
  {
    id: 'orient_empire',
    label: '华夏神州同盟',
    regimeLabel: '君主立宪制',
    icon: Crown,
    data: {
      name: '华夏神州同盟',
      flagColor: '#dc2626',
      emblem: 'Crown',
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
    id: 'euro_union',
    label: '欧陆自由联邦',
    regimeLabel: '民主议会制',
    icon: Vote,
    data: {
      name: '欧罗巴自由同盟',
      flagColor: '#1d4ed8',
      emblem: 'Shield',
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
    id: 'north_soviet',
    label: '北方统合苏维埃',
    regimeLabel: '苏维埃代表制',
    icon: Users,
    data: {
      name: '北方钢铁苏维埃共和国',
      flagColor: '#b91c1c',
      emblem: 'Swords',
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
    id: 'maritime_league',
    label: '泛南洋自由公国',
    regimeLabel: '自由城邦制',
    icon: Compass,
    data: {
      name: '泛南洋自由贸易公国',
      flagColor: '#059669',
      emblem: 'Compass',
      party: 'neutral' as const,
      language: '汉语',
      currencyMode: 'custom' as const,
      customCurrencyName: '海峡金盾',
      currencyRate: 1.1,
      capitalKeyword: '新加坡',
      regionKeywords: ['新加坡', '曼谷', '暹罗', '爪哇', '吕宋'],
    },
  },
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
  initialMapMode = false,
}) => {
  const { setMyNation } = useAuth();

  // 3 步式流程：1. 基本政制与国名  2. 疆域划分与首府  3. 宪制确认与立国
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [name, setName] = useState('');
  const [capital, setCapital] = useState('');
  const [territory, setTerritory] = useState('');
  const [selectedRulingParty, setSelectedRulingParty] = useState<'communist' | 'fascist' | 'democratic' | 'neutral'>('neutral');
  const [communistPartyName, setCommunistPartyName] = useState('人民劳动代表会');
  const [fascistPartyName, setFascistPartyName] = useState('国家防卫统率阵线');
  const [democraticPartyName, setDemocraticPartyName] = useState('公民宪政自由同盟');
  const [neutralPartyName, setNeutralPartyName] = useState('国家秩序协商公会');
  const [language, setLanguage] = useState('汉语');
  const [currencyMode, setCurrencyMode] = useState<'lingyu' | 'custom'>('lingyu');
  const [customCurrencyName, setCustomCurrencyName] = useState('');
  const [currencyRate, setCurrencyRate] = useState<number>(1);
  const [flagColor, setFlagColor] = useState('#dc2626');
  const [emblemIcon, setEmblemIcon] = useState('Crown');
  const [lng] = useState('116.40');
  const [lat] = useState('39.90');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [provinces, setProvinces] = useState<ProvinceData[]>([]);
  const [availableProvinces, setAvailableProvinces] = useState<any[]>([]);
  const [provinceSearch, setProvinceSearch] = useState('');

  const [isSelectingOnMap, setIsSelectingOnMap] = useState(false);
  const [mapSelectSubMode, setMapSelectSubMode] = useState<'territory' | 'capital'>('territory');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsSelectingOnMap(initialMapMode);
    }
  }, [isOpen, initialMapMode]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    onMapModeChange?.(isSelectingOnMap);
  }, [isSelectingOnMap, onMapModeChange]);

  // 同步地图悬浮/圈选预览
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

  // 从地图 JSON 载入省份列表
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

  // 地图省份点击监听：自由圈选
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
            return [...prev, { id, name: pName, isCore: true, civilianFactories: 1, militaryFactories: 1 }];
          }
          return prev;
        });
      }
    };
    window.addEventListener('map-province-click', handleMapSelect);
    return () => window.removeEventListener('map-province-click', handleMapSelect);
  }, [isSelectingOnMap, mapSelectSubMode, capital]);

  if (!isOpen) return null;

  // 区域批量圈选
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
    }

    if (matched.length > 0) {
      setProvinces((prev) => {
        const next = [...prev];
        for (const m of matched) {
          if (!next.some((p) => String(p.id) === String(m.id) || p.name === m.name)) {
            next.push(m);
          }
        }
        if (!capital && next.length > 0) {
          setCapital(next[0].name);
        }
        return next;
      });
      setError(null);
    }
  };

  // 应用原型预设
  const handleApplyArchetype = (archetype: typeof NATION_ARCHETYPES[0]['data']) => {
    setName(archetype.name);
    setFlagColor(archetype.flagColor);
    setEmblemIcon(archetype.emblem);
    setSelectedRulingParty(archetype.party);
    setLanguage(archetype.language);
    setCurrencyMode(archetype.currencyMode);
    setCustomCurrencyName(archetype.customCurrencyName);
    setCurrencyRate(archetype.currencyRate);
    handleSelectRegion(archetype.regionKeywords);
    if (archetype.capitalKeyword) {
      const foundCap = availableProvinces.find(
        (p) => p.name.includes(archetype.capitalKeyword) || archetype.capitalKeyword.includes(p.name)
      );
      if (foundCap) setCapital(foundCap.name);
    }
    setError(null);
  };

  const handleRandomizeName = () => {
    const filtered = RANDOM_NAMES.filter((n) => n !== name);
    const chosen = filtered[Math.floor(Math.random() * filtered.length)];
    setName(chosen);
  };

  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      if (!name.trim()) {
        setError('请填写国家全称');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (provinces.length === 0) {
        setError('请至少划定一个省份作为主权疆域');
        return;
      }
      if (!capital.trim()) {
        setError('请设定法定首府（都城）');
        return;
      }
      setStep(3);
    }
  };

  // 提交建国
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!name.trim()) throw new Error('请填写国家全称');
      if (provinces.length === 0) throw new Error('请至少划定一个省份作为主权疆域');
      if (!capital.trim()) throw new Error('请指定法定首府');

      const parsedLng = parseFloat(lng) || 0;
      const parsedLat = parseFloat(lat) || 0;

      const finalCurrency = currencyMode === 'lingyu' ? '玲玉币' : (customCurrencyName.trim() || '主权货币');
      const finalCurrencyRate = currencyMode === 'lingyu' ? 1 : (Number(currencyRate) > 0 ? Number(currencyRate) : 1);

      const res = await api.nations.create({
        name: name.trim(),
        capital: capital.trim(),
        territory: territory.trim() || `领土包含 ${provinces.map((p) => p.name).join('、')}`,
        provinces,
        description: '主权独立，万民归序，宪纲确立。',
        regime: partyToRegime[selectedRulingParty] || '君主立宪制',
        ideology: partyToIdeology[selectedRulingParty] || '中立主义',
        rulingPartyId: selectedRulingParty,
        partyNames: {
          communist: communistPartyName.trim() || '人民劳动代表会',
          fascist: fascistPartyName.trim() || '国家防卫统率阵线',
          democratic: democraticPartyName.trim() || '公民宪政自由同盟',
          neutral: neutralPartyName.trim() || '国家秩序协商公会',
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
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || '创建国家失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 全景地图全屏圈选 HUD
  if (isSelectingOnMap) {
    return (
      <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between animate-fadeIn select-none">
        {/* 顶部悬浮控制栏 */}
        <header className="pointer-events-auto w-full bg-slate-900/90 text-white backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <button
              id="map-mode-back-btn"
              type="button"
              onClick={() => setIsSelectingOnMap(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>返回表单</span>
            </button>
            <div className="h-4 w-px bg-slate-700" />
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: flagColor }} />
              <span className="text-xs font-semibold text-slate-200">{name || '新建国家'}</span>
              <span className="text-xs text-slate-400">· 全景地图圈地模式</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setMapSelectSubMode('territory')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                  mapSelectSubMode === 'territory' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>圈定疆域</span>
              </button>
              <button
                type="button"
                onClick={() => setMapSelectSubMode('capital')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                  mapSelectSubMode === 'capital' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>指定都城</span>
              </button>
            </div>
          </div>
        </header>

        {/* 底部悬浮控制台 */}
        <div className="pointer-events-auto w-full bg-slate-900/95 text-slate-200 backdrop-blur-md border-t border-slate-800 px-4 py-3 shadow-xl">
          <div className="max-w-5xl mx-auto space-y-2.5">
            {/* 快速大洲划分 */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
                <Globe2 className="w-3.5 h-3.5 text-slate-400" />
                <span>大洲速选:</span>
              </span>
              <div className="flex items-center gap-1.5">
                {REGION_PRESETS.map((reg) => (
                  <button
                    key={reg.name}
                    type="button"
                    onClick={() => handleSelectRegion(reg.keyKeywords)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition border border-slate-700 cursor-pointer"
                  >
                    +{reg.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 状态指示与已选省份 */}
            <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-300">
                  已划定疆域: <strong className="text-white font-semibold">{provinces.length}</strong> 个省份
                </span>
                <span className="text-slate-500">|</span>
                <span className="font-medium text-slate-300 flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5 text-slate-400" />
                  法定都城: <strong className="text-white font-semibold">{capital || '未选定'}</strong>
                </span>
                {provinces.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setProvinces([]);
                      setCapital('');
                    }}
                    className="text-rose-400 hover:text-rose-300 hover:underline cursor-pointer ml-2 text-xs"
                  >
                    清空已选
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsSelectingOnMap(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>完成地图圈选并返回</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const CurrentEmblemIcon = EMBLEM_OPTIONS.find((e) => e.id === emblemIcon)?.icon || Crown;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fadeIn select-none">
      <div
        id="create-nation-modal"
        className="w-full max-w-2xl my-auto bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden relative text-slate-900 max-h-[90vh] flex flex-col"
      >
        {/* 顶部色彩标识条 */}
        <div className="h-1 flex-shrink-0 transition-colors duration-200" style={{ backgroundColor: flagColor }} />

        {/* 模态框标题栏 */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs transition-colors"
              style={{ backgroundColor: flagColor }}
            >
              <CurrentEmblemIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900 leading-none">新建国家</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                  步骤 {step}/3
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {step === 1 && '设定国家名号、政体制度与象征色彩'}
                {step === 2 && '划定主权领土疆域并确立行政首府'}
                {step === 3 && '确立执政宪纲并颁布开国立宪通告'}
              </p>
            </div>
          </div>

          <button
            id="create-nation-close-btn"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 步骤导航条 */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center gap-3">
          {[
            { num: 1 as const, title: '基本政制与国名' },
            { num: 2 as const, title: '领土疆域与首府' },
            { num: 3 as const, title: '宪制确认与立国' },
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
                  else if (item.num === 3 && name.trim() && provinces.length > 0 && capital) setStep(3);
                }}
                className={`flex items-center gap-2 text-xs font-medium transition cursor-pointer ${
                  isCurrent
                    ? 'text-indigo-600 font-semibold'
                    : isDone
                    ? 'text-slate-700 hover:text-indigo-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono transition ${
                    isCurrent
                      ? 'bg-indigo-600 text-white'
                      : isDone
                      ? 'bg-slate-200 text-slate-800'
                      : 'border border-slate-300 text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3 text-slate-800" /> : item.num}
                </span>
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mx-5 mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-rose-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 内容主体区域 */}
        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
          <AnimatePresence mode="wait">
            {/* 步骤 1: 基本政制与国名 */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* 规范的地缘政体原型预设 */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      快速套用政权原型（可选）
                    </span>
                    <span className="text-[11px] text-slate-400">点击自动填充推荐参数</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {NATION_ARCHETYPES.map((arch) => {
                      const ArchIcon = arch.icon;
                      return (
                        <button
                          key={arch.id}
                          type="button"
                          onClick={() => handleApplyArchetype(arch.data)}
                          className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-left transition cursor-pointer shadow-2xs"
                        >
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                            <ArchIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate">{arch.label}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">{arch.regimeLabel}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 整体政体与意识形态选择 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-indigo-600" />
                      国家整体政体与意识形态 <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      当前：{partyToRegime[selectedRulingParty]}
                    </span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      {
                        id: 'democratic' as const,
                        name: '民主议会制 (自由民主主义)',
                        desc: '多党竞选与议会分权，强调公民商贸与法治制度',
                        icon: Vote,
                      },
                      {
                        id: 'neutral' as const,
                        name: '君主立宪制 (传统中立主义)',
                        desc: '王室宪制统摄全局，追求区域均势与稳定中立',
                        icon: Crown,
                      },
                      {
                        id: 'communist' as const,
                        name: '苏维埃代表制 (社群社会主义)',
                        desc: '工农委员会统一决策，强调产业公有与重工动员',
                        icon: Users,
                      },
                      {
                        id: 'fascist' as const,
                        name: '军政府/军国主义 (极权威权主义)',
                        desc: '统帅合一集权战备，实施全面的国防战备动员',
                        icon: ShieldAlert,
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = selectedRulingParty === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedRulingParty(item.id)}
                          className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50/50 border-indigo-600 text-slate-900 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                              <span className="text-xs font-semibold text-slate-900">{item.name}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 pl-5.5 leading-relaxed">{item.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 国家全称输入与灵感 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span>
                      国家全称（国名） <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[11px] text-slate-400">建议使用具有地缘特征的正式名号</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="input-nation-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="例如：华夏神州同盟 / 欧罗巴自由同盟 / 新大陆联邦"
                        className="w-full pl-9 pr-3 h-9 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 transition"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRandomizeName}
                      className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-slate-300 shrink-0 cursor-pointer"
                    >
                      <Dices className="w-3.5 h-3.5 text-slate-600" />
                      <span>随机国号</span>
                    </button>
                  </div>
                </div>

                {/* 国旗色彩与主权徽章 */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  {/* 颜色选择 */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-indigo-600" />
                        国旗基色
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {FLAG_COLORS.find((c) => c.value === flagColor)?.name || flagColor}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {FLAG_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setFlagColor(c.value)}
                          className={`w-6 h-6 rounded-md cursor-pointer transition ${
                            flagColor === c.value
                              ? 'ring-2 ring-indigo-600 ring-offset-2 scale-105'
                              : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 徽章选择 */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-indigo-600" />
                        主权徽记
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {EMBLEM_OPTIONS.find((e) => e.id === emblemIcon)?.name || '王冠'}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                      {EMBLEM_OPTIONS.map((item) => {
                        const Icon = item.icon;
                        const isSelected = emblemIcon === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setEmblemIcon(item.id)}
                            className={`p-1.5 rounded-md border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span className="text-[10px]">{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 步骤 2: 领土疆域与首府 */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* 疆域划分概览 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded" style={{ backgroundColor: flagColor }} />
                    <div className="text-xs text-slate-700">
                      正在为【<strong className="font-semibold text-slate-900">{name}</strong>】配置领土与首府
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    修改基本信息
                  </button>
                </div>

                {/* 疆域划分工具台 */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-indigo-600" />
                        <span>主权领土圈选</span>
                        <span className="text-rose-500">*</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        当前已划定 <strong className="text-indigo-600 font-semibold">{provinces.length}</strong> 个省份
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMapSelectSubMode('territory');
                        setIsSelectingOnMap(true);
                        onEnterMapMode?.();
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>进入全景地图圈地</span>
                    </button>
                  </div>

                  {/* 大洲区域快捷划定 */}
                  <div>
                    <div className="text-[11px] text-slate-500 mb-1.5 flex items-center gap-1">
                      <Globe2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>大洲与主要地缘区域速选：</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {REGION_PRESETS.map((reg) => (
                        <button
                          key={reg.name}
                          type="button"
                          onClick={() => handleSelectRegion(reg.keyKeywords)}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 rounded text-xs transition cursor-pointer"
                        >
                          +{reg.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 已划定省份列表 */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span>已选省份清单 ({provinces.length})：</span>
                      {provinces.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setProvinces([]);
                            setCapital('');
                          }}
                          className="text-rose-500 hover:underline cursor-pointer text-xs"
                        >
                          清空全部
                        </button>
                      )}
                    </div>

                    {provinces.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        尚未圈选领土，可点击上方「进入全景地图圈地」或点击区域速选按钮
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                        {provinces.map((prov) => {
                          const isCap = capital === prov.name;
                          return (
                            <div
                              key={prov.id}
                              onClick={() => setCapital(prov.name)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border transition cursor-pointer ${
                                isCap
                                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                              title={isCap ? '法定都城' : '点击设为法定都城'}
                            >
                              {isCap && <Landmark className="w-3 h-3 text-amber-600" />}
                              <span>{prov.name}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProvinces((prev) => prev.filter((p) => p.id !== prov.id));
                                  if (capital === prov.name) {
                                    setCapital(provinces.filter((p) => p.id !== prov.id)[0]?.name || '');
                                  }
                                }}
                                className="text-slate-400 hover:text-rose-500 p-0.5 ml-0.5 cursor-pointer"
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

                {/* 法定都城设定 */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-amber-600" />
                      <span>国家法定首府（都城）</span>
                      <span className="text-rose-500">*</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {capital ? `当前法定首府：${capital}` : '尚未设定首府城市'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {provinces.length > 0 && (
                      <select
                        value={capital}
                        onChange={(e) => setCapital(e.target.value)}
                        className="h-8 px-2 text-xs bg-white border border-slate-300 rounded-md text-slate-800 cursor-pointer"
                      >
                        {provinces.map((p) => (
                          <option key={p.id} value={p.name}>
                            首府：{p.name}
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
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-medium rounded-md transition cursor-pointer"
                    >
                      地图点选
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 步骤 3: 宪制确认与立国宣告 */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* 执政党名与治理设置 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      执政党正式全称
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
                      className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:border-indigo-600 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1">
                      <Languages className="w-3.5 h-3.5 text-indigo-600" />
                      官方通行语言
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded-md text-slate-800 cursor-pointer"
                    >
                      <option value="汉语">汉语</option>
                      <option value="英语">英语</option>
                      <option value="俄语">俄语</option>
                      <option value="法语">法语</option>
                      <option value="德语">德语</option>
                      <option value="日语">日语</option>
                      <option value="西班牙语">西班牙语</option>
                      <option value="阿拉伯语">阿拉伯语</option>
                    </select>
                  </div>
                </div>

                {/* 货币体系 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-600" />
                    国家法定货币制度
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrencyMode('lingyu')}
                      className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md border transition cursor-pointer ${
                        currencyMode === 'lingyu'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      玲玉币国际储备体系
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrencyMode('custom')}
                      className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md border transition cursor-pointer ${
                        currencyMode === 'custom'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      自主发行主权货币
                    </button>
                  </div>
                  {currencyMode === 'custom' && (
                    <input
                      type="text"
                      value={customCurrencyName}
                      onChange={(e) => setCustomCurrencyName(e.target.value)}
                      placeholder="例如：神州银元 / 自由联邦法郎"
                      className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900"
                    />
                  )}
                </div>

                {/* 立国通告凭证卡片 */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: flagColor }}
                      >
                        <CurrentEmblemIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{name}</div>
                        <div className="text-[11px] text-slate-500">
                          {partyToRegime[selectedRulingParty]} · {partyToIdeology[selectedRulingParty]}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">法定首府</span>
                      <span className="text-xs font-semibold text-slate-800">{capital}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">领土省份</span>
                      <span className="font-semibold text-slate-800">{provinces.length} 个省</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">法定货币</span>
                      <span className="font-semibold text-slate-800">
                        {currencyMode === 'lingyu' ? '玲玉币' : customCurrencyName || '自拟货币'}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">官方语言</span>
                      <span className="font-semibold text-slate-800">{language}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 底部操作栏 */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>上一步</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              取消
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <span>下一步</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isLoading}
              onClick={handleSubmit}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>{isLoading ? '正在确立国家...' : '正式确立国家'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
