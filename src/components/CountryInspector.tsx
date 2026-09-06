import React, { useState } from 'react';
import {
  X,
  MapPin,
  Users,
  TrendingUp,
  Shield,
  Layers,
  Sparkles,
  Zap,
  Wheat,
  Factory,
  Building,
  Compass,
  AlertTriangle,
  HeartHandshake,
  Calendar,
  Brush,
  Edit3,
  Trash2,
  FileText,
  Flag,
  Globe2,
  ShieldCheck,
  CheckCircle2,
  Anchor,
  Plus,
} from 'lucide-react';
import { Country, StrategicDoctrine, TerritoryTile, TreatyType, UserRole } from '../types';
import { DOCTRINE_OPTIONS, TREATY_OPTIONS } from '../utils/worldCalculations';
import { EmblemIcon } from './EmblemIcon';

interface CountryInspectorProps {
  country: Country;
  allTerritories: TerritoryTile[];
  allCountries: Country[];
  userRole: UserRole;
  onClose: () => void;
  onSelectTile: (tileId: string) => void;
  onEditCountry: (country: Country) => void;
  onStartPaintingTerritory: (countryId: string) => void;
  onDeleteCountry: (countryId: string) => void;
  onUpdateCountryDoctrine?: (countryId: string, doctrine: StrategicDoctrine) => void;
  onSignTreaty?: (countryId: string, targetCountryId: string, type: TreatyType) => void;
}

type TabKey = 'overview' | 'provinces' | 'treaties' | 'doctrines';

