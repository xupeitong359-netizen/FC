import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Compass,
  MapPin,
  Star,
  Info,
  Shield,
  Eye,
  Crosshair,
  Filter,
  Activity,
  Building2,
  Navigation,
  Globe2,
} from 'lucide-react';
import { Country, MapViewMode, TerritoryTile, UserRole } from '../types';
import { EmblemIcon } from './EmblemIcon';

interface WorldMapProps {
  territories: TerritoryTile[];
  countries: Country[];
  selectedCountryId: string | null;
  selectedTileId: string | null;
  onSelectCountry: (countryId: string | null) => void;
  onSelectTile: (tileId: string | null) => void;
  userRole: UserRole;
  isPaintingMode: boolean;
  paintingCountryId: string | null;
  onToggleTileOwnership?: (tileId: string) => void;
  searchQuery: string;
}

export const WorldMap: React.FC<WorldMapProps> = ({
  territories,
  countries,
  selectedCountryId,
  selectedTileId,
  onSelectCountry,
  onSelectTile,
  userRole,
  isPaintingMode,
  paintingCountryId,
  onToggleTileOwnership,
  searchQuery,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<MapViewMode>('political');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showLegend, setShowLegend] = useState<boolean>(true);

  // Pan & Zoom state
  const [transform, setTransform] = useState<{ x: number; y: number; k: number }>({
    x: 0,
    y: 0,
    k: 1,
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hover state for tooltip
  const [hoveredTile, setHoveredTile] = useState<TerritoryTile | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Country lookup map for fast O(1) query
  const countryMap = useMemo(() => {
    const map = new Map<string, Country>();
    countries.forEach((c) => map.set(c.id, c));
    return map;
  }, [countries]);

  const activePaintingCountry = useMemo(() => {
    if (!paintingCountryId) return null;
    return countryMap.get(paintingCountryId) || null;
  }, [paintingCountryId, countryMap]);

  // Handle Zoom
  const handleZoom = (delta: number) => {
    setTransform((prev) => {
      const newK = Math.min(3.5, Math.max(0.6, prev.k + delta));
      return { ...prev, k: newK };
    });
  };

  const handleResetView = () => {
    setTransform({ x: 0, y: 0, k: 1 });
  };

  const handleFocusPinkContinent = () => {
    setTransform({ x: -80, y: -40, k: 1.4 });
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.15 : -0.15;
    handleZoom(zoomFactor);
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with left mouse button when not clicking interactive elements
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Filter matched tiles based on search query
  const matchedTileIds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return territories
      .filter((t) => {
        const country = t.countryId ? countryMap.get(t.countryId) : null;
        return (
          t.name.toLowerCase().includes(q) ||
          (t.capitalName && t.capitalName.toLowerCase().includes(q)) ||
          (country &&
            (country.name.toLowerCase().includes(q) ||
              country.shortName.toLowerCase().includes(q) ||
              country.leader.toLowerCase().includes(q) ||
              country.regime.toLowerCase().includes(q)))
        );
      })
      .map((t) => t.id);
  }, [searchQuery, territories, countryMap]);

  // Color generator based on view mode
  const getTileFill = (tile: TerritoryTile) => {
    const isMatched = matchedTileIds.includes(tile.id);
    const isSelected = selectedTileId === tile.id;
    const isCountrySelected =
      selectedCountryId && tile.countryId && selectedCountryId === tile.countryId;

    if (viewMode === 'political') {
      if (!tile.countryId) {
        return '#f1f5f9'; // Neutral unassigned tile (slate-100)
      }
      const country = countryMap.get(tile.countryId);
      if (!country) return '#f1f5f9';

      if (isPaintingMode && paintingCountryId) {
        if (tile.countryId === paintingCountryId) {
          return country.color;
        }
        return `${country.color}40`; // Dim other countries
      }

      if (selectedCountryId && tile.countryId !== selectedCountryId) {
        return `${country.color}60`; // Soft dim when another country is selected
      }

      return country.color;
    }

    if (viewMode === 'terrain') {
      switch (tile.terrain) {
        case 'plains':
          return '#86efac'; // Emerald-300
        case 'hills':
          return '#fde047'; // Yellow-300
        case 'mountains':
          return '#cbd5e1'; // Slate-300
        case 'coastal':
          return '#93c5fd'; // Blue-300
        case 'islands':
          return '#67e8f9'; // Cyan-300
        case 'basin':
          return '#fbcfe8'; // Pink-200
        case 'desert':
          return '#fed7aa'; // Orange-200
        default:
          return '#e2e8f0';
      }
    }

    if (viewMode === 'zones') {
      switch (tile.regionZone) {
        case '粉陆本土':
          return '#f472b6'; // Rose pink
        case '绯霞东海':
          return '#fb7185'; // Coral
        case '苍蓝外海':
          return '#38bdf8'; // Sky
        case '暮光群岛':
          return '#a78bfa'; // Purple
        case '北境霜原':
          return '#818cf8'; // Indigo ice
        case '赤荒南陆':
          return '#fb923c'; // Amber
        default:
          return '#94a3b8';
      }
    }

    if (viewMode === 'population') {
      const pop = tile.basePopulation;
      if (pop > 3500) return '#4338ca'; // High
      if (pop > 2500) return '#6366f1';
      if (pop > 1500) return '#818cf8';
      if (pop > 800) return '#a5b4fc';
      return '#c7d2fe'; // Low
    }

    if (viewMode === 'infrastructure') {
      const ind = tile.baseIndustry;
      if (ind > 800) return '#047857'; // High industry
      if (ind > 500) return '#10b981';
      if (ind > 300) return '#34d399';
      return '#a7f3d0';
    }

    return '#e2e8f0';
  };

  // Handle tile click
  const handleTileClick = (tile: TerritoryTile, e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPaintingMode && onToggleTileOwnership) {
      onToggleTileOwnership(tile.id);
      return;
    }

    onSelectTile(tile.id);
    if (tile.countryId) {
      onSelectCountry(tile.countryId);
    } else {
      onSelectCountry(null);
    }
  };

  return (
    <div
      ref={containerRef}
      id="world-map-container"
      className="flex-1 relative bg-slate-100 overflow-hidden select-none cursor-grab active:cursor-grabbing flex flex-col justify-between"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top View Mode Switcher Pill */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-sm text-xs">
        {[
          { id: 'political', label: '政治势力', icon: Globe2 },
          { id: 'terrain', label: '地理地貌', icon: Compass },
          { id: 'zones', label: '大区板块', icon: Layers },
          { id: 'population', label: '人口分布', icon: Activity },
          { id: 'infrastructure', label: '工业基建', icon: Building2 },
        ].map((mode) => {
          const Icon = mode.icon;
          const isActive = viewMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as MapViewMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Top Right Quick Map Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={handleFocusPinkContinent}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
          title="将视角快速聚焦于粉陆本土核心区"
        >
          <Navigation className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">聚焦粉陆</span>
        </button>

        <div className="flex items-center bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-1 shadow-sm gap-1">
          <button
            onClick={() => handleZoom(0.2)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            title="放大地图"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-0.2)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            title="缩小地图"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            title="重置缩放与视角"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main SVG Vector Canvas */}
      <svg
        id="world-vector-svg"
        viewBox="0 0 1000 600"
        className="w-full h-full block"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
          transformOrigin: '500px 300px',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        <defs>
          {/* Subtle Grid Pattern */}
          <pattern id="light-grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.5" opacity="0.4" />
          </pattern>

          {/* Sea Wave Flow Gradient */}
          <linearGradient id="sea-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="50%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>

          {/* Highlight Filter for Selected State */}
          <filter id="tile-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#4f46e5" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Ocean Background Canvas */}
        <rect width="1000" height="600" fill="url(#sea-gradient)" />
        {showGrid && <rect width="1000" height="600" fill="url(#light-grid-pattern)" />}

        {/* Ocean Lat/Long Coordinate Lines & Labels */}
        <g className="ocean-coordinates" opacity="0.4" stroke="#94a3b8" strokeDasharray="3,3" strokeWidth="0.5">
          <line x1="0" y1="300" x2="1000" y2="300" />
          <line x1="500" y1="0" x2="500" y2="600" />
          <circle cx="500" cy="300" r="280" fill="none" />
        </g>

        {/* Oceanic Watermark Labels */}
        <g className="ocean-labels pointer-events-none" fill="#94a3b8" fontSize="13" fontWeight="600" letterSpacing="4">
          <text x="720" y="240" textAnchor="middle" opacity="0.6">
            绯 霞 东 海
          </text>
          <text x="140" y="380" textAnchor="middle" opacity="0.6">
            苍 蓝 外 海
          </text>
          <text x="500" y="90" textAnchor="middle" opacity="0.6">
            北 境 冰 洋
          </text>
          <text x="820" y="520" textAnchor="middle" opacity="0.6">
            南 洋 熔 晶 海 沟
          </text>
        </g>

        {/* All Province Territory Tiles */}
        <g id="territories-layer">
          {territories.map((tile) => {
            const isHovered = hoveredTile?.id === tile.id;
            const isSelected = selectedTileId === tile.id;
            const isMatched = matchedTileIds.includes(tile.id);
            const country = tile.countryId ? countryMap.get(tile.countryId) : null;
            const fill = getTileFill(tile);

            return (
              <g
                key={tile.id}
                className="territory-tile-group cursor-pointer transition-all duration-150"
                onClick={(e) => handleTileClick(tile, e)}
                onMouseEnter={() => setHoveredTile(tile)}
                onMouseLeave={() => setHoveredTile(null)}
              >
                {/* Main Territory SVG Polygon Path */}
                <path
                  d={tile.path}
                  fill={fill}
                  fillOpacity={viewMode === 'political' ? 0.9 : 0.85}
                  stroke={
                    isSelected
                      ? '#4f46e5'
                      : isMatched
                      ? '#f59e0b'
                      : isHovered
                      ? '#1e293b'
                      : country
                      ? '#ffffff'
                      : '#cbd5e1'
                  }
                  strokeWidth={isSelected ? 2.5 : isMatched ? 2 : isHovered ? 1.8 : 1}
                  strokeLinejoin="round"
                  filter={isSelected ? 'url(#tile-glow)' : undefined}
                  className="hover:opacity-95 transition-opacity"
                />

                {/* Capital Star Icon & Marker */}
                {tile.isCapitalCity && (
                  <g transform={`translate(${tile.center[0]}, ${tile.center[1] - 8})`} className="pointer-events-none">
                    <circle cx="0" cy="0" r="8" fill="#ffffff" stroke="#e11d48" strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="4.5" fill="#e11d48" />
                  </g>
                )}

                {/* Province Name Label */}
                {showLabels && (
                  <text
                    x={tile.center[0]}
                    y={tile.isCapitalCity ? tile.center[1] + 12 : tile.center[1] + 4}
                    textAnchor="middle"
                    className="pointer-events-none select-none font-medium"
                    fill={viewMode === 'political' && country ? '#ffffff' : '#334155'}
                    fontSize={tile.isCapitalCity ? '10' : '9'}
                    fontWeight={tile.isCapitalCity ? '700' : '600'}
                    style={{
                      textShadow:
                        viewMode === 'political' && country
                          ? '0px 1px 2px rgba(0,0,0,0.6)'
                          : '0px 1px 2px rgba(255,255,255,0.9)',
                    }}
                  >
                    {tile.name}
                  </text>
                )}

                {/* Capital City Name Tag */}
                {showLabels && tile.isCapitalCity && tile.capitalName && (
                  <text
                    x={tile.center[0]}
                    y={tile.center[1] + 23}
                    textAnchor="middle"
                    className="pointer-events-none select-none font-bold"
                    fill="#e11d48"
                    fontSize="9"
                    style={{ textShadow: '0 0 3px #ffffff, 0 0 3px #ffffff' }}
                  >
                    ★ {tile.capitalName}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Hover Province Tooltip */}
      {hoveredTile && !isDragging && (
        <div
          id="territory-hover-tooltip"
          className="absolute z-30 pointer-events-none bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-3 shadow-xl text-slate-800 text-xs w-64 animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: Math.min(window.innerWidth - 300, mousePos.x + 16),
            top: Math.min(window.innerHeight - 200, mousePos.y + 16),
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-bold text-slate-900 text-sm">{hoveredTile.name}</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
              {hoveredTile.id}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500">所属主权：</span>
              {hoveredTile.countryId ? (
                (() => {
                  const country = countryMap.get(hoveredTile.countryId);
                  return country ? (
                    <span className="font-semibold flex items-center gap-1" style={{ color: country.color }}>
                      <EmblemIcon name={country.flagEmblem} size={12} />
                      {country.name}
                    </span>
                  ) : (
                    <span className="text-slate-400">未知政权</span>
                  );
                })()
              ) : (
                <span className="text-slate-500 font-medium">中立开拓荒野</span>
              )}
            </div>

            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">地理板块：</span>
              <span className="font-medium text-slate-700">{hoveredTile.regionZone}</span>
            </div>

            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">地形类型：</span>
              <span className="font-medium text-slate-700">
                {hoveredTile.terrain === 'plains' && '沃野平原'}
                {hoveredTile.terrain === 'hills' && '丘陵高地'}
                {hoveredTile.terrain === 'mountains' && '险峻山脉'}
                {hoveredTile.terrain === 'coastal' && '沿海半岛'}
                {hoveredTile.terrain === 'islands' && '外海群岛'}
                {hoveredTile.terrain === 'basin' && '肥沃盆地'}
                {hoveredTile.terrain === 'desert' && '赤荒砂原'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-slate-100 text-[10px] text-slate-600">
              <div>
                人口：<span className="font-bold text-slate-800">{hoveredTile.basePopulation} 万人</span>
              </div>
              <div>
                工业：<span className="font-bold text-slate-800">{hoveredTile.baseIndustry} 点</span>
              </div>
            </div>

            {hoveredTile.isCapitalCity && (
              <div className="mt-1.5 px-2 py-1 rounded bg-rose-50 text-rose-700 text-[11px] font-bold flex items-center gap-1 border border-rose-200">
                <Star className="w-3 h-3 fill-rose-500 text-rose-500" />
                <span>国家法定首都所在地（{hoveredTile.capitalName}）</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Floating Legend Bar */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 z-20 hidden lg:flex items-center gap-3 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl px-3.5 py-2 shadow-sm text-xs text-slate-700">
          <span className="font-bold text-slate-900 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-indigo-600" />
            图例说明：
          </span>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
              首都星标
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
              主权疆界
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 border border-slate-300" />
              中立地带
            </span>
          </div>

          <div className="h-3.5 w-px bg-slate-200" />

          <button
            onClick={() => setShowLabels((prev) => !prev)}
            className={`text-[11px] px-2 py-0.5 rounded-lg border transition ${
              showLabels
                ? 'bg-slate-100 text-slate-900 border-slate-300 font-semibold'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            {showLabels ? '隐藏地名' : '显示地名'}
          </button>
          <button
            onClick={() => setShowGrid((prev) => !prev)}
            className={`text-[11px] px-2 py-0.5 rounded-lg border transition ${
              showGrid
                ? 'bg-slate-100 text-slate-900 border-slate-300 font-semibold'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            {showGrid ? '隐藏网格' : '显示网格'}
          </button>
        </div>
      )}
    </div>
  );
};
