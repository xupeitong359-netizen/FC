import React, { useState, useMemo } from 'react';
import {
  X,
  ListFilter,
  PlusCircle,
  Search,
  Building,
  Users,
  TrendingUp,
  Layers,
  ArrowUpDown,
  Compass,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { Country, TerritoryTile, UserRole } from '../types';
import { EmblemIcon } from './EmblemIcon';

interface CountryListSidebarProps {
  countries: Country[];
  territories: TerritoryTile[];
  selectedCountryId: string | null;
  userRole: UserRole;
  onSelectCountry: (countryId: string) => void;
  onClose: () => void;
  onOpenCreateCountryModal: () => void;
}

type SortField = 'tiles' | 'pop' | 'gdp' | 'year';

export const CountryListSidebar: React.FC<CountryListSidebarProps> = ({
  countries,
  territories,
  selectedCountryId,
  userRole,
  onSelectCountry,
  onClose,
  onOpenCreateCountryModal,
}) => {
  const [filterText, setFilterText] = useState<string>('');
  const [selectedRegime, setSelectedRegime] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('tiles');

  // Filter & sort
  const filteredCountries = useMemo(() => {
    let list = [...countries];

    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.shortName.toLowerCase().includes(q) ||
          c.capital.toLowerCase().includes(q) ||
          c.leader.toLowerCase().includes(q) ||
          c.regime.toLowerCase().includes(q)
      );
    }

    if (selectedRegime !== 'all') {
      list = list.filter((c) => c.regime === selectedRegime);
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case 'tiles':
          return b.controlledTileIds.length - a.controlledTileIds.length;
        case 'pop':
          return b.population - a.population;
        case 'gdp':
          return b.gdpIndex - a.gdpIndex;
        case 'year':
          return a.foundedYear - b.foundedYear;
        default:
          return 0;
      }
    });

    return list;
  }, [countries, filterText, selectedRegime, sortBy]);

  // Unique regimes for filter dropdown
  const allRegimes = useMemo(() => {
    const set = new Set<string>();
    countries.forEach((c) => set.add(c.regime));
    return Array.from(set);
  }, [countries]);

  return (
    <div
      id="countries-directory-sidebar"
      className="w-full sm:w-80 md:w-[380px] bg-white/95 border-r border-slate-200 flex flex-col h-full z-20 shadow-2xl backdrop-blur-md overflow-hidden text-slate-800 select-none animate-in slide-in-from-left duration-200"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-2xs">
            <ListFilter className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              全球主权国家总表
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                {countries.length} 邦国
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">主权实体数据与综合国力排行</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {userRole === 'creator' && (
            <button
              onClick={onOpenCreateCountryModal}
              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
              title="创立新主权国家"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/50 space-y-2 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="筛选国家、首都或执政官..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Regime Filter */}
          <select
            value={selectedRegime}
            onChange={(e) => setSelectedRegime(e.target.value)}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 shadow-2xs"
          >
            <option value="all">全部宪制政体</option>
            {allRegimes.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortField)}
            className="bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 shadow-2xs font-medium"
          >
            <option value="tiles">按控制疆域</option>
            <option value="pop">按总人口</option>
            <option value="gdp">按经济指数</option>
            <option value="year">按建国历史</option>
          </select>
        </div>
      </div>

      {/* Country Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredCountries.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            未搜索到符合条件的粉陆
          </div>
        ) : (
          filteredCountries.map((c) => {
            const isSelected = selectedCountryId === c.id;
            return (
              <div
                key={c.id}
                onClick={() => onSelectCountry(c.id)}
                className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between group ${
                  isSelected
                    ? 'bg-indigo-50/80 border-indigo-500 ring-1 ring-indigo-500/30'
                    : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs border border-white/40"
                    style={{ backgroundColor: c.color }}
                  >
                    <EmblemIcon name={c.flagEmblem} size={20} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-xs truncate">{c.name}</span>
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                        {c.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                      <span>首府：{c.capital}</span>
                      <span>·</span>
                      <span>{c.regime}</span>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-600">
                      <span className="font-semibold text-indigo-700">
                        {c.controlledTileIds.length} 格地块
                      </span>
                      <span>人口 {c.population} 万</span>
                      <span className="text-emerald-700 font-medium">
                        GDP {c.gdpIndex} 亿
                      </span>
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