export const CountryInspector: React.FC<CountryInspectorProps> = ({
  country,
  allTerritories,
  allCountries,
  userRole,
  onClose,
  onSelectTile,
  onEditCountry,
  onStartPaintingTerritory,
  onDeleteCountry,
  onUpdateCountryDoctrine,
  onSignTreaty,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showTreatyForm, setShowTreatyForm] = useState<boolean>(false);
  const [selectedTargetCountryId, setSelectedTargetCountryId] = useState<string>('');
  const [selectedTreatyType, setSelectedTreatyType] = useState<TreatyType>('全面同盟协定');

  const controlledTiles = allTerritories.filter((t) => country.controlledTileIds.includes(t.id));

  // Available partner countries for treaties
  const potentialPartners = allCountries.filter((c) => c.id !== country.id);

  const handleCreateTreatySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetCountryId || !onSignTreaty) return;
    onSignTreaty(country.id, selectedTargetCountryId, selectedTreatyType);
    setShowTreatyForm(false);
    setSelectedTargetCountryId('');
  };

  return (
    <div
      id="country-inspector-drawer"
      className="w-full sm:w-96 md:w-[430px] bg-white/95 border-l border-slate-200 flex flex-col h-full z-20 shadow-2xl backdrop-blur-md overflow-hidden text-slate-800 select-none animate-in slide-in-from-right duration-200"
    >
      {/* Sovereign Header Banner */}
      <div
        className="p-5 relative border-b border-slate-200/90 shrink-0"
        style={{
          background: `linear-gradient(135deg, ${country.color}15 0%, #ffffff 100%)`,
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          title="关闭档案"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5 pr-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md border border-white/40"
            style={{ backgroundColor: country.color }}
          >
            <EmblemIcon name={country.flagEmblem} size={26} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
                {country.code}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {country.regime}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-1 truncate">
              {country.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              简称：<span className="text-slate-800 font-bold">{country.shortName}</span> · 创联历{' '}
              {country.foundedYear} 年建国
            </p>
          </div>
        </div>

        {/* Creator Actions Toolbar */}
        {userRole === 'creator' && (
          <div className="flex items-center gap-1.5 mt-3.5 pt-3 border-t border-slate-200/70">
            <button
              onClick={() => onStartPaintingTerritory(country.id)}
              className="flex-1 py-1.5 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              title="使用画笔划定此国控制的地块"
            >
              <Brush className="w-3.5 h-3.5 text-indigo-600" />
              <span>疆域画笔</span>
            </button>

            <button
              onClick={() => onEditCountry(country)}
              className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition shadow-2xs"
              title="编辑国名、元首与国徽"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>修改</span>
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
              title="注销国家主权"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Warning */}
      {showDeleteConfirm && (
        <div className="p-4 bg-rose-50 border-b border-rose-200 text-xs text-rose-900 animate-in fade-in duration-100">
          <div className="flex items-center gap-2 font-bold mb-1">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>确认注销【{country.name}】的国家主权？</span>
          </div>
          <p className="text-[11px] text-rose-700 mb-3">
            注销后，该国所有包含的 {country.controlledTileIds.length} 个地块将立即解体为中立地带。
          </p>
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1 rounded-lg bg-white border border-rose-200 text-slate-700 text-xs font-medium"
            >
              取消
            </button>
            <button
              onClick={() => {
                onDeleteCountry(country.id);
                setShowDeleteConfirm(false);
              }}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
            >
              确认注销
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-slate-200 bg-slate-50 px-2 shrink-0">
        {[
          { key: 'overview', label: '国家概况', icon: FileText },
          { key: 'provinces', label: `行省 (${controlledTiles.length})`, icon: MapPin },
          { key: 'treaties', label: '外交条约', icon: HeartHandshake },
          { key: 'doctrines', label: '战略国策', icon: Sparkles },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as TabKey)}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold border-b-2 transition ${
                isActive
                  ? 'border-indigo-600 text-indigo-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-in fade-in duration-100">
            {/* Leadership & Capital Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-600" />
                  国家法定首都
                </span>
                <span className="font-bold text-slate-900 text-sm">{country.capital}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-indigo-600" />
                  元首 / 执政长官
                </span>
                <span className="font-bold text-slate-900">{country.leader}</span>
              </div>
              <div className="pt-2 border-t border-slate-200/80">
                <span className="text-[11px] text-slate-400 block mb-0.5">核心国策思潮</span>
                <span className="font-semibold text-slate-700">{country.ideology}</span>
              </div>
            </div>

            {/* Core Power Indicators Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <span className="text-[11px] text-slate-500 block mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  国家总人口
                </span>
                <div className="text-base font-bold font-mono text-slate-900">
                  {country.population.toLocaleString()} <span className="text-xs font-normal text-slate-500">万人</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <span className="text-[11px] text-slate-500 block mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  综合经济指数
                </span>
                <div className="text-base font-bold font-mono text-emerald-700">
                  {country.gdpIndex.toLocaleString()} <span className="text-xs font-normal text-slate-500">亿点</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <span className="text-[11px] text-slate-500 block mb-1 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  军事防御实力
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold font-mono text-blue-700">
                    {country.militaryStrength}
                  </span>
                  <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${country.militaryStrength}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <span className="text-[11px] text-slate-500 block mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  内部稳定度
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold font-mono text-indigo-700">
                    {country.stability}%
                  </span>
                  <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${country.stability}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Resources & Infrastructure Breakdown */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-2.5">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                国家战略储备与产业指标
              </h3>

              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                    创联源晶储量
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {country.resources.crystal.toLocaleString()} 晶格
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Factory className="w-3.5 h-3.5 text-indigo-600" />
                    工业制造实力
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {country.resources.industry.toLocaleString()} 指数
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Wheat className="w-3.5 h-3.5 text-amber-500" />
                    农业丰足产出
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {country.resources.agriculture.toLocaleString()} 吨
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    战略能源储备
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {country.resources.energy.toLocaleString()} 兆焦
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-teal-600" />
                    全境交通基建
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {country.resources.infrastructure.toLocaleString()} 级
                  </span>
                </div>
              </div>
            </div>

            {/* Country Description */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
              <span className="text-[11px] text-slate-400 font-bold block mb-1">国家概况与历史沿革</span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {country.description || '暂无详细历史概述。'}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Provinces List */}
        {activeTab === 'provinces' && (
          <div className="space-y-2.5 animate-in fade-in duration-100">
            <div className="flex justify-between items-center text-xs text-slate-500 px-1">
              <span>共辖下 {controlledTiles.length} 个省区地块</span>
              <span>点击可高亮定位</span>
            </div>

            {controlledTiles.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400">
                <MapPin className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p>当前未划入任何疆域地块</p>
                {userRole === 'creator' && (
                  <button
                    onClick={() => onStartPaintingTerritory(country.id)}
                    className="mt-2 text-indigo-600 font-bold text-xs underline"
                  >
                    立即开启疆域画笔
                  </button>
                )}
              </div>
            ) : (
              controlledTiles.map((tile) => (
                <div
                  key={tile.id}
                  onClick={() => onSelectTile(tile.id)}
                  className="bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-300 rounded-xl p-3 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{tile.name}</span>
                      {tile.isCapitalCity && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                          首都
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {tile.regionZone} · 人口 {tile.basePopulation} 万 · 工业 {tile.baseIndustry}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                    {tile.id}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Diplomacy & Treaties */}
        {activeTab === 'treaties' && (
          <div className="space-y-3 animate-in fade-in duration-100">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900">双边外交条约与多边盟约</span>
              {userRole === 'creator' && !showTreatyForm && (
                <button
                  onClick={() => setShowTreatyForm(true)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>缔结新条约</span>
                </button>
              )}
            </div>

            {/* Form to sign treaty */}
            {showTreatyForm && (
              <form onSubmit={handleCreateTreatySubmit} className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-3.5 space-y-3">
                <div className="font-bold text-indigo-900 text-xs">缔结新外交协定</div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600">签约对象主权国家</label>
                  <select
                    value={selectedTargetCountryId}
                    onChange={(e) => setSelectedTargetCountryId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                    required
                  >
                    <option value="">-- 选择签约国 --</option>
                    {potentialPartners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.shortName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600">条约类型</label>
                  <select
                    value={selectedTreatyType}
                    onChange={(e) => setSelectedTreatyType(e.target.value as TreatyType)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    {TREATY_OPTIONS.map((t) => (
                      <option key={t.type} value={t.type}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowTreatyForm(false)}
                    className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                  >
                    签署生效
                  </button>
                </div>
              </form>
            )}

            {/* Active treaties list */}
            {(!country.treaties || country.treaties.length === 0) ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400">
                <HeartHandshake className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p>当前未签署任何正式双边条约</p>
              </div>
            ) : (
              country.treaties.map((treaty) => {
                const partner = allCountries.find((c) => c.id === treaty.targetCountryId);
                return (
                  <div
                    key={treaty.id}
                    className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <HeartHandshake className="w-3.5 h-3.5 text-indigo-600" />
                        {treaty.type}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700">
                        历 {treaty.signedYear} 年签署
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      签约盟约方：<span className="font-bold text-slate-800">{partner?.name || '未知签约邦'}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{treaty.description}</p>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 4: Strategic Doctrines */}
        {activeTab === 'doctrines' && (
          <div className="space-y-3 animate-in fade-in duration-100">
            <div className="text-slate-600 text-xs">
              国家当前核心战略国策（决定产业红利与国防导向）：
            </div>

            <div className="space-y-2">
              {DOCTRINE_OPTIONS.map((doc) => {
                const isCurrent = country.activeDoctrine === doc.id;
                return (
                  <div
                    key={doc.id}
                    className={`p-3 rounded-2xl border transition ${
                      isCurrent
                        ? 'bg-indigo-50/80 border-indigo-500 ring-1 ring-indigo-500/30'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        {isCurrent && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                        {doc.name}
                      </span>
                      {userRole === 'creator' && !isCurrent && onUpdateCountryDoctrine && (
                        <button
                          onClick={() => onUpdateCountryDoctrine(country.id, doc.id)}
                          className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition"
                        >
                          切换确立
                        </button>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-600 text-white">
                          已贯彻执行
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{doc.desc}</p>
                    <div className="mt-1.5 pt-1 border-t border-slate-200/60 text-[11px] font-semibold text-indigo-700">
                      效益：{doc.effect}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
