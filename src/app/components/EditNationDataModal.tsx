import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Save,
  Swords,
  Hammer,
  Boxes,
  Shield,
  Flag,
  Landmark,
  User,
  Heart,
  Flame,
  Percent,
  RefreshCw,
  Sparkles,
  Building2,
  Check,
  Upload,
} from 'lucide-react';
import { Nation, RegimeType, IdeologyType, FlagRatio } from '../types';
import { getTotalCivilianFactories } from '../lib/economyEngine';
import { calculateNationResourceOverview, StrategicResourceType } from '../lib/strategicCommandEngine';
import { NationFlagDisplay, getAspectRatioCSS } from './NationFlagDisplay';
import { TerritoryColorPicker } from './TerritoryColorPicker';
import { NationFontSelector } from './NationFontSelector';

interface EditNationDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  nation: Nation;
  onSaveNation: (updated: Nation) => void;
  showToast: (msg: string) => void;
}

const REGIME_OPTIONS: RegimeType[] = [
  '君主立宪制',
  '联邦共和制',
  '宪政联邦共和制',
  '民主议会制',
  '封建帝国',
  '军政府/军国主义',
  '神权政体',
  '苏维埃代表制',
  '自由城邦自治',
  '其他特殊政体',
];

const IDEOLOGY_OPTIONS: IdeologyType[] = [
  '自由民主主义',
  '中立和平主义',
  '扩张威权主义',
  '社群社会主义',
  '民族传统主义',
  '重商资本主义',
  '科技理性主义',
  '激进军国主义',
  '共产主义',
  '法西斯主义',
  '民主主义',
  '中立主义',
];

export const EditNationDataModal: React.FC<EditNationDataModalProps> = ({
  isOpen,
  onClose,
  nation,
  onSaveNation,
  showToast,
}) => {
  // Tabs: 'military' | 'industry' | 'resources' | 'politics'
  const [activeTab, setActiveTab] = useState<'military' | 'industry' | 'resources' | 'politics'>('military');

  // Basic Info
  const [name, setName] = useState(nation.name || '');
  const [capital, setCapital] = useState(nation.capital || '');
  const [leaderName, setLeaderName] = useState(nation.ownerDouyinName || nation.ownerUsername || '');
  const [regime, setRegime] = useState<RegimeType>(nation.regime || '联邦共和制');
  const [ideology, setIdeology] = useState<IdeologyType>(nation.ideology || '自由民主主义');
  const [flagColor, setFlagColor] = useState(nation.flagColor || '#3b82f6');
  const [nameFont, setNameFont] = useState(nation.nameFont || 'condensed');
  const [flagUrl, setFlagUrl] = useState<string | undefined>(nation.flagUrl);
  const [flagRatio, setFlagRatio] = useState<FlagRatio>(nation.flagRatio || '3:2');
  const [description, setDescription] = useState(nation.description || '');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFlagUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('请上传有效的图片格式文件 (PNG, JPG, SVG, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setFlagUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Military / Army Data
  const initialManpower = nation.army?.manpowerReserve ?? 128000;
  const [manpowerReserve, setManpowerReserve] = useState(initialManpower);
  const initialDivisions = nation.army?.divisions?.length ?? 8;
  const [divisionsCount, setDivisionsCount] = useState(initialDivisions);
  const initialArmyExp = nation.army?.armyExperience ?? 45;
  const [armyExperience, setArmyExperience] = useState(initialArmyExp);

  // Industry / Factories Data
  const initialCiv = getTotalCivilianFactories(nation) || 24;
  const [civilianFactories, setCivilianFactories] = useState(initialCiv);
  const initialMil = (nation as any).militaryFactories || (nation.militaryIndustry?.productionLines?.length ? nation.militaryIndustry.productionLines.length * 3 : 18);
  const [militaryFactories, setMilitaryFactories] = useState(initialMil);

  // National Index
  const [stabilityIndex, setStabilityIndex] = useState(nation.stabilityIndex ?? 82);
  const [warSupportIndex, setWarSupportIndex] = useState(nation.popularApproval ?? 75);
  const [totalPopulation, setTotalPopulation] = useState(nation.totalPopulation ?? 42500000);

  // Strategic Resources Stockpiles
  const currentRes = calculateNationResourceOverview(nation);
  const [resourcesStockpile, setResourcesStockpile] = useState<Record<StrategicResourceType, number>>({
    oil: currentRes.oil?.stockpile ?? 2400,
    steel: currentRes.steel?.stockpile ?? 3600,
    aluminium: currentRes.aluminium?.stockpile ?? 1800,
    rubber: currentRes.rubber?.stockpile ?? 1200,
    tungsten: currentRes.tungsten?.stockpile ?? 1100,
    chromium: currentRes.chromium?.stockpile ?? 950,
  });

  if (!isOpen) return null;

  const handleResourceChange = (resKey: StrategicResourceType, val: number) => {
    setResourcesStockpile((prev) => ({
      ...prev,
      [resKey]: Math.max(0, val),
    }));
  };

  const handleSave = () => {
    // Construct updated provinces with distributed factories and resources
    const currentProvinces = nation.provinces && nation.provinces.length > 0
      ? nation.provinces
      : [{ id: 'prov_core', name: `${name}本土`, civilianFactories, militaryFactories }];

    const provCount = Math.max(1, currentProvinces.length);
    const civPerProv = Math.max(1, Math.floor(civilianFactories / provCount));
    const milPerProv = Math.max(0, Math.floor(militaryFactories / provCount));

    const updatedProvinces = currentProvinces.map((prov, index) => ({
      ...prov,
      civilianFactories: index === 0 ? civilianFactories - civPerProv * (provCount - 1) : civPerProv,
      militaryFactories: index === 0 ? militaryFactories - milPerProv * (provCount - 1) : milPerProv,
      resources: {
        oil: Math.floor(resourcesStockpile.oil / provCount),
        steel: Math.floor(resourcesStockpile.steel / provCount),
        aluminium: Math.floor(resourcesStockpile.aluminium / provCount),
        rubber: Math.floor(resourcesStockpile.rubber / provCount),
        tungsten: Math.floor(resourcesStockpile.tungsten / provCount),
        chromium: Math.floor(resourcesStockpile.chromium / provCount),
      },
    }));

    // Update Army divisions list if count changed
    const currentDivs = nation.army?.divisions || [];
    let updatedDivisions = [...currentDivs];
    if (divisionsCount > updatedDivisions.length) {
      const added = divisionsCount - updatedDivisions.length;
      for (let i = 0; i < added; i++) {
        const divIdx = updatedDivisions.length + 1;
        updatedDivisions.push({
          id: `div_auto_${Date.now()}_${divIdx}`,
          name: `第${divIdx}步兵正规师`,
          type: 'infantry',
          corps: '中央国防守备集群',
          provinceId: updatedProvinces[0]?.id || 'prov_core',
          provinceName: updatedProvinces[0]?.name || capital || '都城卫戍区',
          status: 'ready',
          manpower: 9600,
          manpowerMax: 10000,
          equipmentRate: 0.95,
          organization: 90,
          supply: 100,
          experience: 35,
          template: { infantry: 9, artillery: 2, support: 1, armor: 0 },
          createdAt: new Date().toISOString(),
        });
      }
    } else if (divisionsCount < updatedDivisions.length) {
      updatedDivisions = updatedDivisions.slice(0, divisionsCount);
    }

    const updatedNation: Nation = {
      ...nation,
      name: name.trim() || nation.name,
      capital: capital.trim() || nation.capital,
      ownerDouyinName: leaderName.trim() || nation.ownerDouyinName,
      regime,
      ideology,
      flagColor,
      nameFont,
      flagUrl: flagUrl || undefined,
      flagRatio,
      description: description.trim(),
      stabilityIndex: Math.min(100, Math.max(0, stabilityIndex)),
      popularApproval: Math.min(100, Math.max(0, warSupportIndex)),
      totalPopulation: Math.max(100000, totalPopulation),
      provinces: updatedProvinces,
      militaryFactories,
      army: {
        manpowerReserve: Math.max(0, manpowerReserve),
        armyExperience: Math.min(500, Math.max(0, armyExperience)),
        divisions: updatedDivisions,
        generals: nation.army?.generals || [],
      },
      updatedAt: new Date().toISOString(),
      // Custom direct stockpiles override for quick reading
      strategicResourceStockpile: resourcesStockpile,
    } as any;

    onSaveNation(updatedNation);
    showToast(`国家【${updatedNation.name}】数据整编完成，已同步生效`);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-3.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-xs"
                style={{ backgroundColor: flagColor }}
              >
                {nation.emblemIcon || name.charAt(0) || '国'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    修改国家数据与沙盘整编
                  </h2>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-semibold">
                    {name}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  调整兵力编制、工农业产能、战略资源及内政稳定度
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex border-b border-slate-200 bg-white px-4 sm:px-6 shrink-0 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('military')}
              className={`py-2.5 px-3 border-b-2 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'military'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>陆军军事 ({Math.round(manpowerReserve / 1000)}K)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('industry')}
              className={`py-2.5 px-3 border-b-2 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'industry'
                  ? 'border-amber-600 text-amber-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>建设与工厂 ({civilianFactories + militaryFactories}座)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('resources')}
              className={`py-2.5 px-3 border-b-2 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'resources'
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>战略资源储备</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('politics')}
              className={`py-2.5 px-3 border-b-2 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'politics'
                  ? 'border-[#6B50F0] text-[#6B50F0]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>政体、领土与国号</span>
            </button>
          </div>

          {/* Form Content Area */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-slate-800">
            {/* 1. MILITARY & ARMY DATA */}
            {activeTab === 'military' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                      <Swords className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-rose-900">最高武装力量总参谋部</div>
                      <div className="text-[11px] text-rose-700">实时调整兵员池储备与常备国防师团部署</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black font-mono text-rose-900">
                      {manpowerReserve.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-rose-600">总可动员兵力</div>
                  </div>
                </div>

                {/* Manpower input & quick step buttons */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>陆军预备役与总人力储备 (人)</span>
                    </label>
                    <span className="font-mono text-xs font-bold text-rose-600">
                      {Math.round(manpowerReserve / 1000)}K
                    </span>
                  </div>

                  <input
                    type="number"
                    min={0}
                    max={50000000}
                    step={10000}
                    value={manpowerReserve}
                    onChange={(e) => setManpowerReserve(Number(e.target.value) || 0)}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-hidden transition"
                  />

                  {/* Quick Manpower Adders */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {[
                      { label: '+10K', add: 10000 },
                      { label: '+50K', add: 50000 },
                      { label: '+100K', add: 100000 },
                      { label: '+500K', add: 500000 },
                      { label: '重设为128K', set: 128000 },
                    ].map((btn, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (btn.set !== undefined) setManpowerReserve(btn.set);
                          else if (btn.add) setManpowerReserve((prev) => Math.max(0, prev + btn.add));
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-semibold font-mono border border-slate-200/80 transition cursor-pointer active:scale-95"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divisions Count */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>主力师团编制数 (师)</span>
                      <span className="font-mono text-xs font-bold text-slate-900">{divisionsCount} 个师</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={1}
                        max={40}
                        value={divisionsCount}
                        onChange={(e) => setDivisionsCount(Number(e.target.value))}
                        className="flex-1 accent-rose-600"
                      />
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={divisionsCount}
                        onChange={(e) => setDivisionsCount(Math.max(1, Number(e.target.value) || 1))}
                        className="w-16 h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-center"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>陆军指挥经验值</span>
                      <span className="font-mono text-xs font-bold text-amber-600">{armyExperience} 点</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={500}
                        value={armyExperience}
                        onChange={(e) => setArmyExperience(Number(e.target.value))}
                        className="flex-1 accent-amber-600"
                      />
                      <input
                        type="number"
                        min={0}
                        max={500}
                        value={armyExperience}
                        onChange={(e) => setArmyExperience(Math.max(0, Number(e.target.value) || 0))}
                        className="w-16 h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. INDUSTRY & FACTORIES */}
            {activeTab === 'industry' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                      <Hammer className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-900">国家战略工业与筑造中心</div>
                      <div className="text-[11px] text-amber-700">分配民用基础设施与军工国防装备产能</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black font-mono text-amber-900">
                      {civilianFactories + militaryFactories} 座
                    </div>
                    <div className="text-[10px] text-amber-600">全域总工场配额</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  {/* Civilian Factories */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-slate-800">民用工厂 (建设主轴)</span>
                      </div>
                      <span className="font-mono text-sm font-black text-amber-600">
                        {civilianFactories} 座
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      用于境内省份基建、矿脉开拓、防空堡垒与港口筑造。
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCivilianFactories((p) => Math.max(1, p - 5))}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => setCivilianFactories((p) => Math.max(1, p - 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={civilianFactories}
                        onChange={(e) => setCivilianFactories(Math.max(1, Number(e.target.value) || 1))}
                        className="flex-1 h-8 bg-white border border-slate-200 rounded-lg text-center font-mono font-bold text-sm text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setCivilianFactories((p) => p + 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => setCivilianFactories((p) => p + 5)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                      >
                        +5
                      </button>
                    </div>
                  </div>

                  {/* Military Factories */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Swords className="w-4 h-4 text-rose-600" />
                        <span className="text-xs font-bold text-slate-800">军用工厂 (军械军需)</span>
                      </div>
                      <span className="font-mono text-sm font-black text-rose-600">
                        {militaryFactories} 座
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      用于生产步兵轻武器、火炮、坦克装甲与前线战机。
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMilitaryFactories((p) => Math.max(0, p - 5))}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => setMilitaryFactories((p) => Math.max(0, p - 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={500}
                        value={militaryFactories}
                        onChange={(e) => setMilitaryFactories(Math.max(0, Number(e.target.value) || 0))}
                        className="flex-1 h-8 bg-white border border-slate-200 rounded-lg text-center font-mono font-bold text-sm text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setMilitaryFactories((p) => p + 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => setMilitaryFactories((p) => p + 5)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. STRATEGIC RESOURCES */}
            {activeTab === 'resources' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center">
                      <Boxes className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-sky-900">国家六大战略资源国家储备库</div>
                      <div className="text-[11px] text-sky-700">保障机械化进军、航空兵燃油与重装甲冶炼</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black font-mono text-sky-900">
                      {(Object.values(resourcesStockpile) as number[]).reduce((a: number, b: number) => a + b, 0).toLocaleString()} 单位
                    </div>
                    <div className="text-[10px] text-sky-600">战略资源总储量</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    { key: 'oil', label: '石油', desc: '用于装甲发动机、航空汽油与战舰远洋', color: 'text-amber-500' },
                    { key: 'steel', label: '钢铁', desc: '坦克底盘、枪炮锻造与装甲板骨架', color: 'text-slate-400' },
                    { key: 'aluminium', label: '铝材', desc: '战机蒙皮、无线电仪表与航空引擎', color: 'text-sky-400' },
                    { key: 'rubber', label: '橡胶', desc: '卡车轮胎、战车履带衬套与电缆绝缘', color: 'text-emerald-500' },
                    { key: 'tungsten', label: '钨矿', desc: '穿甲弹芯、重型反坦克炮与特种工具钢', color: 'text-violet-400' },
                    { key: 'chromium', label: '铬矿', desc: '超重型战车装甲镀层与现代舰体结构', color: 'text-rose-400' },
                  ].map((res) => {
                    const rKey = res.key as StrategicResourceType;
                    return (
                      <div key={res.key} className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${res.color} bg-current`} />
                            {res.label}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {resourcesStockpile[rKey].toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{res.desc}</p>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleResourceChange(rKey, resourcesStockpile[rKey] - 500)}
                            className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
                          >
                            -500
                          </button>
                          <input
                            type="number"
                            min={0}
                            step={100}
                            value={resourcesStockpile[rKey]}
                            onChange={(e) => handleResourceChange(rKey, Number(e.target.value) || 0)}
                            className="flex-1 h-7 bg-white border border-slate-200 rounded text-xs font-mono font-bold text-center"
                          />
                          <button
                            type="button"
                            onClick={() => handleResourceChange(rKey, resourcesStockpile[rKey] + 500)}
                            className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
                          >
                            +500
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. POLITICS, REGIME & IDENTITY */}
            {activeTab === 'politics' && (
              <div className="space-y-4">
                {/* Nation Name & Capital */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">正式国号 / 国家名称</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="输入国家全称"
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#6B50F0] focus:outline-hidden transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">法定都城 / 首都卫戍</label>
                    <input
                      type="text"
                      required
                      value={capital}
                      onChange={(e) => setCapital(e.target.value)}
                      placeholder="都城名称"
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#6B50F0] focus:outline-hidden transition"
                    />
                  </div>
                </div>

                {/* Regime & Ideology */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">政体制度</label>
                    <select
                      value={regime}
                      onChange={(e) => setRegime(e.target.value as RegimeType)}
                      className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#6B50F0] focus:outline-hidden transition cursor-pointer"
                    >
                      {REGIME_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">执政意识形态</label>
                    <select
                      value={ideology}
                      onChange={(e) => setIdeology(e.target.value as IdeologyType)}
                      className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#6B50F0] focus:outline-hidden transition cursor-pointer"
                    >
                      {IDEOLOGY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Stability & War Support */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Heart className="w-3.5 h-3.5 text-emerald-600" />
                        国内稳定度
                      </span>
                      <span className="font-mono text-emerald-600 font-black">{stabilityIndex}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={stabilityIndex}
                      onChange={(e) => setStabilityIndex(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Flame className="w-3.5 h-3.5 text-rose-600" />
                        民众战争支持度
                      </span>
                      <span className="font-mono text-rose-600 font-black">{warSupportIndex}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={warSupportIndex}
                      onChange={(e) => setWarSupportIndex(Number(e.target.value))}
                      className="w-full accent-rose-600"
                    />
                  </div>
                </div>

                {/* 国旗图像与长宽比设置 (1:1, 19:10, 1:2, 3:2) */}
                <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Flag className="w-3.5 h-3.5 text-[#6B50F0]" />
                      <span>国旗图案与规格</span>
                    </label>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg text-[10px]">
                      {(['3:2', '19:10', '1:2', '1:1'] as FlagRatio[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setFlagRatio(r)}
                          className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                            flagRatio === r
                              ? 'bg-[#6B50F0] text-white shadow-2xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* 国旗预览 */}
                    <div
                      style={{ aspectRatio: getAspectRatioCSS(flagRatio) }}
                      className="w-20 h-auto rounded-lg overflow-hidden border border-slate-300 shadow-2xs shrink-0 flex items-center justify-center bg-slate-100"
                    >
                      <NationFlagDisplay
                        flagUrl={flagUrl}
                        flagColor={flagColor}
                        name={name}
                        ratio={flagRatio}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer flex items-center gap-1"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>上传国旗图片</span>
                        </button>
                        {flagUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setFlagUrl(undefined);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="text-[11px] text-rose-600 hover:text-rose-700 cursor-pointer"
                          >
                            清除图片
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        当前比例：{flagRatio} · 支持 1:1, 19:10, 1:2, 3:2
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFlagUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Flag & Territory Color Picker */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>国旗与疆域代表色</span>
                    <span className="font-mono text-[11px] text-slate-400 font-normal">点击收纳/展开调色盘</span>
                  </label>
                  <TerritoryColorPicker
                    color={flagColor}
                    onChange={(newHex) => setFlagColor(newHex)}
                    nationName={name}
                    variant="form"
                    placement="bottom-start"
                  />
                </div>

                {/* Country Name Map Font (国家名称字体) */}
                <div className="pt-2 border-t border-slate-100">
                  <NationFontSelector
                    value={nameFont}
                    onChange={setNameFont}
                    sampleText={name || nation.name}
                  />
                </div>

                {/* Leader Name & Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">国家领袖称谓</label>
                  <input
                    type="text"
                    value={leaderName}
                    onChange={(e) => setLeaderName(e.target.value)}
                    placeholder="国家元首或统治者名称"
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#6B50F0] focus:outline-hidden transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">国家背景宣言与立宪宗旨</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="输入地缘历史简述、宪章宣言或国家宗旨..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#6B50F0] focus:outline-hidden transition resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-4 sm:px-6 py-3.5 bg-slate-50/90 border-t border-slate-200/80 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => {
                setManpowerReserve(initialManpower);
                setCivilianFactories(initialCiv);
                setMilitaryFactories(initialMil);
                setStabilityIndex(nation.stabilityIndex ?? 80);
                showToast('已重置回当前初始数据');
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>恢复初始</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                取消
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-[#6B50F0] hover:bg-[#5b40e0] text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>保存国家数据并同步全图</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
