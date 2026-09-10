import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import mapGeoData from '../assets/hoi4_fixed_map.json';
import { motion, AnimatePresence } from 'motion/react';
import {
 Globe,
 ZoomIn,
 ZoomOut,
 RotateCcw,
 MapPin,
 Landmark,
 Swords,
 Crown,
 Layers,
 Eye,
 EyeOff,
 Pin,
 PinOff,
 Hammer,
 ChevronUp,
 ChevronDown,
 Info,
 AlertTriangle,
 Shield,
 Crosshair,
 Zap,
 Flame,
 Navigation,
 Clock3,
 Compass,
 CheckCircle2,
 LandPlot,
 ShieldCheck,
 Sparkles,
 X,
 Sun,
 Moon,
 Contrast,
 Boxes,
 Maximize2,
 Minimize2,
} from 'lucide-react';
import * as d3Geo from 'd3-geo';
import { Nation, ProvinceData } from '../types';
import { getNationFontOption } from '../lib/nationFonts';
import { workspaceService, WorkspaceGlobalSettings } from '../services/workspaceService';
import { renderEmblemIcon } from '../lib/icons';
import { api } from '../services/api';
import { isTodayUsed, isProvinceAdjacentToNation, getValidExpansionProvinceIds, getValidCreationProvinceIds, initMapIndex } from '../lib/mapAdjacency';
import {
 MAP_THEMES,
 MapVisualTheme,
 MapThemeConfig,
 getSavedMapTheme,
 saveMapTheme,
 toModernMapColor,
} from '../lib/mapThemes';
import { useAppSettings, updateAppSettings, formatGeoName } from '../services/settingsService';
import { computeDynamicCountryLabels } from '../lib/countryLabelEngine';
import { computeNationalBorders } from '../lib/nationalBorderEngine';
import {
 STRATEGIC_RESOURCES,
 StrategicResourceType,
 getProvinceResourceDeposits,
 calculateNationResourceOverview,
} from '../lib/strategicCommandEngine';

// Modern GIS Data Chip Theme Colors (low saturation, refined, distinct)
const RESOURCE_CHIP_COLORS: Record<StrategicResourceType, string> = {
 oil: '#334155',
 steel: '#64748b',
 aluminium: '#0284c7',
 rubber: '#059669',
 tungsten: '#d97706',
 chromium: '#7c3aed',
};

// Modern GIS Data Chip Theme Colors & Vector Paths
const RESOURCE_ICON_PATHS: Record<StrategicResourceType, string> = {
 oil: 'M411 68.31v.7c0 25.9-53.6 46.99-155 46.99-106.5 0-155-21.09-155-46.99v-1.2c0-15 16.7-26.9 49.7-35.3 28.2-7.2 65.6-11.1 105.3-11.1 39.6 0 77 3.9 105.3 11.1 33 8.4 49.7 20.3 49.7 35.3zm-177-.5c0-4.2-13.2-7.5-29.4-7.5-16.3 0-29.5 3.3-29.5 7.5 0 4.1 13.2 7.5 29.5 7.5 16.2 0 29.4-3.4 29.4-7.5zm167.6 97.89v-60.2c-8.7 6.6-21.9 12.2-39.6 16.7-28.5 7.3-66.1 11.2-106 11.2-39.9 0-77.5-4-106-11.2-17.7-4.5-30.9-10-39.6-16.7v60.2c-6.3 5.3-9.4 11.2-9.4 17.7v1.1c0 25.9 48.5 46.9 155 46.9 101.4 0 155-21 155-46.9v-1.1c0-6.5-3.1-12.4-9.4-17.7zm0 128.9v-73.5c-8.7 6.6-21.9 12.2-39.6 16.7-28.5 7.2-66.1 11.2-106 11.2-39.9 0-77.5-4-106-11.2-17.7-4.5-30.9-10.1-39.6-16.7v73.5c-6.3 5.3-9.4 11.2-9.4 17.7v.9c0 25.9 48.5 46.9 155 46.9 101.4 0 155-21 155-46.9v-.9c0-6.6-3.1-12.5-9.4-17.7zm8.9 145.4c-1.1-4.9-4-9.4-8.9-13.5V350c-8.7 6.6-21.9 12.2-39.6 16.7-28.5 7.2-66.1 11.2-106 11.2-39.9 0-77.5-4-106-11.2-17.7-4.5-30.9-10.1-39.6-16.7v76.5c-4.9 4.1-7.8 8.6-8.9 13.5-.3 1.2-.5 2.5-.5 3.7v.5c0 5.7 2.3 10.9 7 15.6 17 18 64.8 30.8 148 30.8 60.2 0 103.6-7.4 128.9-18.9 17.3-7.5 26.1-16.6 26.1-27.5v-.5c0-1.2-.2-2.5-.5-3.7z',
 steel: 'M83 203h192c4.4 0 8 3.6 8 8v24c0 4.4-3.6 8-8 8h-60v144h60c4.4 0 8 3.6 8 8v24c0 4.4-3.6 8-8 8H83c-4.4 0-8-3.6-8-8v-24c0-4.4 3.6-8 8-8h60V243H83c-4.4 0-8-3.6-8-8v-24c0-4.4 3.6-8 8-8zM91 193L235 85h192L283 193H91zm198 16l144-108v28L289 237v-28zm-68 42l144-108v132L221 383V251zm0 136l144-108h54L275 387h-54zm68 6l144-108v28L289 421v-28z',
 aluminium: 'M322.248 85.684L61.432 224.717l-41.145 109.94 7.233 3.85 153.673 81.8 308.495-164.215-37.752-99.903-129.688-70.506zm119.035 95.187l25.11 66.45-102.56 54.594L430.39 186.64l10.893-5.77zm-89.576 47.417L284.957 343.9l-41.67 22.182 72.195-118.62 36.225-19.175zM72.38 248.78l28.21 14.933-54.012 54.012L72.38 248.78zm210.827 15.767L211.19 382.87l.26.16-17.208 9.16 5.795-83.618 83.17-44.025zm-165.334 8.312l16.963 8.98-60.445 60.445-16.93-9.012 60.413-60.414zM181.42 306.9l-6.174 89.07-54.1-28.798 60.274-60.272z',
 rubber: 'M256 21A235 235 0 0 0 21 256a235 235 0 0 0 235 235 235 235 0 0 0 235-235A235 235 0 0 0 256 21zm0 82c84.393 0 153 68.607 153 153s-68.607 153-153 153-153-68.607-153-153 68.607-153 153-153zm0 18c-20.417 0-39.757 4.52-57.09 12.602C210.457 166.482 230.218 208 256 208c25.823 0 44.926-41.65 56.752-74.555C295.505 125.462 276.284 121 256 121zm98.752 42.88c-27.714 21.143-61.142 52.79-53.17 77.327 7.981 24.564 53.508 29.858 88.459 30.936.628-5.294.959-10.678.959-16.143 0-35.642-13.755-68.012-36.248-92.12zm-197.729.243C134.663 188.204 121 220.477 121 256c0 5.55.34 11.018.988 16.39 34.833-.825 80.381-6.793 88.344-31.3 7.974-24.542-25.68-55.553-53.309-76.967zm70.188 43.643a9 9 0 0 0-5.035 1.714 9 9 0 0 0-1.99 12.57 9 9 0 0 0 12.57 1.993 9 9 0 0 0 1.992-12.572 9 9 0 0 0-7.537-3.705zm57.578 0a9 9 0 0 0-.637.004 9 9 0 0 0-6.9 3.7 9 9 0 0 0 1.992 12.573 9 9 0 0 0 12.57-1.992 9 9 0 0 0-1.99-12.57 9 9 0 0 0-5.035-1.715zM256 224a32 32 0 0 0-32 32 32 32 0 0 0 32 32 32 32 0 0 0 32-32 32 32 0 0 0-32-32zm-46.297 38.037a9 9 0 0 0-2.652.44 9 9 0 0 0-5.78 11.341 9 9 0 0 0 11.34 5.778 9 9 0 0 0 5.78-11.34 9 9 0 0 0-8.688-6.219zm92.856.008a9 9 0 0 0-8.95 6.21 9 9 0 0 0 5.78 11.34 9 9 0 0 0 11.34-5.777 9 9 0 0 0-5.78-11.341 9 9 0 0 0-2.39-.432zm-92.143 27.713c-21.59.104-50.24 16.832-72.424 31.928 19.029 34.168 52.46 59.164 92.143 66.837 9.99-33.39 18.42-78.618-2.446-93.777-4.854-3.527-10.737-5.02-17.273-4.988zm91.016.02c-6.58 0-12.492 1.516-17.346 5.042-20.895 15.181-11.863 60.106-2.088 93.678 39.687-7.715 73.108-32.76 92.1-66.973-22.006-15.224-50.935-31.747-72.666-31.748zM256 295.58a9 9 0 0 0-9 9 9 9 0 0 0 9 9 9 9 0 0 0 9-9 9 9 0 0 0-9-9z',
 tungsten: 'M344.578 493.54l-117.214-2.024L118.9 338.536l14.355-51.353 35.264 9.38 40.145 42.033-17.467-59.874 23.836-35.358-42.748-104.034 43.165-79.45 72.434 22.468 46.26 80.46-29.474 5-38.478-35.017 22.568 48.064-.672 37.364-26.09 18.224 34.95 1.284 47.145 23.835 28.75-27.874 38.488 19.057 10.647 37.578-18.97-13.784-78.166 39.967-44.983-15.39 5.86-27.153-42.766 3.274 23.573 11.913-9.49 22.943 58.037 31.285 20.34 79.423-15.45 34.73 29.397-20.36 66.83-9.438-71.61 65.81zm-158.524-3.538l-53.48-2.296 27.663-64.006 34.38 49.695-8.563 16.607zm-86.78-37.04l-11.08-34.875-35.503-10.204 34.858-11.09 10.212-35.5 11.09 34.855 35.502 10.22-34.857 11.082-10.22 35.51zm252.983-33.208l-21.565-84.228 72.042-38.99 53.683 59.322-18.665 52.23-85.495 11.666zM169.47 280.677l-59.133-15.612-20.298-69.16 66.064-37.45 36.94 84.126-23.573 38.097zm172.106-38.972l-38.385-19.66 1.574-38.86 43.607-9.917 26.753 39.296-33.547 29.14zm58.845-47.23l-14.234-45.425-46.14-13.46 45.41-14.262 13.46-46.132 14.252 45.41 46.14 13.478-45.41 14.235-13.477 46.156zM327.01 124.9l-28.666-56.762-28.972-7.96 22.645-41.718 29.312 14.278 17.84 59.542-12.16 32.62z',
 chromium: 'M263.563 19.063l-53.875 59.562v90.063l-34.75-60.188-35.563-17.594-9.344 43.53 48.376 83.783-19.97-5.345-28.75 10.5 19.658 23.5 30.28 8.125-59.155 15.844-23.407 27.97 34.25 12.498 66.875-17.937-27.875 48.28 5.562 62.72 33.813-15.72v33.126l46.812 66.626 46.78-66.625v-72.81l21.626 68.092 35.875 27.344 13.564-43.03-32.688-102.97 42.875 11.5 26.876-13.78-17.78-20.22-64.595-17.312-.092-.25 82.25-22.03 21.125-24.064-31.97-16.406-73.656 19.75 39-67.594-3.562-55.25-58.844 18.97V78.624l-39.717-59.563zm-5.72 109.562l22.438 115.03 39.876 12.032-39.875 12.032-22.436 115.03-22.375-114.53-41.595-12.533 41.594-12.53 22.374-114.532z',
};
import {
 TacticalCivFactoryIcon,
 TacticalMilFactoryIcon,
 TacticalDockyardIcon,
 TacticalInfraIcon,
 TacticalAirbaseIcon,
 TacticalRadarIcon,
 TacticalFortressIcon,
 TacticalAntiAirIcon,
 TacticalRefineryIcon,
 TacticalRocketIcon,
 TacticalNuclearIcon,
 TacticalSupplyHubIcon,
 TacticalLightningIcon,
 TacticalSlotBoxIcon,
} from '../lib/tacticalIcons';
import { ProvinceDetailPanel } from './ProvinceDetailPanel';
import { getProvinceChineseName } from '../lib/provinceTranslations';
import { getProvinceTerrain } from '../lib/terrainEngine';
import { getProvinceCivilianFactories, getTotalCivilianFactories } from '../lib/economyEngine';
import { getProvinceMilitaryFactories } from '../lib/militaryIndustry';
import { remoteState } from '../services/remoteState';
import { GeopoliticalFactionsSidebar } from './GeopoliticalFactionsSidebar';
import {
 STRATEGIC_BUILDINGS,
 StrategicBuildingType,
 calculateBuildingUpgradeCost,
 getMaxLevelForBuilding,
 getInfrastructureBonus,
 getTotalBuildingsInProvince,
 MAX_BUILDINGS_PER_PROVINCE,
 RADAR_TECH_TIERS,
 getBuildingLevelAndPercentage,
 getConstructionHeatmapColor,
} from '../lib/constructionRules';

interface WorldMapProps {
 nations: Nation[];
 onSelectNation: (nation: Nation) => void;
 onOpenDiplomacy: (nation: Nation) => void;
 targetNationToFocus?: Nation | null;
 clearTargetNationFocus?: () => void;
 onOpenConstruction?: () => void;
 constructionPlacementBuilding?: StrategicBuildingType | null;
 onCancelConstructionPlacement?: () => void;
 onChangeConstructionBuilding?: (b: StrategicBuildingType) => void;
 myNation?: Nation | null;
 onBuildInProvince?: (provinceId: string | number, provinceName: string, buildingType: StrategicBuildingType) => void;
 onOpenDispute?: (targetNation: Nation, provinceName: string) => void;
 onOpenArmyCommand?: () => void;
 onOpenResources?: () => void;
 onToggleFullscreen?: () => void;
 isFullscreen?: boolean;
 workspaceHighlightNationId?: string | null;
 onProvinceClick?: (province: { id: string | number; name: string; properties: any; ownerNation?: Nation | null }) => void;
 isBoxSelectMode?: boolean;
 onBoxSelectProvinces?: (provinces: { id: string | number; name: string; properties: any }[]) => void;
 isWorkspaceEditor?: boolean;
 mapMode?: MapModeType;
 layerSettings?: {
  showCountryName?: boolean;
  showProvinceName?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
 };
 globalSettings?: WorkspaceGlobalSettings;
}

// Built-in simplified world landmasses GeoJSON coordinates for fallback
const DEFAULT_WORLD_GEOJSON: any = {
 type: 'FeatureCollection',
 features: [
  {
   type: 'Feature',
   properties: { name: 'Eurasia & Africa', region: 'World' },
   geometry: {
    type: 'Polygon',
    coordinates: [
     [
      [-10, 35], [0, 40], [10, 45], [30, 42], [40, 45], [60, 40], [80, 50], [120, 55], [140, 50], [140, 30],
      [120, 20], [105, 10], [90, 22], [75, 10], [60, 25], [50, 15], [45, 12], [40, 0], [35, -20], [20, -34],
      [15, -30], [10, -5], [-15, 12], [-17, 20], [-10, 35]
     ],
    ],
   },
  },
  {
   type: 'Feature',
   properties: { name: 'North America', region: 'Americas' },
   geometry: {
    type: 'Polygon',
    coordinates: [
     [
      [-165, 65], [-140, 70], [-90, 75], [-60, 50], [-70, 40], [-80, 25], [-90, 18], [-105, 22], [-120, 35],
      [-130, 50], [-165, 65]
     ],
    ],
   },
  },
  {
   type: 'Feature',
   properties: { name: 'South America', region: 'Americas' },
   geometry: {
    type: 'Polygon',
    coordinates: [
     [
      [-80, 10], [-60, 5], [-35, -5], [-40, -22], [-55, -38], [-70, -55], [-75, -45], [-70, -20], [-80, 10]
     ],
    ],
   },
  },
  {
   type: 'Feature',
   properties: { name: 'Australia', region: 'Oceania' },
   geometry: {
    type: 'Polygon',
    coordinates: [
     [
      [115, -22], [130, -12], [145, -15], [150, -25], [145, -38], [130, -35], [115, -34], [115, -22]
     ],
    ],
   },
  },
 ],
};

// Low-saturation historical map pigments. National source colors remain untouched in data.
function toMilitaryMapColor(color?: string) {
 const value = (color || '#687381').replace('#', '');
 if (!/^[0-9a-fA-F]{6}$/.test(value)) return '#5d6874';
 const r = parseInt(value.slice(0, 2), 16) / 255;
 const g = parseInt(value.slice(2, 4), 16) / 255;
 const b = parseInt(value.slice(4, 6), 16) / 255;
 const max = Math.max(r, g, b);
 const min = Math.min(r, g, b);
 const delta = max - min;
 let hue = 0;
 if (delta) {
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue *= 60;
  if (hue < 0) hue += 360;
 }
 const lightness = (max + min) / 2;
 const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
 // Pigments deliberately compress both saturation and highlights into an archival military palette.
 return `hsl(${Math.round(hue)} ${Math.round(Math.min(42, saturation * 100 * 0.46))}% ${Math.round(Math.min(52, Math.max(28, lightness * 100 * 0.78)))}%)`;
}

type PixelPoint = [number, number];
const projectedRingCache = new WeakMap<object, { projection: any; rings: PixelPoint[][] }>();

function pointInRing(point: PixelPoint, ring: PixelPoint[]) {
 let inside = false;
 for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
  const [xi, yi] = ring[i];
  const [xj, yj] = ring[j];
  const intersects = ((yi > point[1]) !== (yj > point[1])) && point[0] < ((xj - xi) * (point[1] - yi)) / ((yj - yi) || 0.000001) + xi;
  if (intersects) inside = !inside;
 }
 return inside;
}

function distanceToSegment(point: PixelPoint, a: PixelPoint, b: PixelPoint) {
 const dx = b[0] - a[0];
 const dy = b[1] - a[1];
 const lengthSquared = dx * dx + dy * dy || 1;
 const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / lengthSquared));
 return Math.hypot(point[0] - (a[0] + t * dx), point[1] - (a[1] + t * dy));
}

function projectedRings(feature: any, projection: any): PixelPoint[][] {
 const geometry = feature?.geometry;
 if (!geometry?.coordinates) return [];
 const cached = projectedRingCache.get(geometry);
 if (cached?.projection === projection) return cached.rings;
 const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates.flat() : [];
 const rings = polygons.map((ring: any[]) => ring.map((coordinate) => projection(coordinate)).filter(Boolean) as PixelPoint[]).filter((ring) => ring.length > 2);
 projectedRingCache.set(geometry, { projection, rings });
 return rings;
}

function pointInsideFeature(point: PixelPoint, feature: any, projection: any) {
 const rings = projectedRings(feature, projection);
 if (!rings.length || !pointInRing(point, rings[0])) return false;
 // Additional rings are treated as holes for the usual polygon case.
 return !rings.slice(1).some((ring) => pointInRing(point, ring));
}

function interiorDistance(point: PixelPoint, feature: any, projection: any) {
 const rings = projectedRings(feature, projection);
 let nearest = Infinity;
 rings.forEach((ring) => ring.forEach((vertex, index) => {
  nearest = Math.min(nearest, distanceToSegment(point, vertex, ring[(index + 1) % ring.length]));
 }));
 return nearest;
}

// High-performance memoized province path renderer for 1000+ features
export type MapModeType = 'political' | 'industrial' | 'resources' | 'population' | 'terrain' | 'diplomatic' | 'military';

interface ProvincePathProps {
 pathD: string;
 stateId: any;
 name: string;
 properties: any;
 ownerNation?: Nation | null;
 isPreviewed: boolean;
 isCapitalPreview: boolean;
 previewFlagColor?: string;
 isHovered: boolean;
 isSelected?: boolean;
 mapTheme: MapVisualTheme;
 themeConfig: MapThemeConfig;
 isMyProvince?: boolean;
 isConstructionMode?: boolean;
 isUnderConstruction?: boolean;
 constructionPercent?: number;
 constructionHeatColor?: string;
 constructionColor?: string;
 mapMode?: MapModeType;
 isPeacefulExpansionMode?: boolean;
 isValidExpansionTarget?: boolean;
 isCreationMode?: boolean;
 isValidCreationTarget?: boolean;
 isNonCore?: boolean;
 workspaceHighlightNationId?: string | null;
 onHover: (id: any, props: any) => void;
 onUnhover: () => void;
 onClick: (id: any, name: string, properties: any) => void;
}

const MemoizedProvincePath = memo(function MemoizedProvincePath({
 pathD,
 stateId,
 name,
 properties,
 ownerNation,
 isPreviewed,
 isCapitalPreview,
 previewFlagColor = '#6366f1',
 isHovered,
 isSelected = false,
 mapTheme,
 themeConfig,
 isMyProvince = false,
 isConstructionMode = false,
 isUnderConstruction = false,
 constructionPercent = 0,
 constructionHeatColor,
 constructionColor = '#f59e0b',
 mapMode = 'political',
 isPeacefulExpansionMode = false,
 isValidExpansionTarget = false,
 isCreationMode = false,
 isValidCreationTarget = false,
 isNonCore = false,
 workspaceHighlightNationId,
 onHover,
 onUnhover,
 onClick,
}: ProvincePathProps) {
 let fill = themeConfig.land;
 let stroke = themeConfig.provinceBorder;
 let strokeWidth = 0.38;
 let strokeOpacity = 0.58;
 let fillOpacity = 1;

 const provRecord = ownerNation?.provinces?.find(
  (p) =>
   String(p.id) === String(stateId) ||
   (p.name && String(p.name).trim().toLowerCase() === String(name).trim().toLowerCase())
 );

 if (isCapitalPreview) {
  fill = previewFlagColor;
  stroke = '#ffffff';
  strokeWidth = 1.6;
  strokeOpacity = 1;
 } else if (isPreviewed) {
  fill = `${previewFlagColor}D9`;
  stroke = '#ffffff';
  strokeWidth = 1.0;
  strokeOpacity = 0.85;
 } else if (isSelected) {
  // Clear, elegant selection highlight
  fill = themeConfig.selectionHighlight;
  stroke = themeConfig.selectionStroke;
  strokeWidth = 1.8;
  strokeOpacity = 1;
 } else if (isPeacefulExpansionMode) {
  if (isMyProvince) {
   fill = toModernMapColor(ownerNation?.flagColor || '#4f46e5', mapTheme);
   stroke = '#10b981';
   strokeWidth = 0.8;
   strokeOpacity = 0.9;
   fillOpacity = 0.95;
  } else if (isValidExpansionTarget) {
   fill = isHovered ? 'rgba(52, 211, 153, 0.75)' : 'rgba(16, 185, 129, 0.35)';
   stroke = isHovered ? '#ffffff' : '#10b981';
   strokeWidth = isHovered ? 2.0 : 1.2;
   strokeOpacity = 1;
  } else if (ownerNation) {
   fill = `${toModernMapColor(ownerNation.flagColor, mapTheme)}60`;
   stroke = isHovered ? '#f87171' : themeConfig.countryBorder;
   strokeWidth = isHovered ? 0.9 : 0.32;
   strokeOpacity = 0.6;
  } else if (isHovered) {
   fill = 'rgba(239, 68, 68, 0.2)';
   stroke = '#f87171';
   strokeWidth = 1.0;
   strokeOpacity = 0.9;
  }
 } else if (isCreationMode) {
  if (ownerNation) {
   fill = `${toModernMapColor(ownerNation.flagColor, mapTheme)}50`;
   stroke = isHovered ? '#f87171' : themeConfig.countryBorder;
   strokeWidth = isHovered ? 0.9 : 0.32;
   strokeOpacity = 0.6;
  } else if (isValidCreationTarget) {
   fill = isHovered ? `${previewFlagColor}4D` : 'rgba(99, 102, 241, 0.15)';
   stroke = isHovered ? '#ffffff' : `${previewFlagColor}B3`;
   strokeWidth = isHovered ? 1.8 : 0.85;
   strokeOpacity = 0.95;
  } else if (isHovered) {
   fill = 'rgba(239, 68, 68, 0.18)';
   stroke = '#f87171';
   strokeWidth = 1.2;
   strokeOpacity = 0.9;
  }
 } else if (isConstructionMode) {
  if (isMyProvince) {
   if (isUnderConstruction) {
    fill = 'url(#construction-green-stripes)';
    stroke = '#22c55e';
    strokeWidth = isHovered ? 2.2 : 1.6;
    strokeOpacity = 1;
   } else {
    const baseHeatColor = constructionHeatColor || getConstructionHeatmapColor(constructionPercent);
    fill = isHovered ? '#fef08a' : baseHeatColor;
    stroke = isHovered ? '#ffffff' : (constructionColor || '#38bdf8');
    strokeWidth = isHovered ? 1.8 : 1.0;
    strokeOpacity = 1;
   }
  } else if (ownerNation) {
   fill = `${toModernMapColor(ownerNation.flagColor, mapTheme)}60`;
   stroke = isHovered ? '#f87171' : themeConfig.countryBorder;
   strokeWidth = isHovered ? 0.9 : 0.32;
   strokeOpacity = 0.6;
  } else if (isHovered) {
   fill = 'rgba(239, 68, 68, 0.15)';
   stroke = '#f87171';
   strokeWidth = 0.9;
   strokeOpacity = 0.85;
  }
 } else if (mapMode === 'population') {
  // 人口专题地图：无论是否建国，全图所有省份均统一按人口规模阶梯着色
  const pop =
   (provRecord?.population as number) ??
   (provRecord?.manpower as number) ??
   (properties?.manpower as number) ??
   (properties?.population as number) ??
   1500000;

  if (pop >= 6000000) {
   fill = '#064e3b'; // 极高/超大城市 (Emerald-900)
  } else if (pop >= 3500000) {
   fill = '#047857'; // 高人口稠密区 (Emerald-700)
  } else if (pop >= 1800000) {
   fill = '#059669'; // 中高密度 (Emerald-600)
  } else if (pop >= 900000) {
   fill = '#10b981'; // 中等人口 (Emerald-500)
  } else if (pop >= 400000) {
   fill = '#34d399'; // 低密度 (Emerald-400)
  } else if (pop >= 150000) {
   fill = '#6ee7b7'; // 稀疏地块 (Emerald-300)
  } else {
   fill = '#a7f3d0'; // 极低/旷野 (Emerald-200)
  }
  fillOpacity = isHovered ? 1 : 0.88;
  stroke = isHovered ? themeConfig.hoverLandStroke : '#047857';
  strokeWidth = isHovered ? 1.1 : 0.42;
  strokeOpacity = isHovered ? 0.95 : 0.62;
 } else if (mapMode === 'industrial') {
  // 工业产能专题地图：统计民用与军工总产能
  const civ = provRecord ? getProvinceCivilianFactories(provRecord) : (properties?.civilianFactories || 0);
  const mil = provRecord ? getProvinceMilitaryFactories(provRecord) : (properties?.militaryFactories || 0);
  const totalIC = civ + mil;
  if (totalIC >= 6) {
   fill = '#15803d'; // 重工业枢纽: 饱满绿
  } else if (totalIC >= 3) {
   fill = '#2563eb'; // 中型工业区: 工业蓝
  } else if (totalIC >= 1) {
   fill = '#d97706'; // 初级工业: 琥珀金
  } else {
   fill = mapTheme === 'white' ? '#e2e8f0' : '#1e293b'; // 无工业产能
  }
  fillOpacity = isHovered ? 1 : 0.88;
  stroke = isHovered ? themeConfig.hoverLandStroke : themeConfig.provinceBorder;
  strokeWidth = isHovered ? 1.1 : 0.42;
  strokeOpacity = isHovered ? 0.95 : 0.62;
 } else if (mapMode === 'resources') {
  // 战略资源专题地图：根据省份主导战略资源类型与储量着色
  const rawDeposits = (provRecord?.resources && Object.keys(provRecord.resources).length > 0)
   ? provRecord.resources
   : getProvinceResourceDeposits(stateId, name, properties);
  const activeDeposits = (Object.keys(rawDeposits) as StrategicResourceType[])
   .filter((k) => Boolean(rawDeposits[k] && rawDeposits[k]! > 0))
   .map((k) => ({ type: k, amount: rawDeposits[k]! }));
  const totalAmount = activeDeposits.reduce((s, r) => s + (r.amount || 0), 0);
  const primaryRes = activeDeposits.length > 0
   ? [...activeDeposits].sort((a, b) => (b.amount || 0) - (a.amount || 0))[0]
   : null;

  if (totalAmount > 0 && primaryRes) {
   const resDef = STRATEGIC_RESOURCES[primaryRes.type];
   fill = resDef?.color || '#3b82f6';
   fillOpacity = isHovered ? 1 : Math.min(0.85, 0.4 + (totalAmount / 70) * 0.45);
  } else {
   fill = mapTheme === 'white' ? '#f1f5f9' : '#141c2b';
   fillOpacity = 0.85;
  }
  stroke = isHovered ? themeConfig.hoverLandStroke : themeConfig.provinceBorder;
  strokeWidth = isHovered ? 1.1 : 0.42;
  strokeOpacity = isHovered ? 0.95 : 0.62;
 } else if (mapMode === 'terrain') {
  // 自然地理地形专题地图
  const terrain = getProvinceTerrain(stateId, name, properties);
  fill = terrain.mapFill;
  fillOpacity = isHovered ? 0.96 : 0.82;
  stroke = isHovered ? themeConfig.hoverLandStroke : themeConfig.provinceBorder;
  strokeWidth = isHovered ? 1.1 : 0.42;
  strokeOpacity = isHovered ? 0.95 : 0.62;
 } else if (ownerNation) {
  // 经典政务/主权/战线地图模式：建国领土按主权国旗底色渲染（支持创作者自定义独立地块颜色）
  const effectiveNationTerritoryColor = provRecord?.colorHex || ownerNation.flagColor;
  fill = toModernMapColor(effectiveNationTerritoryColor, mapTheme);
  if (workspaceHighlightNationId) {
   if (ownerNation.id === workspaceHighlightNationId) {
    // 当前选中国家使用饱满真实的代表色，内部省界保持中性辅助线
    fillOpacity = isHovered ? 0.95 : 0.85;
    stroke = isHovered ? '#ffffff' : themeConfig.provinceBorder;
    strokeWidth = isHovered ? 0.85 : 0.38;
    strokeOpacity = isHovered ? 0.95 : 0.58;
   } else {
    // 其他已创建国家使用低对比度柔和颜色显示，内部省界保持中性辅助
    fillOpacity = isHovered ? 0.60 : 0.42;
    stroke = isHovered ? themeConfig.hoverLandStroke : themeConfig.provinceBorder;
    strokeWidth = isHovered ? 0.75 : 0.38;
    strokeOpacity = isHovered ? 0.85 : 0.52;
   }
  } else {
   // HOI4 半透明自然涂层：透出底色质感
   fillOpacity = isHovered
    ? (mapTheme === 'white' ? 0.88 : 0.95)
    : isNonCore
    ? (mapTheme === 'white' ? 0.52 : 0.65)
    : (mapTheme === 'white' ? 0.64 : 0.82);
   // 国家内部的省份省界辅助线：采用 #A7C58F，线宽细化至 0.38px 并降低对比权重
   stroke = isHovered ? themeConfig.hoverLandStroke : themeConfig.provinceBorder;
   strokeWidth = isHovered ? 0.85 : 0.38;
   strokeOpacity = isHovered ? 0.90 : 0.58;
  }
 } else if (workspaceHighlightNationId) {
  // 工作区未归属省份：与全局中立陆地统一使用 #DCECCF 底色与 #A7C58F 辅助省界
  fill = isHovered ? (mapTheme === 'white' ? '#EAF4E0' : '#1E293B') : (mapTheme === 'white' ? themeConfig.land : '#141c2b');
  stroke = isHovered ? (mapTheme === 'white' ? themeConfig.countryBorder : '#64748B') : themeConfig.provinceBorder;
  strokeWidth = isHovered ? 0.75 : 0.38;
  strokeOpacity = isHovered ? 0.9 : 0.58;
  fillOpacity = 1;
 } else if (isHovered) {
  fill = themeConfig.hoverLandFill;
  stroke = themeConfig.hoverLandStroke;
  strokeWidth = 1.0;
  strokeOpacity = 0.95;
 }

 return (
  <g>
   {/* If under construction, draw base heat color first so stripes overlay on top */}
   {isConstructionMode && isMyProvince && isUnderConstruction && (
    <path
     d={pathD}
     fill={constructionHeatColor || '#059669'}
     stroke="none"
     vectorEffect="non-scaling-stroke"
    />
   )}
   <path
    d={pathD}
    fill={fill}
    fillOpacity={fillOpacity}
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeOpacity={strokeOpacity}
    fillRule="evenodd"
    strokeLinejoin="round"
    strokeLinecap="round"
    vectorEffect="non-scaling-stroke"
    className="cursor-pointer"
    style={{
     transition: 'fill 400ms cubic-bezier(0.4, 0, 0.2, 1), stroke 400ms cubic-bezier(0.4, 0, 0.2, 1), fill-opacity 200ms ease',
    }}
    onMouseEnter={() => onHover(stateId, { ...(properties || {}), id: stateId, name, ownerNation })}
    onMouseLeave={onUnhover}
    onClick={() => onClick(stateId, name, properties)}
   />
  </g>
 );
});

function getFeaturePixelCenter(feature: any, pathGenerator: any, projection: any): [number, number] | null {
 if (!feature) return null;
 try {
  if (pathGenerator) {
   const c = pathGenerator.centroid(feature);
   if (c && !isNaN(c[0]) && !isNaN(c[1]) && isFinite(c[0]) && isFinite(c[1])) {
    return [c[0], c[1]];
   }
   const b = pathGenerator.bounds(feature);
   if (b && !isNaN(b[0][0]) && !isNaN(b[1][0])) {
    return [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2];
   }
  }
  if (projection) {
   const geoC = d3Geo.geoCentroid(feature);
   if (geoC && !isNaN(geoC[0]) && !isNaN(geoC[1])) {
    const pt = projection(geoC);
    if (pt && !isNaN(pt[0]) && !isNaN(pt[1])) {
     return [pt[0], pt[1]];
    }
   }
  }
 } catch {
  // ignore
 }
 return null;
}

function fallbackHashCoordinate(nation: Nation, width: number, height: number) {
 let hash = 0;
 const seed = (nation.capital || nation.name || 'nation').trim();
 for (let i = 0; i < seed.length; i++) {
  hash = (hash << 5) - hash + seed.charCodeAt(i);
  hash |= 0;
 }
 const x = width * 0.25 + (Math.abs(hash) % (width * 0.5));
 const y = height * 0.25 + (Math.abs(hash * 31) % (height * 0.5));
 return { x, y, provinceName: nation.capital };
}

function findNationCapitalPoint(
 nation: Nation,
 geoData: any,
 pathGenerator: any,
 projection: any,
 width: number,
 height: number
): { x: number; y: number; provinceName?: string } {
 if (!geoData?.features || !pathGenerator) {
  return fallbackHashCoordinate(nation, width, height);
 }

 const features: any[] = geoData.features;
 const capitalStr = (nation.capital || '').trim().toLowerCase();
 const rawCapId = capitalStr.replace(/\D/g, '');

 // 1. Direct match with nation.capital against GeoJSON features
 if (capitalStr) {
  const directMatch = features.find((f: any) => {
   const name = String(f.properties?.name || '').trim().toLowerCase();
   const cnName = String(getProvinceChineseName(f.properties?.name) || '').trim().toLowerCase();
   const stateId = String(f.properties?.stateId ?? f.properties?.id ?? '');
   return (
    name === capitalStr ||
    cnName === capitalStr ||
    (rawCapId && stateId === rawCapId) ||
    name.includes(capitalStr) ||
    capitalStr.includes(name) ||
    (cnName && (cnName.includes(capitalStr) || capitalStr.includes(cnName)))
   );
  });

  if (directMatch) {
   const pt = getFeaturePixelCenter(directMatch, pathGenerator, projection);
   if (pt) return { x: pt[0], y: pt[1], provinceName: getProvinceChineseName(directMatch.properties?.name) || directMatch.properties?.name };
  }
 }

 // 2. Search nation.provinces list
 if (Array.isArray(nation.provinces) && nation.provinces.length > 0) {
  // Find designated capital province or matching province in the nation's owned provinces
  const matchingProv = nation.provinces.find(
   (p) =>
    String(p.name || '').trim().toLowerCase() === capitalStr ||
    String(getProvinceChineseName(p.name) || '').trim().toLowerCase() === capitalStr ||
    String(p.id) === capitalStr ||
    (rawCapId && String(p.id) === rawCapId)
  );

  if (matchingProv) {
   const provFeature = features.find((f: any) => {
    const name = String(f.properties?.name || '').trim().toLowerCase();
    const cnName = String(getProvinceChineseName(f.properties?.name) || '').trim().toLowerCase();
    const stateId = String(f.properties?.stateId ?? f.properties?.id ?? '');
    return (
     (matchingProv.id && stateId === String(matchingProv.id)) ||
     (matchingProv.name && (name === String(matchingProv.name).trim().toLowerCase() || cnName === String(matchingProv.name).trim().toLowerCase()))
    );
   });

   if (provFeature) {
    const pt = getFeaturePixelCenter(provFeature, pathGenerator, projection);
    if (pt) return { x: pt[0], y: pt[1], provinceName: getProvinceChineseName(provFeature.properties?.name) || matchingProv.name };
   }
  }

  // 3. Fallback to the first sovereign province (the core/founding state)
  const firstProv = nation.provinces[0];
  const firstFeature = features.find((f: any) => {
   const name = String(f.properties?.name || '').trim().toLowerCase();
   const cnName = String(getProvinceChineseName(f.properties?.name) || '').trim().toLowerCase();
   const stateId = String(f.properties?.stateId ?? f.properties?.id ?? '');
   return (
    (firstProv.id && stateId === String(firstProv.id)) ||
    (firstProv.name && (name === String(firstProv.name).trim().toLowerCase() || cnName === String(firstProv.name).trim().toLowerCase()))
   );
  });

  if (firstFeature) {
   const pt = getFeaturePixelCenter(firstFeature, pathGenerator, projection);
   if (pt) return { x: pt[0], y: pt[1], provinceName: getProvinceChineseName(firstFeature.properties?.name) || firstProv.name };
  }
 }

 // 4. If mapCoordinates [lng, lat] is specified
 if (
  Array.isArray(nation.mapCoordinates) &&
  nation.mapCoordinates.length === 2 &&
  typeof nation.mapCoordinates[0] === 'number' &&
  typeof nation.mapCoordinates[1] === 'number' &&
  !isNaN(nation.mapCoordinates[0]) &&
  !isNaN(nation.mapCoordinates[1])
 ) {
  try {
   const pt = projection(nation.mapCoordinates);
   if (pt && !isNaN(pt[0]) && !isNaN(pt[1])) {
    return { x: pt[0], y: pt[1], provinceName: nation.capital };
   }
  } catch {
   // ignore
  }
 }

 return fallbackHashCoordinate(nation, width, height);
}

const GAME_DAYS_PER_REAL_DAY = 365;
const MS_PER_HOUR = 60 * 60 * 1000;

function formatCampaignTime(realStartMs: number, nowMs: number) {
 const elapsedGameHours = Math.max(0, Math.floor(((nowMs - realStartMs) / MS_PER_HOUR) * GAME_DAYS_PER_REAL_DAY));
 const year = 1936 + Math.floor(elapsedGameHours / (365 * 24));
 const hourOfYear = elapsedGameHours % (365 * 24);
 let daysLeft = Math.floor(hourOfYear / 24);
 const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
 let month = 0;
 while (month < monthDays.length - 1 && daysLeft >= monthDays[month]) {
  daysLeft -= monthDays[month];
  month += 1;
 }
 const m = String(month + 1).padStart(2, '0');
 const d = String(daysLeft + 1).padStart(2, '0');
 return `${year}.${m}.${d}`;
}

const DEFAULT_EUROPE_VIEW = { zoom: 2.8, pan: { x: -920, y: -270 } };

function deepenColor(color: string): string {
  if (!color) return '#000000';
  
  let h = 0, s = 0, l = 0;
  
  if (color.startsWith('hsl')) {
    const match = color.match(/hsl\(([^,]+),\s*([^%]+)%,\s*([^%]+)%\)/);
    if (match) {
      h = parseFloat(match[1]);
      s = parseFloat(match[2]) / 100;
      l = parseFloat(match[3]) / 100;
    }
  } else {
    let cleanHex = color.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255 || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255 || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255 || 0;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
      h *= 360;
    }
  }

  // Just slightly boost saturation and keep lightness close to original.
  // The 'multiply' blend mode will naturally darken it against the background.
  s = Math.min(1.0, s * 1.15 + 0.1);
  l = Math.max(0.35, l * 0.82);

  return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

export const WorldMap: React.FC<WorldMapProps> = ({
 nations,
 onSelectNation,
 onOpenDiplomacy,
 targetNationToFocus,
 clearTargetNationFocus,
 onOpenConstruction,
 constructionPlacementBuilding,
 onCancelConstructionPlacement,
 onChangeConstructionBuilding,
 myNation,
 onBuildInProvince,
 onOpenDispute,
 onOpenArmyCommand,
 onOpenResources,
 onToggleFullscreen,
 isFullscreen = false,
 workspaceHighlightNationId,
 onProvinceClick,
 isBoxSelectMode = false,
 onBoxSelectProvinces,
 isWorkspaceEditor = false,
 mapMode: propMapMode,
 layerSettings: propLayerSettings,
 globalSettings,
}) => {
 const [boxSelectStart, setBoxSelectStart] = useState<{ x: number; y: number } | null>(null);
 const [boxSelectCurrent, setBoxSelectCurrent] = useState<{ x: number; y: number } | null>(null);
 const [geoData, setGeoData] = useState<any>(null);
 const { settings } = useAppSettings();
 const mapTheme = settings.mapTheme;
 const setMapTheme = (nextTheme: MapVisualTheme) => updateAppSettings({ mapTheme: nextTheme });
 
 // 基于当前选定主题并融合创作者全局设置覆盖 (中立地块、海域水体、国界线条)
 const currentTheme = useMemo(() => {
  const baseTheme = MAP_THEMES[globalSettings?.mapTheme || mapTheme] || MAP_THEMES[mapTheme];
  const merged = { ...baseTheme };
  if (globalSettings?.neutralTerritoryColor) {
   merged.land = globalSettings.neutralTerritoryColor;
  }
  if (globalSettings?.oceanColor) {
   merged.ocean = globalSettings.oceanColor;
   merged.containerBg = globalSettings.oceanColor;
  }
  if (globalSettings?.borderStrokeColor) {
   merged.countryBorder = globalSettings.borderStrokeColor;
  }
  return merged;
 }, [mapTheme, globalSettings]);

 const [internalMapMode, setInternalMapMode] = useState<MapModeType>('political');
 const [internalLayerSettings, setInternalLayerSettings] = useState({
  showCountryName: true,
  showProvinceName: false,
  showGrid: false,
  showLegend: false,
 });

 const mapMode = propMapMode !== undefined ? propMapMode : internalMapMode;
 const setMapMode = setInternalMapMode;

 const effectiveLayerSettings = useMemo(() => ({
  showCountryName: globalSettings?.showNationLabels ?? (propLayerSettings?.showCountryName ?? internalLayerSettings.showCountryName),
  showProvinceName: globalSettings?.showProvinceLabels ?? (propLayerSettings?.showProvinceName ?? internalLayerSettings.showProvinceName),
  showGrid: propLayerSettings?.showGrid ?? internalLayerSettings.showGrid,
  showLegend: propLayerSettings?.showLegend ?? internalLayerSettings.showLegend,
 }), [propLayerSettings, internalLayerSettings, globalSettings]);
 const [isPeacefulExpansion, setIsPeacefulExpansion] = useState(false);
 const [showExpansionInfo, setShowExpansionInfo] = useState(false);
 const [expansionSuccessData, setExpansionSuccessData] = useState<{ provinceName: string; isCore: boolean } | null>(null);
 const [expansionError, setExpansionError] = useState<string | null>(null);
 const [isExpanding, setIsExpanding] = useState(false);
 const [view, setView] = useState(DEFAULT_EUROPE_VIEW);
 const { zoom, pan } = view;

 const [isDragging, setIsDragging] = useState(false);
 const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
 const [hoveredNation, setHoveredNation] = useState<Nation | null>(null);
 const [showNationsDrawer, setShowNationsDrawer] = useState(false);
 const [worldClockStart, setWorldClockStart] = useState<number | null>(null);
 const [campaignNow, setCampaignNow] = useState(() => Date.now());

 // Listen to peaceful expansion toggle events dispatched from mobile bar or other components
 useEffect(() => {
  const handleToggle = () => {
   if (!myNation) {
    setExpansionError('您尚未创建或统治国家，无法执行和平扩张');
    setTimeout(() => setExpansionError(null), 3500);
    return;
   }
   if (isTodayUsed(myNation.lastPeaceExpansionAt, myNation.peaceExpansionCount)) {
    setExpansionError('今日和平扩张次数已用完，请于明日再试');
    setTimeout(() => setExpansionError(null), 3500);
    return;
   }
   setIsPeacefulExpansion((prev) => !prev);
  };
  window.addEventListener('map-toggle-peaceful-expansion', handleToggle);
  return () => window.removeEventListener('map-toggle-peaceful-expansion', handleToggle);
 }, [myNation]);

 // Synchronize peaceful expansion state to other components outside render phase
 useEffect(() => {
  const timer = window.setTimeout(() => {
   window.dispatchEvent(new CustomEvent('map-peaceful-expansion-state', { detail: { active: isPeacefulExpansion } }));
  }, 0);
  return () => window.clearTimeout(timer);
 }, [isPeacefulExpansion]);

 useEffect(() => {
  let mounted = true;
  void remoteState.readSection<number>('worldClockStartedAt')
   .then((startedAt) => {
    if (mounted && typeof startedAt === 'number') setWorldClockStart(startedAt);
   })
   .catch(() => undefined);
  const timer = window.setInterval(() => setCampaignNow(Date.now()), 1000);
  return () => {
   mounted = false;
   window.clearInterval(timer);
  };
 }, []);

 const [hoveredProvinceId, setHoveredProvinceId] = useState<string | number | null>(null);
 const [hoveredProvinceData, setHoveredProvinceData] = useState<any | null>(null);
 const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

 type HoverHUDMode = 'docked' | 'mini' | 'floating' | 'hidden';

 const [hoverHUDMode, setHoverHUDMode] = useState<HoverHUDMode>(() => {
  try {
   const saved = localStorage.getItem('map_hover_hud_mode');
   if (saved === 'docked' || saved === 'mini' || saved === 'floating' || saved === 'hidden') {
    return saved as HoverHUDMode;
   }
  } catch {}
  return 'docked'; // 默认停靠模式，零遮挡光标与领土轮廓
 });

 const updateHoverHUDMode = useCallback((mode: HoverHUDMode) => {
  setHoverHUDMode(mode);
  try {
   localStorage.setItem('map_hover_hud_mode', mode);
  } catch {}
 }, []);
 const [selectedProvince, setSelectedProvince] = useState<{
  id: string | number;
  name: string;
  properties: any;
  ownerNation: Nation | null;
 } | null>(null);

 // Dynamic Grand Strategy Army & Construction status figures
 const totalArmyManpower = useMemo(() => {
  if (!myNation) return 128000;
  const divManpower = myNation.army?.divisions?.reduce((acc, d) => acc + (d.manpower || 0), 0) || 0;
  const reserve = myNation.army?.manpowerReserve || 0;
  const total = divManpower + reserve;
  return total > 0 ? total : 128000;
 }, [myNation]);

 const formattedArmyManpower = useMemo(() => {
  if (totalArmyManpower >= 1000000) {
   return `${(totalArmyManpower / 1000000).toFixed(1)}M`;
  }
  if (totalArmyManpower >= 1000) {
   return `${(totalArmyManpower / 1000).toFixed(0)}K`;
  }
  return `${totalArmyManpower}`;
 }, [totalArmyManpower]);

 const totalCivFactories = useMemo(() => {
  if (!myNation) return 24;
  const total = getTotalCivilianFactories(myNation);
  return total > 0 ? total : 24;
 }, [myNation]);

 const nationalPrestigeOrCount = useMemo(() => {
  if (!myNation) return nations.length || 5;
  return typeof myNation.stability === 'number' ? myNation.stability : (nations.length || 5);
 }, [myNation, nations]);

 // Navigate between provinces (prev / next in precalculatedFeatures)
 const handleNavigateProvince = (direction: 'prev' | 'next') => {
  if (!selectedProvince || precalculatedFeatures.length === 0) return;
  const currentIndex = precalculatedFeatures.findIndex(
   (f) =>
    String(f.stateId) === String(selectedProvince.id) ||
    String(f.name).toLowerCase() === String(selectedProvince.name).toLowerCase()
  );
  if (currentIndex === -1) return;
  const nextIndex =
   direction === 'next'
    ? (currentIndex + 1) % precalculatedFeatures.length
    : (currentIndex - 1 + precalculatedFeatures.length) % precalculatedFeatures.length;
  const targetFeature = precalculatedFeatures[nextIndex];
  if (targetFeature) {
   const ownerNation =
    provinceOwnership.get(targetFeature.stateId) || provinceOwnership.get(targetFeature.name);
   setSelectedProvince({
    id: targetFeature.stateId,
    name: targetFeature.name,
    properties: targetFeature.properties,
    ownerNation: ownerNation || null,
   });
  }
 };

 const [previewState, setPreviewState] = useState<{
  provinces: any[];
  flagColor: string;
  mode: 'territory' | 'capital' | null;
  capital?: string;
 } | null>(null);

 useEffect(() => {
  const handlePreview = (e: any) => {
   setPreviewState(e.detail);
   if (e.detail?.mode === 'territory' || e.detail?.mode === 'capital') {
    setSelectedProvince(null);
   }
  };
  window.addEventListener('map-preview', handlePreview);
  return () => window.removeEventListener('map-preview', handlePreview);
 }, []);

 const isSelectingTerritory = Boolean(
  isWorkspaceEditor ||
  previewState?.mode === 'territory' ||
  previewState?.mode === 'capital' ||
  isPeacefulExpansion ||
  isBoxSelectMode ||
  constructionPlacementBuilding
 );

 const effectiveHUDMode: HoverHUDMode = useMemo(() => {
  if (hoverHUDMode === 'hidden') return 'hidden';
  if (hoverHUDMode === 'mini') return 'mini';
  // 选地划界时坚决不使用 floating，自动采用 docked 停靠模式确保光标视野 100% 通透
  if (isSelectingTerritory && hoverHUDMode === 'floating') {
   return 'docked';
  }
  return hoverHUDMode;
 }, [hoverHUDMode, isSelectingTerritory]);

 const svgRef = useRef<SVGSVGElement>(null);

 useEffect(() => {
  // Direct import prevents a missing static resource from returning Vite's HTML fallback.
  setGeoData((mapGeoData as any)?.features ? (mapGeoData as any) : DEFAULT_WORLD_GEOJSON);
 }, []);

 const width = 900;
 const height = 500;

 // D3 Geo Projection for Pixel Coordinates
 const projection = useMemo(() => {
  if (!geoData) {
   return d3Geo.geoIdentity().translate([width / 2, height / 2]);
  }
  return d3Geo
   .geoIdentity()
   .reflectY(true)
   .fitSize([width, height], geoData);
 }, [width, height, geoData]);

 const pathGenerator = useMemo(() => {
  return d3Geo.geoPath().projection(projection);
 }, [projection]);

 const [clickedConstructionProvinces, setClickedConstructionProvinces] = useState<Set<string>>(new Set());

 // Ephemeral warning shown when a player tries to claim an already-occupied province.
 const [occupiedWarning, setOccupiedWarning] = useState<string | null>(null);
 const occupiedWarningTimer = useRef<number | null>(null);
 useEffect(() => () => {
  if (occupiedWarningTimer.current) window.clearTimeout(occupiedWarningTimer.current);
 }, []);

 useEffect(() => {
  setClickedConstructionProvinces(new Set());
 }, [constructionPlacementBuilding]);

 const containerRef = useRef<HTMLDivElement>(null);
 const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 900, height: 500 });

 useEffect(() => {
  if (!containerRef.current) return;
  const observer = new ResizeObserver((entries) => {
   for (const entry of entries) {
    if (entry.contentRect.width && entry.contentRect.height) {
     setContainerSize({
      width: entry.contentRect.width,
      height: entry.contentRect.height,
     });
    }
   }
  });
  observer.observe(containerRef.current);
  return () => observer.disconnect();
 }, []);

 function ensureFeatureRingsClosed(feature: any): any {
 if (!feature?.geometry?.coordinates) return feature;
 const geomType = feature.geometry.type;
 if (geomType === 'Polygon') {
  const closedCoords = feature.geometry.coordinates.map((ring: any[]) => {
   if (!Array.isArray(ring) || ring.length < 3) return ring;
   const first = ring[0];
   const last = ring[ring.length - 1];
   if (first[0] !== last[0] || first[1] !== last[1]) {
    return [...ring, [first[0], first[1]]];
   }
   return ring;
  });
  return { ...feature, geometry: { ...feature.geometry, coordinates: closedCoords } };
 } else if (geomType === 'MultiPolygon') {
  const closedCoords = feature.geometry.coordinates.map((poly: any[]) => {
   if (!Array.isArray(poly)) return poly;
   return poly.map((ring: any[]) => {
    if (!Array.isArray(ring) || ring.length < 3) return ring;
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
     return [...ring, [first[0], first[1]]];
    }
    return ring;
   });
  });
  return { ...feature, geometry: { ...feature.geometry, coordinates: closedCoords } };
 }
 return feature;
}

// Pre-calculate all 1000+ path strings ONCE for instant 60fps rendering
 const precalculatedFeatures = useMemo(() => {
  if (!geoData?.features || !pathGenerator) return [];
  return geoData.features
   .map((rawFeature: any, idx: number) => {
    const feature = ensureFeatureRingsClosed(rawFeature);
    const pathD = pathGenerator(feature);
    if (!pathD) return null;
    const stateId = feature.properties?.stateId ?? feature.properties?.id ?? idx;
    const rawName = feature.properties?.name || '';
    const name = formatGeoName(rawName, stateId, settings.geoNamingMode, settings.showDebugGeoId);
    const centroid = getFeaturePixelCenter(feature, pathGenerator, projection);
    const bounds = pathGenerator.bounds(feature);
    const area = Math.abs(pathGenerator.area(feature));
    return {
     feature,
     idx,
     pathD,
     stateId,
     name,
     properties: feature.properties || {},
     centroid,
     bounds,
     area,
    };
   })
   .filter(Boolean) as {
    feature: any;
    idx: number;
    pathD: string;
    stateId: any;
    name: string;
    properties: any;
    centroid: [number, number] | null;
    bounds: [[number, number], [number, number]];
    area: number;
   }[];
 }, [geoData, pathGenerator, projection, settings.geoNamingMode, settings.showDebugGeoId]);

 const hoveredFeature = useMemo(() => {
  if (hoveredProvinceId === null && !hoveredProvinceData) return null;
  return precalculatedFeatures.find(
   (f) =>
    (hoveredProvinceId !== null && String(f.stateId) === String(hoveredProvinceId)) ||
    (hoveredProvinceData?.name &&
     String(f.name).trim().toLowerCase() === String(hoveredProvinceData.name).trim().toLowerCase())
  );
 }, [hoveredProvinceId, hoveredProvinceData, precalculatedFeatures]);

 const hoveredScreenPos = useMemo(() => {
  if (!hoveredFeature || !hoveredFeature.centroid) return null;
  const [cx, cy] = hoveredFeature.centroid;
  return {
   x: cx * zoom + pan.x,
   y: cy * zoom + pan.y,
  };
 }, [hoveredFeature, zoom, pan]);

 const [isPinching, setIsPinching] = useState(false);
 const pinchStartDistRef = useRef<number | null>(null);
 const dragStartCoordRef = useRef<{ x: number; y: number } | null>(null);
 const hasDraggedRef = useRef<boolean>(false);
 const wheelFrameRef = useRef<number | null>(null);
 const wheelRatioRef = useRef(1);
 const wheelPointRef = useRef<{ x: number; y: number } | null>(null);

 useEffect(() => () => {
  if (wheelFrameRef.current !== null) cancelAnimationFrame(wheelFrameRef.current);
 }, []);

 const getSvgPoint = (clientX: number, clientY: number) => {
  if (!svgRef.current) return { x: clientX, y: clientY };
  const svg = svgRef.current;
  let pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (ctm) {
   pt = pt.matrixTransform(ctm.inverse());
  }
  return { x: pt.x, y: pt.y };
 };

 const applyZoom = (zoomRatio: number, clientX?: number, clientY?: number) => {
  setView((prevView) => {
   const clampedZoom = Math.min(Math.max(prevView.zoom * zoomRatio, 0.2), 40);
   if (clampedZoom === prevView.zoom) return prevView;

   let svgX = width / 2;
   let svgY = height / 2;

   if (svgRef.current) {
    if (clientX !== undefined && clientY !== undefined) {
     const pt = getSvgPoint(clientX, clientY);
     svgX = pt.x;
     svgY = pt.y;
    } else {
     const rect = svgRef.current.getBoundingClientRect();
     const pt = getSvgPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
     svgX = pt.x;
     svgY = pt.y;
    }
   }

   return {
    zoom: clampedZoom,
    pan: {
     x: svgX - (svgX - prevView.pan.x) * (clampedZoom / prevView.zoom),
     y: svgY - (svgY - prevView.pan.y) * (clampedZoom / prevView.zoom),
    },
   };
  });
 };

 const handleTouchStart = (e: React.TouchEvent) => {
  const targetEl = e.target as HTMLElement | null;
  if (targetEl?.closest('#province-detail-panel, [data-interactive-overlay], .custom-scrollbar, #geopolitical-factions-sidebar, button, input, select, textarea')) {
   return;
  }

  if (isBoxSelectMode && e.touches.length === 1) {
   const pt = getSvgPoint(e.touches[0].clientX, e.touches[0].clientY);
   setBoxSelectStart(pt);
   setBoxSelectCurrent(pt);
   return;
  }

  if (e.touches.length === 1) {
   setIsDragging(true);
   dragStartCoordRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
   hasDraggedRef.current = false;
   const pt = getSvgPoint(e.touches[0].clientX, e.touches[0].clientY);
   setDragStart({ x: pt.x - pan.x, y: pt.y - pan.y });
  } else if (e.touches.length === 2) {
   setIsDragging(false);
   const dist = Math.hypot(
    e.touches[0].clientX - e.touches[1].clientX,
    e.touches[0].clientY - e.touches[1].clientY
   );
   pinchStartDistRef.current = dist;
   setIsPinching(true);
  }
 };

 const handleTouchMove = (e: React.TouchEvent) => {
  if (isBoxSelectMode && boxSelectStart && e.touches.length === 1) {
   const pt = getSvgPoint(e.touches[0].clientX, e.touches[0].clientY);
   setBoxSelectCurrent(pt);
   return;
  }

  if (e.touches.length === 1 && isDragging) {
   if (dragStartCoordRef.current) {
    const dist = Math.hypot(
     e.touches[0].clientX - dragStartCoordRef.current.x,
     e.touches[0].clientY - dragStartCoordRef.current.y
    );
    if (dist > 6) {
     hasDraggedRef.current = true;
    }
   }
   const pt = getSvgPoint(e.touches[0].clientX, e.touches[0].clientY);
   setView((prev) => ({
    ...prev,
    pan: { x: pt.x - dragStart.x, y: pt.y - dragStart.y },
   }));
  } else if (e.touches.length === 2 && isPinching && pinchStartDistRef.current) {
   const dist = Math.hypot(
    e.touches[0].clientX - e.touches[1].clientX,
    e.touches[0].clientY - e.touches[1].clientY
   );
   const ratio = dist / pinchStartDistRef.current;
   if (Math.abs(ratio - 1) > 0.02) {
    const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    applyZoom(ratio, midX, midY);
    pinchStartDistRef.current = dist;
   }
  }
 };

 const handleTouchEnd = () => {
  if (isBoxSelectMode && boxSelectStart && boxSelectCurrent) {
   const minSvgX = Math.min(boxSelectStart.x, boxSelectCurrent.x);
   const maxSvgX = Math.max(boxSelectStart.x, boxSelectCurrent.x);
   const minSvgY = Math.min(boxSelectStart.y, boxSelectCurrent.y);
   const maxSvgY = Math.max(boxSelectStart.y, boxSelectCurrent.y);

   if (Math.abs(maxSvgX - minSvgX) > 6 || Math.abs(maxSvgY - minSvgY) > 6) {
    const geoX0 = (minSvgX - pan.x) / zoom;
    const geoX1 = (maxSvgX - pan.x) / zoom;
    const geoY0 = (minSvgY - pan.y) / zoom;
    const geoY1 = (maxSvgY - pan.y) / zoom;

    const hitFeatures = precalculatedFeatures.filter((item) => {
     if (item.centroid) {
      const [cx, cy] = item.centroid;
      if (cx >= geoX0 && cx <= geoX1 && cy >= geoY0 && cy <= geoY1) return true;
     }
     const [[bx0, by0], [bx1, by1]] = item.bounds;
     return !(bx1 < geoX0 || bx0 > geoX1 || by1 < geoY0 || by0 > geoY1);
    });

    if (hitFeatures.length > 0) {
     onBoxSelectProvinces?.(
      hitFeatures.map((f) => ({
       id: f.stateId,
       name: f.name,
       properties: f.properties,
      }))
     );
    }
   }
   setBoxSelectStart(null);
   setBoxSelectCurrent(null);
   return;
  }

  setIsDragging(false);
  setIsPinching(false);
  pinchStartDistRef.current = null;
  setTimeout(() => {
   hasDraggedRef.current = false;
   dragStartCoordRef.current = null;
  }, 120);
 };

 const handleMouseDown = (e: React.MouseEvent) => {
  if (e.button !== 0) return;
  const targetEl = e.target as HTMLElement | null;
  if (targetEl?.closest('#province-detail-panel, [data-interactive-overlay], .custom-scrollbar, #geopolitical-factions-sidebar, button, input, select, textarea')) {
   return;
  }

  if (isBoxSelectMode) {
   const pt = getSvgPoint(e.clientX, e.clientY);
   setBoxSelectStart(pt);
   setBoxSelectCurrent(pt);
   return;
  }

  setIsDragging(true);
  dragStartCoordRef.current = { x: e.clientX, y: e.clientY };
  hasDraggedRef.current = false;
  const pt = getSvgPoint(e.clientX, e.clientY);
  setDragStart({ x: pt.x - pan.x, y: pt.y - pan.y });
 };

 const handleMouseMove = (e: React.MouseEvent) => {
  if (containerRef.current) {
   const rect = containerRef.current.getBoundingClientRect();
   setMousePos({
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
   });
  }

  if (isBoxSelectMode && boxSelectStart) {
   const pt = getSvgPoint(e.clientX, e.clientY);
   setBoxSelectCurrent(pt);
   return;
  }

  if (!isDragging) return;
  if (dragStartCoordRef.current) {
   const dist = Math.hypot(
    e.clientX - dragStartCoordRef.current.x,
    e.clientY - dragStartCoordRef.current.y
   );
   if (dist > 6) {
    hasDraggedRef.current = true;
   }
  }
  const pt = getSvgPoint(e.clientX, e.clientY);
  setView((prev) => ({
   ...prev,
   pan: { x: pt.x - dragStart.x, y: pt.y - dragStart.y },
  }));
 };

 const handleMouseUp = () => {
  if (isBoxSelectMode && boxSelectStart && boxSelectCurrent) {
   const minSvgX = Math.min(boxSelectStart.x, boxSelectCurrent.x);
   const maxSvgX = Math.max(boxSelectStart.x, boxSelectCurrent.x);
   const minSvgY = Math.min(boxSelectStart.y, boxSelectCurrent.y);
   const maxSvgY = Math.max(boxSelectStart.y, boxSelectCurrent.y);

   if (Math.abs(maxSvgX - minSvgX) > 6 || Math.abs(maxSvgY - minSvgY) > 6) {
    const geoX0 = (minSvgX - pan.x) / zoom;
    const geoX1 = (maxSvgX - pan.x) / zoom;
    const geoY0 = (minSvgY - pan.y) / zoom;
    const geoY1 = (maxSvgY - pan.y) / zoom;

    const hitFeatures = precalculatedFeatures.filter((item) => {
     if (item.centroid) {
      const [cx, cy] = item.centroid;
      if (cx >= geoX0 && cx <= geoX1 && cy >= geoY0 && cy <= geoY1) return true;
     }
     const [[bx0, by0], [bx1, by1]] = item.bounds;
     return !(bx1 < geoX0 || bx0 > geoX1 || by1 < geoY0 || by0 > geoY1);
    });

    if (hitFeatures.length > 0) {
     onBoxSelectProvinces?.(
      hitFeatures.map((f) => ({
       id: f.stateId,
       name: f.name,
       properties: f.properties,
      }))
     );
    }
   }
   setBoxSelectStart(null);
   setBoxSelectCurrent(null);
   return;
  }

  setIsDragging(false);
  setTimeout(() => {
   hasDraggedRef.current = false;
   dragStartCoordRef.current = null;
  }, 120);
 };

 const handleWheel = (e: React.WheelEvent) => {
  const targetEl = e.target as HTMLElement | null;
  if (targetEl?.closest('#province-detail-panel, [data-interactive-overlay], .custom-scrollbar, #geopolitical-factions-sidebar, .overflow-y-auto, .overflow-x-auto')) {
   return;
  }
  e.preventDefault();
  // Trackpads can dispatch far more wheel events than the display can paint. Coalesce their
  // camera updates to one requestAnimationFrame while preserving the accumulated zoom amount.
  wheelRatioRef.current *= e.deltaY < 0 ? 1.15 : 0.85;
  wheelPointRef.current = { x: e.clientX, y: e.clientY };
  if (wheelFrameRef.current !== null) return;
  wheelFrameRef.current = requestAnimationFrame(() => {
   const point = wheelPointRef.current;
   const ratio = wheelRatioRef.current;
   wheelFrameRef.current = null;
   wheelRatioRef.current = 1;
   if (point) applyZoom(ratio, point.x, point.y);
  });
 };

 const oceanColorRef = useRef(currentTheme.ocean);
 oceanColorRef.current = currentTheme.ocean;
 const viewRef = useRef({ pan, zoom });
 viewRef.current = { pan, zoom };

 const handleDownloadPureMap = useCallback((e?: any) => {
  if (!svgRef.current) return;
  try {
   const svgEl = svgRef.current;
   const containerEl = containerRef.current || svgEl.parentElement;
   const containerRect = containerEl?.getBoundingClientRect();
   const exportW = Math.round(containerRect?.width || svgEl.clientWidth || 1920);
   const exportH = Math.round(containerRect?.height || svgEl.clientHeight || 1080);
   const aspect = (exportW / exportH) || (16 / 9);

   // 🌟 解析目标分辨率（支持 4K 极清、2K 超清、8K 巨幅、1080P 高清，默认 4K 3840px）
   let targetW = 3840;
   let resLabel = '4K极清';
   const reqRes = e?.detail?.resolution;
   if (reqRes === '8k') {
    targetW = 7680;
    resLabel = '8K巨幅';
   } else if (reqRes === '4k') {
    targetW = 3840;
    resLabel = '4K极清';
   } else if (reqRes === '2k') {
    targetW = 2560;
    resLabel = '2K超清';
   } else if (reqRes === '1080p') {
    targetW = 1920;
    resLabel = '1080P高清';
   } else if (typeof e?.detail?.scale === 'number') {
    targetW = Math.round(exportW * e.detail.scale);
    resLabel = `${e.detail.scale}x清晰度`;
   } else {
    targetW = Math.max(3840, Math.round(exportW * 2));
    resLabel = '4K极清';
   }
   const targetH = Math.round(targetW / aspect);

   const clone = svgEl.cloneNode(true) as SVGSVGElement;
   clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
   clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
   // 🌟 关键：将 SVG 根节点的尺寸直接设置为高分辨率像素，让浏览器内置矢量光栅器直接以 4K/8K 绘制所有多边形与文字
   clone.setAttribute('width', String(targetW));
   clone.setAttribute('height', String(targetH));
   clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
   clone.setAttribute('preserveAspectRatio', 'xMidYMid meet');

   // 确保主变换层包含标准 SVG transform 属性，适配独立 SVG 图像光栅化
   const currentPan = viewRef.current.pan;
   const currentZoom = viewRef.current.zoom;
   const transformGroup = clone.querySelector('#main-geo-transform-group') as SVGGElement | null;
   if (transformGroup) {
    transformGroup.setAttribute('transform', `translate(${currentPan.x}, ${currentPan.y}) scale(${currentZoom})`);
   }

   // 移除临时框选矩形
   const selectionRects = clone.querySelectorAll('rect[stroke="#4f46e5"]');
   selectionRects.forEach((rect) => rect.remove());

   // 确保在纯净地图最底层填充当前海洋底色
   const oceanColor = oceanColorRef.current || '#0f172a';
   const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
   bgRect.setAttribute('x', '0');
   bgRect.setAttribute('y', '0');
   bgRect.setAttribute('width', String(width));
   bgRect.setAttribute('height', String(height));
   bgRect.setAttribute('fill', oceanColor);
   clone.insertBefore(bgRect, clone.firstChild);

   const serializer = new XMLSerializer();
   const svgString = serializer.serializeToString(clone);

   const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
   const blobURL = URL.createObjectURL(svgBlob);

   const img = new Image();
   img.crossOrigin = 'anonymous';

   img.onload = () => {
    try {
     const canvas = document.createElement('canvas');
     canvas.width = targetW;
     canvas.height = targetH;
     const ctx = canvas.getContext('2d');
     if (!ctx) {
      URL.revokeObjectURL(blobURL);
      window.dispatchEvent(new CustomEvent('map-download-finished', {
       detail: { success: false, error: 'Canvas 初始化失败' }
      }));
      return;
     }

     ctx.imageSmoothingEnabled = true;
     ctx.imageSmoothingQuality = 'high';
     ctx.fillStyle = oceanColor;
     ctx.fillRect(0, 0, targetW, targetH);

     ctx.drawImage(img, 0, 0, targetW, targetH);
     URL.revokeObjectURL(blobURL);

     canvas.toBlob((blob) => {
      if (!blob) {
       window.dispatchEvent(new CustomEvent('map-download-finished', {
        detail: { success: false, error: '生成图片数据失败' }
       }));
       return;
      }
      const targetName = e?.detail?.fileName || `纯净沙盘地图_${resLabel}_${targetW}x${targetH}_${new Date().toISOString().slice(0, 10)}.png`;
      const a = document.createElement('a');
      a.download = targetName;
      a.href = URL.createObjectURL(blob);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);

      window.dispatchEvent(new CustomEvent('map-download-finished', {
       detail: {
        success: true,
        fileName: targetName,
        resolutionName: e?.detail?.resolutionName || resLabel,
        width: targetW,
        height: targetH,
       }
      }));
     }, 'image/png');
    } catch (rasterErr) {
     URL.revokeObjectURL(blobURL);
     console.error('Raster map error:', rasterErr);
     window.dispatchEvent(new CustomEvent('map-download-finished', {
      detail: { success: false, error: '渲染高分辨率地图失败' }
     }));
    }
   };

   img.onerror = (err) => {
    URL.revokeObjectURL(blobURL);
    console.error('Failed to load SVG for export:', err);
    window.dispatchEvent(new CustomEvent('map-download-finished', {
     detail: { success: false, error: '加载矢量地图失败' }
    }));
   };

   img.src = blobURL;
  } catch (err) {
   console.error('Download pure map error:', err);
   window.dispatchEvent(new CustomEvent('map-download-finished', {
    detail: { success: false, error: '导出地图出现异常' }
   }));
  }
 }, []);

 const handleResetView = () => {
  setView(DEFAULT_EUROPE_VIEW);
 };

 useEffect(() => {
  const onZoomIn = () => applyZoom(1.3);
  const onZoomOut = () => applyZoom(0.7);
  const onReset = () => handleResetView();
  const onJumpContinent = (e: any) => {
   if (e.detail?.zoom !== undefined && e.detail?.pan) {
    setView({ zoom: e.detail.zoom, pan: e.detail.pan });
   }
  };
  const onSetLayer = (e: any) => {
   if (e.detail?.mode) {
    setMapMode(e.detail.mode);
   }
   if (e.detail?.settings) {
    setInternalLayerSettings((prev) => ({ ...prev, ...e.detail.settings }));
   }
  };
  const onSetLayerSettings = (e: any) => {
   if (e.detail) {
    setInternalLayerSettings((prev) => ({ ...prev, ...e.detail }));
   }
  };
  const onDownloadMap = (e: any) => {
   handleDownloadPureMap(e);
  };

  window.addEventListener('map-zoom-in', onZoomIn);
  window.addEventListener('map-zoom-out', onZoomOut);
  window.addEventListener('map-reset-view', onReset);
  window.addEventListener('map-jump-continent', onJumpContinent);
  window.addEventListener('map-set-layer', onSetLayer);
  window.addEventListener('map-set-layer-settings', onSetLayerSettings);
  window.addEventListener('map-download-current-view', onDownloadMap);

  return () => {
   window.removeEventListener('map-zoom-in', onZoomIn);
   window.removeEventListener('map-zoom-out', onZoomOut);
   window.removeEventListener('map-reset-view', onReset);
   window.removeEventListener('map-jump-continent', onJumpContinent);
   window.removeEventListener('map-set-layer', onSetLayer);
   window.removeEventListener('map-set-layer-settings', onSetLayerSettings);
   window.removeEventListener('map-download-current-view', onDownloadMap);
  };
 }, [handleDownloadPureMap]);

 const handleNationJump = (nation: Nation) => {
  const pt = findNationCapitalPoint(nation, geoData, pathGenerator, projection, width, height);
  const targetX = pt.x;
  const targetY = pt.y;

  const targetZoom = 3.5;
  setView({
   zoom: targetZoom,
   pan: {
    x: width / 2 - targetX * targetZoom,
    y: height / 2 - targetY * targetZoom,
   },
  });
 };

 useEffect(() => {
  if (targetNationToFocus) {
   handleNationJump(targetNationToFocus);
   clearTargetNationFocus?.();
  }
 }, [targetNationToFocus]);

 // Province ownership map
 const provinceOwnership = useMemo(() => {
  const map = new Map<number | string, Nation>();
  nations.forEach((nation) => {
   (nation.provinces || []).forEach((prov) => {
    if (prov.id) map.set(prov.id, nation);
    if (prov.name) map.set(prov.name, nation);
   });
  });
  return map;
 }, [nations]);

 // 已正式部署的陆军以省份为锚点；训练中与待部署单位不显示在世界地图上。
 const armyProvinceMarkers = useMemo(() => {
  const featureByKey = new Map<string, { centroid: [number, number] | null }>();
  precalculatedFeatures.forEach((feature) => {
   featureByKey.set(String(feature.stateId), feature);
   featureByKey.set(String(feature.name).trim().toLowerCase(), feature);
   if (feature.properties?.originalName) {
    featureByKey.set(String(feature.properties.originalName).trim().toLowerCase(), feature);
   }
  });
  const grouped = new Map<string, { x: number; y: number; divisionCount: number; fightingCount: number; nationName: string }>();

  nations.forEach((nation) => {
   (nation.army?.divisions || []).forEach((division) => {
    if (division.status === 'training' || division.status === 'deploying' || !division.provinceId) return;
    const feature = featureByKey.get(String(division.provinceId)) || featureByKey.get(String(division.provinceName).trim().toLowerCase());
    if (!feature?.centroid) return;
    const key = `${nation.id}:${String(division.provinceId)}`;
    const current = grouped.get(key);
    if (current) {
     current.divisionCount += 1;
     if (division.status === 'fighting') current.fightingCount += 1;
     return;
    }
    grouped.set(key, {
     x: feature.centroid[0],
     y: feature.centroid[1],
     divisionCount: 1,
     fightingCount: division.status === 'fighting' ? 1 : 0,
     nationName: nation.name,
    });
   });
  });
  return [...grouped.values()];
 }, [nations, precalculatedFeatures]);

 const previewedIdsSet = useMemo(() => {
  if (previewState?.mode !== 'territory' || !Array.isArray(previewState.provinces)) {
   return new Set<string>();
  }
  return new Set(previewState.provinces.map((p: any) => String(p.id)));
 }, [previewState]);

 // Nation markers with accurate centroid calculation
 const nationMarkers = useMemo(() => {
  return nations
   .map((nation) => {
    const pt = findNationCapitalPoint(nation, geoData, pathGenerator, projection, width, height);
    return {
     nation,
     x: pt.x,
     y: pt.y,
     provinceName: pt.provinceName,
    };
   })
   .filter(Boolean) as Array<{ nation: Nation; x: number; y: number; provinceName?: string }>;
 }, [nations, geoData, pathGenerator, projection, width, height]);

 // Adaptive Country Label System (HOI4 Grand Strategy Cartographic Labels)
 const countryLabels = useMemo(() => {
  return computeDynamicCountryLabels(
   nations,
   precalculatedFeatures,
   provinceOwnership,
   projection,
   zoom,
   globalSettings?.nationFontScale || 1.0
  );
 }, [nations, precalculatedFeatures, provinceOwnership, projection, zoom, globalSettings?.nationFontScale]);

 // HOI4-Style Layered 3D Sovereign National Borders
 const nationalBorders = useMemo(() => {
  return computeNationalBorders(
   nations,
   precalculatedFeatures,
   provinceOwnership,
   projection
  );
 }, [nations, precalculatedFeatures, provinceOwnership, projection]);

 // 战区集团军编制与战术进攻矛头推演态势
 const [armyGroupPosture, setArmyGroupPosture] = useState<'aggressive' | 'balanced' | 'defensive'>('balanced');
 const [activeOffensiveLaunched, setActiveOffensiveLaunched] = useState<boolean>(false);

 // 提取计算当前所有的交战双方真实接壤边境与前线特效数据 (True Border Contact Zones & Combat Frontlines)
 const activeFrontlines = useMemo(() => {
  const lines: Array<{
   id: string;
   attackerNation: Nation;
   defenderNation: Nation;
   isLandBorder: boolean;
   frontlineProvinceIds: string[];
   contactPairs: Array<{
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    midX: number;
    midY: number;
   }>;
   focusPos: { x: number; y: number };
   isPlayerInvolved: boolean;
   isPlayerAttacker: boolean;
   attackerDivisions: number;
   defenderDivisions: number;
  }> = [];

  if (!nations || nations.length === 0) return lines;
  const mapIdx = initMapIndex();
  const adj = mapIdx.adjacencyMap;

  // 建立国家拥有的省份列表快速索引
  const provincesByNation = new Map<string, typeof precalculatedFeatures>();
  precalculatedFeatures.forEach((feat) => {
   const owner = provinceOwnership.get(feat.stateId) || provinceOwnership.get(feat.name);
   if (owner) {
    let list = provincesByNation.get(owner.id);
    if (!list) {
     list = [];
     provincesByNation.set(owner.id, list);
    }
    list.push(feat);
   }
  });

  const linesByPair = new Map<string, (typeof lines)[number]>();

  nations.forEach((nation) => {
   if (!nation.activeWars || nation.activeWars.length === 0) return;
   nation.activeWars.forEach((war) => {
    const defender = nations.find((n) => n.id === war.withNationId);
    if (!defender) return;

    const pairId = [nation.id, defender.id].sort().join('::');
    if (linesByPair.has(pairId)) return;

    const provsA = provincesByNation.get(nation.id) || [];
    const provsB = provincesByNation.get(defender.id) || [];
    if (provsA.length === 0 || provsB.length === 0) return;

    const provsBMap = new Map<string, (typeof provsB)[number]>();
    provsB.forEach((p) => {
     provsBMap.set(String(p.stateId), p);
     if (p.name) provsBMap.set(String(p.name).trim().toLowerCase(), p);
    });

    const frontlineProvinceSet = new Set<string>();
    const contactPairs: Array<{
     fromX: number;
     fromY: number;
     toX: number;
     toY: number;
     midX: number;
     midY: number;
    }> = [];

    provsA.forEach((pa) => {
     if (!pa.centroid) return;
     const neighbors = adj.get(String(pa.stateId));
     if (!neighbors) return;
     neighbors.forEach((nbrId) => {
      const pb = provsBMap.get(nbrId);
      if (pb && pb.centroid) {
       frontlineProvinceSet.add(String(pa.stateId));
       frontlineProvinceSet.add(String(pb.stateId));
       contactPairs.push({
        fromX: pa.centroid[0],
        fromY: pa.centroid[1],
        toX: pb.centroid[0],
        toY: pb.centroid[1],
        midX: (pa.centroid[0] + pb.centroid[0]) / 2,
        midY: (pa.centroid[1] + pb.centroid[1]) / 2,
       });
      }
     });
    });

    const isLandBorder = contactPairs.length > 0;
    let focusPos = { x: 0, y: 0 };

    if (isLandBorder) {
     const sumX = contactPairs.reduce((acc, c) => acc + c.midX, 0);
     const sumY = contactPairs.reduce((acc, c) => acc + c.midY, 0);
     focusPos = { x: sumX / contactPairs.length, y: sumY / contactPairs.length };
    } else {
     // 双方无直接陆地接壤（跨海或远征战争）：寻找距离最近的一对沿海前哨领土
     let minDist = Infinity;
     let bestA = provsA[0];
     let bestB = provsB[0];
     for (const pa of provsA) {
      if (!pa.centroid) continue;
      for (const pb of provsB) {
       if (!pb.centroid) continue;
       const d = Math.hypot(pa.centroid[0] - pb.centroid[0], pa.centroid[1] - pb.centroid[1]);
       if (d < minDist) {
        minDist = d;
        bestA = pa;
        bestB = pb;
       }
      }
     }
     if (bestA?.centroid && bestB?.centroid) {
      frontlineProvinceSet.add(String(bestA.stateId));
      frontlineProvinceSet.add(String(bestB.stateId));
      contactPairs.push({
       fromX: bestA.centroid[0],
       fromY: bestA.centroid[1],
       toX: bestB.centroid[0],
       toY: bestB.centroid[1],
       midX: (bestA.centroid[0] + bestB.centroid[0]) / 2,
       midY: (bestA.centroid[1] + bestB.centroid[1]) / 2,
      });
      focusPos = {
       x: (bestA.centroid[0] + bestB.centroid[0]) / 2,
       y: (bestA.centroid[1] + bestB.centroid[1]) / 2,
      };
     }
    }

    const isPlayerInvolved = Boolean(
     myNation && (nation.id === myNation.id || defender.id === myNation.id)
    );
    const isPlayerAttacker = Boolean(myNation && nation.id === myNation.id);

    const candidate = {
     id: pairId,
     attackerNation: nation,
     defenderNation: defender,
     isLandBorder,
     frontlineProvinceIds: Array.from(frontlineProvinceSet),
     contactPairs: contactPairs.slice(0, 12),
     focusPos,
     isPlayerInvolved,
     isPlayerAttacker,
     attackerDivisions: Math.max(12, Math.round(nation.territory.split(',').length * 4)),
     defenderDivisions: Math.max(8, Math.round(defender.territory.split(',').length * 3.5)),
    };

    linesByPair.set(pairId, candidate);
   });
  });

  return [...linesByPair.values()].sort((a, b) => {
   if (a.isPlayerInvolved !== b.isPlayerInvolved) return a.isPlayerInvolved ? -1 : 1;
   return a.id.localeCompare(b.id);
  });
 }, [nations, precalculatedFeatures, provinceOwnership, myNation]);

 // 地图默认保留优先战线，前线特效在接壤边境与省份边界上集中呈现
 const displayedFrontlines = useMemo(() => {
  const relevant = mapMode === 'military'
   ? activeFrontlines
   : activeFrontlines.filter((front) => front.isPlayerInvolved || activeFrontlines.length <= 6);
  return relevant.slice(0, mapMode === 'military' ? 10 : 6);
 }, [activeFrontlines, mapMode]);

 // Avoid O(provinces × (queue + owned provinces)) work during every zoom frame.
 // The map paths read this indexed snapshot, so only genuine construction changes rebuild it.
 const constructionByProvince = useMemo(() => {
  const result = new Map<string, { isMyProvince: boolean; isQueued: boolean; percent: number }>();
  if (!myNation) return result;
  const ownByKey = new Map<string, any>();
  (myNation.provinces || []).forEach((province) => {
   if (province.id !== undefined && province.id !== null) ownByKey.set(String(province.id), province);
   if (province.name) ownByKey.set(String(province.name).trim().toLowerCase(), province);
  });
  const queuedKeys = new Set<string>();
  if (constructionPlacementBuilding) {
   (myNation.constructionQueue || []).forEach((queue) => {
    if (queue.buildingType !== constructionPlacementBuilding) return;
    if (queue.provinceId !== undefined && queue.provinceId !== null) queuedKeys.add(String(queue.provinceId));
    if (queue.provinceName) queuedKeys.add(String(queue.provinceName).trim().toLowerCase());
   });
  }
  precalculatedFeatures.forEach(({ stateId, name }) => {
   const idKey = String(stateId);
   const nameKey = String(name).trim().toLowerCase();
   const province = ownByKey.get(idKey) || ownByKey.get(nameKey);
   if (!province) return;
   const percent = constructionPlacementBuilding
    ? getBuildingLevelAndPercentage(constructionPlacementBuilding, province.detailedBuildings || {}, myNation.radarTech || 'decimeter').percent
    : 0;
   result.set(idKey, { isMyProvince: true, isQueued: queuedKeys.has(idKey) || queuedKeys.has(nameKey), percent });
  });
  return result;
 }, [constructionPlacementBuilding, myNation, precalculatedFeatures]);

 const handleProvinceHover = useCallback((id: any, props: any) => {
  setHoveredProvinceId(id);
  setHoveredProvinceData(props);
 }, []);

 const handleProvinceUnhover = useCallback(() => {
  setHoveredProvinceId(null);
  setHoveredProvinceData(null);
 }, []);

 const handleProvinceClick = useCallback((id: any, name: string, properties: any) => {
  // If the user was dragging/panning the map, ignore the click
  if (hasDraggedRef.current) return;

  const ownerNation = provinceOwnership.get(id) || provinceOwnership.get(name) || null;

  // First-come-first-served: while selecting territory/capital for a new nation,
  // block provinces already owned by another nation and warn the player.
  const isSelectingForCreation = previewState?.mode === 'territory' || previewState?.mode === 'capital';
  const isOwnedByOther = ownerNation && (!myNation || ownerNation.id !== myNation.id);
  if (isSelectingForCreation && isOwnedByOther) {
   setOccupiedWarning(`省份【${name}】已被【${ownerNation!.name}】占领,先来后到,请另选未被占领的疆域!`);
   if (occupiedWarningTimer.current) window.clearTimeout(occupiedWarningTimer.current);
   occupiedWarningTimer.current = window.setTimeout(() => setOccupiedWarning(null), 3500);
   return;
  }

  // 自由圈选初始领土（已取消相邻限制，支持玩家跨洲/自由选择）
  if (previewState?.mode === 'territory' && previewState.provinces && previewState.provinces.length > 0) {
   // 无相邻限制，允许自由选定全球行省
  }

  // Peaceful expansion mode click handler
  if (isPeacefulExpansion) {
   if (!myNation) {
    setExpansionError('您尚未创建或统治国家，无法执行和平扩张');
    setTimeout(() => setExpansionError(null), 3500);
    return;
   }
   if (isTodayUsed(myNation.lastPeaceExpansionAt, myNation.peaceExpansionCount)) {
    setExpansionError('今日和平扩张次数已用完，请于明日再试');
    setTimeout(() => setExpansionError(null), 3500);
    return;
   }
   const isMine = (myNation.provinces || []).some(
    (p) => String(p.id) === String(id) || (p.name && p.name.trim().toLowerCase() === String(name).trim().toLowerCase())
   );
   if (isMine) {
    setExpansionError('该省份已经属于你的国家');
    setTimeout(() => setExpansionError(null), 3500);
    return;
   }
   if (ownerNation && ownerNation.id !== myNation.id) {
    setExpansionError(`无法通过和平扩张获得其他国家【${ownerNation.name}】的领土`);
    setTimeout(() => setExpansionError(null), 3500);
    return;
   }
   const isAdjacent = isProvinceAdjacentToNation(id, myNation.provinces || [], name) || isProvinceAdjacentToNation(name, myNation.provinces || []);
   if (!isAdjacent) {
    setExpansionError('和平扩张必须与本国现有领土相邻接壤，该省份不满足接壤条件');
    setTimeout(() => setExpansionError(null), 3500);
    return;
   }

   setIsExpanding(true);
   api.nations.peaceExpansion({ provinceId: id, provinceName: name })
    .then((res: any) => {
     setIsPeacefulExpansion(false);
     if (res?.nation) {
      window.dispatchEvent(new CustomEvent('nation-updated', { detail: { nation: res.nation } }));
     }
     setExpansionSuccessData({
      provinceName: res?.province?.name || name,
      isCore: Boolean(res?.province?.isCore),
     });
    })
    .catch((err: any) => {
     setExpansionError(err.message || '和平扩张失败');
     setTimeout(() => setExpansionError(null), 4000);
    })
    .finally(() => {
     setIsExpanding(false);
    });
   return;
  }
  
  if (onProvinceClick) {
   onProvinceClick({ id, name, properties, ownerNation });
   return;
  }

  if (id && name) {
   const event = new CustomEvent('map-province-click', {
    detail: { id, name, properties },
   });
   window.dispatchEvent(event);
  }

  if (constructionPlacementBuilding && onBuildInProvince) {
   if (ownerNation && myNation && ownerNation.id === myNation.id) {
    setClickedConstructionProvinces((prev) => {
     const next = new Set(prev);
     if (id !== undefined && id !== null) next.add(String(id));
     if (name) next.add(String(name).trim().toLowerCase());
     return next;
    });
    onBuildInProvince(id, name, constructionPlacementBuilding);
   }
   return;
  }

  // Do NOT open province details card when selecting territory or choosing capital during nation creation
  if (previewState?.mode === 'territory' || previewState?.mode === 'capital') {
   return;
  }

  // Set selected province so detailed panel opens with all construction & garrison data
  setSelectedProvince({
   id,
   name,
   properties,
   ownerNation,
  });
 }, [constructionPlacementBuilding, isPeacefulExpansion, myNation, onBuildInProvince, previewState, provinceOwnership]);

 const validExpansionIds = useMemo(() => {
  if (!isPeacefulExpansion || !myNation) return new Set<string>();
  return getValidExpansionProvinceIds(myNation, nations);
 }, [isPeacefulExpansion, myNation, nations]);

 const validCreationIds = useMemo(() => {
  if (previewState?.mode !== 'territory') {
   return null;
  }
  return getValidCreationProvinceIds(previewState.provinces || [], nations);
 }, [previewState?.mode, previewState?.provinces, nations]);

 // Keep the 1000+ province React subtree referentially stable while the camera changes.
 // SVG then only receives a transform update; province prop comparison/reconciliation is skipped per zoom tick.
 const provincePathElements = useMemo(() => precalculatedFeatures.map((item) => {
 const { stateId, pathD, name, properties, idx } = item;
 const ownerNation = provinceOwnership.get(stateId) || provinceOwnership.get(name);
 const isPreviewed = previewedIdsSet.has(String(stateId));
 const isCapitalPreview =
  previewState?.mode === 'capital' &&
  previewState?.capital &&
  (String(name) === String(previewState.capital) ||
   String(stateId) === String(previewState.capital));
 const isHovered =
  hoveredProvinceId !== null && String(hoveredProvinceId) === String(stateId);
 const isSelected = Boolean(
  selectedProvince &&
   (String(selectedProvince.id) === String(stateId) ||
    String(selectedProvince.name) === String(name))
 );

 const constructionSnapshot = constructionByProvince.get(String(stateId));
 const isMyProvince = Boolean(myNation && ownerNation?.id === myNation.id && constructionSnapshot?.isMyProvince);
 const isConstructionMode = Boolean(constructionPlacementBuilding);
 const constructionColor = constructionPlacementBuilding
  ? STRATEGIC_BUILDINGS[constructionPlacementBuilding]?.color
  : undefined;
 const isClicked =
  clickedConstructionProvinces.has(String(stateId)) ||
  clickedConstructionProvinces.has(String(name).trim().toLowerCase());
 const isUnderConstruction = Boolean(constructionSnapshot?.isQueued) || isClicked;
 const provPercent = constructionSnapshot?.percent || 0;
 const constructionHeatColor = getConstructionHeatmapColor(provPercent, constructionColor);

 const provinceRecord = ownerNation?.provinces?.find(
  (p) => String(p.id) === String(stateId) || (p.name && String(p.name).trim().toLowerCase() === String(name).trim().toLowerCase())
 );
 const isNonCore = Boolean(ownerNation && provinceRecord && provinceRecord.isCore === false);
 const isValidExpansionTarget = Boolean(
  isPeacefulExpansion &&
  (validExpansionIds.has(String(stateId)) || validExpansionIds.has(String(name).trim().toLowerCase()))
 );
 const isCreationMode = previewState?.mode === 'territory';
 const isValidCreationTarget = Boolean(
  validCreationIds &&
  (validCreationIds.has(String(stateId)) ||
   validCreationIds.has(String(name).trim().toLowerCase()) ||
   (properties?.name && validCreationIds.has(String(properties.name).trim().toLowerCase())))
 );

 return (
  <MemoizedProvincePath
   key={`prov-${stateId ?? idx}`}
   pathD={pathD}
   stateId={stateId}
   name={name}
   properties={properties}
   ownerNation={ownerNation}
   isPreviewed={isPreviewed}
   isCapitalPreview={Boolean(isCapitalPreview)}
   previewFlagColor={previewState?.flagColor}
   isHovered={isHovered}
   isSelected={isSelected}
   mapTheme={mapTheme}
   themeConfig={currentTheme}
   isMyProvince={isMyProvince}
   isConstructionMode={isConstructionMode}
   isUnderConstruction={isUnderConstruction}
   constructionPercent={provPercent}
   constructionHeatColor={constructionHeatColor}
   constructionColor={constructionColor}
   mapMode={mapMode}
   isPeacefulExpansionMode={isPeacefulExpansion}
   isValidExpansionTarget={isValidExpansionTarget}
   isCreationMode={isCreationMode}
   isValidCreationTarget={isValidCreationTarget}
   isNonCore={isNonCore}
   workspaceHighlightNationId={workspaceHighlightNationId}
   onHover={handleProvinceHover}
   onUnhover={handleProvinceUnhover}
   onClick={handleProvinceClick}
  />
 ); }), [
  clickedConstructionProvinces,
  constructionByProvince,
  constructionPlacementBuilding,
  currentTheme,
  handleProvinceClick,
  handleProvinceHover,
  handleProvinceUnhover,
  hoveredProvinceId,
  isPeacefulExpansion,
  mapMode,
  mapTheme,
  myNation,
  precalculatedFeatures,
  previewState,
  previewedIdsSet,
  provinceOwnership,
  selectedProvince,
  validExpansionIds,
  validCreationIds,
  workspaceHighlightNationId,
 ]);

 return (
  <div
   id="world-map-container"
   ref={containerRef}
   className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden"
   style={{
    backgroundColor: currentTheme.containerBg,
    transition: 'background-color 400ms cubic-bezier(0.4, 0, 0.2, 1)',
   }}
  >
   {/* Occupied-province warning (first-come-first-served) */}
   <AnimatePresence>
    {occupiedWarning && (
     <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[60] w-[94%] max-w-md bg-rose-950/95 text-rose-50 backdrop-blur-xl border border-rose-500/60 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-2 text-sm font-semibold pointer-events-auto"
     >
      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
      <span className="leading-snug">{occupiedWarning}</span>
     </motion.div>
    )}
   </AnimatePresence>

   {/* Expansion Error Toast */}
   <AnimatePresence>
    {expansionError && (
     <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[60] w-[94%] max-w-md bg-rose-950/95 text-rose-50 backdrop-blur-xl border border-rose-500/60 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-2.5 text-xs font-bold pointer-events-auto"
     >
      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
      <span className="leading-snug">{expansionError}</span>
     </motion.div>
    )}
   </AnimatePresence>

   {/* Tactical Top Construction Placement Planning Banner */}
   <AnimatePresence>
    {constructionPlacementBuilding && (
     <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      className="absolute top-14 sm:top-16 left-1/2 -translate-x-1/2 z-[60] w-[94%] max-w-2xl bg-white/95 text-slate-800 backdrop-blur-xl border border-amber-300 rounded-2xl shadow-xl p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-auto"
     >
      <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
       <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-md"
        style={{
         backgroundColor: `${STRATEGIC_BUILDINGS[constructionPlacementBuilding].color}25`,
         borderColor: STRATEGIC_BUILDINGS[constructionPlacementBuilding].color,
         color: STRATEGIC_BUILDINGS[constructionPlacementBuilding].color,
        }}
       >
        <Hammer className="w-5 h-5 animate-pulse" />
       </div>
       <div className="min-w-0">
        <div className="flex items-center gap-2">
         <span className="text-xs font-black text-amber-700">地图建造规划:</span>
         <strong className="text-sm font-black text-slate-900 truncate">
          {STRATEGIC_BUILDINGS[constructionPlacementBuilding].name}
         </strong>
         <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-mono border border-amber-200">
          {STRATEGIC_BUILDINGS[constructionPlacementBuilding].costFormulaDescription}
         </span>
        </div>
        <p className="text-[11px] text-slate-600 truncate mt-0.5">
         请在地图上点击属于【{myNation?.name || '您'}】的高亮主权省份以加入建造队列
        </p>
       </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
       {onOpenConstruction && (
        <button
         type="button"
         onClick={onOpenConstruction}
         className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200 cursor-pointer"
        >
         切换工程
        </button>
       )}
       {onCancelConstructionPlacement && (
        <button
         type="button"
         onClick={onCancelConstructionPlacement}
         className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
        >
         <span>退出选点</span>
        </button>
       )}
      </div>
     </motion.div>
    )}
   </AnimatePresence>

   {/* TOP COMMAND HUD: 日期 → 核心行动 → 国家资源 */}
   {!isWorkspaceEditor && (
    <>
    <div className="absolute top-2 left-2 right-2 sm:top-2.5 sm:left-3.5 sm:right-3.5 z-30 flex items-center justify-between pointer-events-none gap-2">
    {/* Left: Campaign Clock + Strategic Action Modules (嵌入式大战略 HUD) */}
    <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5">
     {/* Campaign Date & Threat Status Instrument Module */}
     <div className="px-2.5 py-1 rounded-lg bg-white/95 text-slate-800 border border-slate-200/90 backdrop-blur-md shadow-xs flex flex-col justify-center shrink-0 select-none">
      <div className="flex items-center gap-1.5 leading-none">
       <Clock3 className="h-3 w-3 shrink-0 text-amber-500" />
       <time className="font-mono text-xs font-black tracking-tight tabular-nums text-slate-900 leading-none">
        {worldClockStart ? formatCampaignTime(worldClockStart, campaignNow) : '1936.01.01'}
       </time>
      </div>
      <div className="flex items-center gap-1 mt-0.5 leading-none">
       <span
        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
         myNation?.activeWars && myNation.activeWars.length > 0
          ? 'bg-rose-500 animate-pulse'
          : 'bg-emerald-500'
        }`}
       />
       <span className="text-[9px] text-slate-500 font-sans font-semibold tracking-wide leading-none select-none">
        {myNation?.activeWars && myNation.activeWars.length > 0 ? '战时紧急' : '和平时期'}
       </span>
      </div>
     </div>
    </div>

    {/* Right: Actions (全屏地图 + 世界势力清册) */}
    <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 shrink-0">
     {onToggleFullscreen && (
      <button
       id="map-embedded-fullscreen-toggle"
       type="button"
       onClick={(e) => {
        e.stopPropagation();
        onToggleFullscreen();
       }}
       className="px-2.5 py-1.5 rounded-lg border backdrop-blur-md shadow-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95 bg-white/95 hover:bg-slate-50 text-slate-700 border-slate-200/90"
       title={isFullscreen ? '退出全屏地图' : '全屏进入推演地图'}
      >
       {isFullscreen ? (
        <Minimize2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
       ) : (
        <Maximize2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
       )}
       <span className="text-xs font-bold font-sans hidden xs:inline">
        {isFullscreen ? '退出全屏' : '全屏'}
       </span>
      </button>
     )}

     <button
      id="map-factions-drawer-toggle"
      type="button"
      onClick={(e) => {
       e.stopPropagation();
       setShowNationsDrawer(!showNationsDrawer);
      }}
      className={`px-2.5 py-1.5 rounded-lg border backdrop-blur-md shadow-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer active:scale-95 ${
       showNationsDrawer
        ? 'bg-purple-50 border-purple-300 text-purple-700 ring-1 ring-purple-300'
        : nationalPrestigeOrCount === 0
        ? 'bg-white/95 hover:bg-amber-50/80 border-amber-300 text-amber-700'
        : 'bg-white/95 hover:bg-purple-50/70 border-purple-200/90 text-purple-700'
      }`}
      title={
       nationalPrestigeOrCount === 0
        ? '世界地缘势力清册（当前暂无入驻势力，点击查看态势感知、一键注入列强或构筑推演沙盘）'
        : `世界地缘势力清册（当前推演沙盘共入驻 ${nationalPrestigeOrCount} 方地缘势力，点击查看战况与外交）`
      }
     >
      <Crown className={`w-3.5 h-3.5 shrink-0 ${nationalPrestigeOrCount === 0 ? 'text-amber-500' : 'text-purple-600'}`} />
      <span className="font-mono text-xs font-black tabular-nums leading-none">
       {nationalPrestigeOrCount === 0 ? (
        <span className="text-amber-600 text-[11px] font-sans">势力 0</span>
       ) : (
        <span className="text-purple-700">{nationalPrestigeOrCount}</span>
       )}
      </span>
     </button>
    </div>
   </div>

    {/* SECONDARY ROW: Map Modes Tactical Selector (政务 / 工业 / 资源 / 人口 / 地貌 / 战线) */}
    <div className="absolute top-[44px] sm:top-[48px] left-2 sm:left-3.5 z-30 flex flex-col gap-1 max-w-[calc(100vw-4rem)] pointer-events-none">
     <div className="pointer-events-auto flex items-center p-0.5 bg-white/95 text-slate-700 backdrop-blur-md border border-slate-200/90 rounded-lg shadow-xs transition-all flex-wrap sm:flex-nowrap gap-0.5">
      {/* Tactical Map Modes List */}
      <div className="flex items-center">
       {[
        { id: 'political', label: '政务' },
        { id: 'industrial', label: '工业' },
        { id: 'resources', label: '资源' },
        { id: 'population', label: '人口' },
        { id: 'terrain', label: '地貌' },
        { id: 'military', label: '战线' },
       ].map((mode) => (
        <button
         key={mode.id}
         type="button"
         onClick={() => setMapMode(mode.id as MapModeType)}
         className={`px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer shrink-0 rounded-md ${
          mapMode === mode.id
           ? 'bg-indigo-50 text-indigo-700 font-black shadow-2xs'
           : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
         }`}
        >
         {mode.label}
        </button>
       ))}
      </div>

     {/* Integrated Peaceful Expansion Status Module */}
     <AnimatePresence>
      {isPeacefulExpansion && (
       <motion.div
        key="hud-peaceful-expansion-segment"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        className="flex items-center gap-1.5 pl-2 border-l border-slate-200 shrink-0"
       >
        <div className="flex items-center gap-1 shrink-0">
         <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
         </span>
         <span className="text-xs font-bold text-emerald-600 whitespace-nowrap">
          和平扩张
         </span>
        </div>

        {/* Limit/Adjacency Info Badge */}
        <div className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-700 font-medium whitespace-nowrap">
         <span className="font-mono font-bold">1次/日</span>
         <span className="text-emerald-400">·</span>
         <span>与本土接壤</span>
        </div>

        {/* Collapsible Info Button (ⓘ) */}
        <button
         type="button"
         onClick={(e) => {
          e.stopPropagation();
          setShowExpansionInfo((prev) => !prev);
         }}
         className={`p-1 rounded transition cursor-pointer flex items-center justify-center shrink-0 ${
          showExpansionInfo
           ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300'
           : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
         }`}
         title={showExpansionInfo ? '收起说明' : '点击查看详细操作说明'}
        >
         <Info className="w-3.5 h-3.5" />
        </button>

        {/* Compact Exit Button */}
        <button
         type="button"
         disabled={isExpanding}
         onClick={(e) => {
          e.stopPropagation();
          setIsPeacefulExpansion(false);
          setShowExpansionInfo(false);
         }}
         className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded text-[10px] font-bold transition cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
         title="退出和平扩张模式"
        >
         {isExpanding ? (
          <Compass className="w-3 h-3 animate-spin text-emerald-600" />
         ) : (
          <X className="w-3 h-3 text-rose-500" />
         )}
         <span>{isExpanding ? '签署中...' : '退出'}</span>
        </button>
       </motion.div>
      )}
     </AnimatePresence>
    </div>

    {/* Expandable Instruction Tooltip Card */}
    <AnimatePresence>
     {isPeacefulExpansion && showExpansionInfo && (
      <motion.div
       initial={{ opacity: 0, y: -6, scale: 0.96 }}
       animate={{ opacity: 1, y: 0, scale: 1 }}
       exit={{ opacity: 0, y: -6, scale: 0.96 }}
       transition={{ type: 'spring', stiffness: 480, damping: 28 }}
       className="pointer-events-auto w-full max-w-sm px-3 py-2 bg-white/98 text-slate-800 border border-emerald-300 rounded-xl shadow-xl backdrop-blur-xl text-left text-xs leading-relaxed"
      >
       <div className="flex items-center justify-between font-bold text-emerald-600 mb-1 text-[11px]">
        <span>和平领土归并指引</span>
        <button
         type="button"
         onClick={() => setShowExpansionInfo(false)}
         className="text-slate-400 hover:text-slate-700 cursor-pointer"
        >
         <X className="w-3.5 h-3.5" />
        </button>
       </div>
       <p className="text-slate-600 text-[11px]">
        点击地图上与本国领土接壤的<span className="text-emerald-600 font-bold">绿色高亮中立省份</span>即可完成和平归并。
       </p>
       <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
        <span>每日限 1 次 · 00:00 刷新</span>
        <span className="text-emerald-600 font-mono font-bold">1/1 今日剩余</span>
       </div>
      </motion.div>
     )}
    </AnimatePresence>

    {/* Population Mode Tactical Legend Strip */}
    <AnimatePresence>
     {mapMode === 'population' && (
      <motion.div
       initial={{ opacity: 0, y: -4 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: -4 }}
       transition={{ duration: 0.15 }}
       className="pointer-events-auto flex items-center gap-1.5 px-2 py-1 bg-white/95 text-slate-700 backdrop-blur-md border border-slate-200/90 rounded-lg shadow-xs text-[10px] flex-wrap"
      >
       <span className="text-slate-500 font-bold mr-0.5">人口阶梯:</span>
       {[
        { label: '<40万', color: '#a7f3d0' },
        { label: '40-90万', color: '#34d399' },
        { label: '90-180万', color: '#10b981' },
        { label: '180-350万', color: '#059669' },
        { label: '350-600万', color: '#047857' },
        { label: '>600万', color: '#064e3b' },
       ].map((t) => (
        <span key={t.label} className="flex items-center gap-1">
         <span className="w-2 h-2 rounded-[2px]" style={{ backgroundColor: t.color }} />
         <span className="text-slate-600 font-medium">{t.label}</span>
        </span>
       ))}
      </motion.div>
     )}
    </AnimatePresence>

    {/* Industrial Mode Tactical Legend Strip */}
    <AnimatePresence>
     {mapMode === 'industrial' && (
      <motion.div
       initial={{ opacity: 0, y: -4 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: -4 }}
       transition={{ duration: 0.15 }}
       className="pointer-events-auto flex items-center gap-1.5 px-2 py-1 bg-white/95 text-slate-700 backdrop-blur-md border border-slate-200/90 rounded-lg shadow-xs text-[10px] flex-wrap"
      >
       <span className="text-slate-500 font-bold mr-0.5">总产能:</span>
       {[
        { label: '0 工厂', color: '#64748b' },
        { label: '1-2 工厂', color: '#d97706' },
        { label: '3-5 工厂', color: '#2563eb' },
        { label: '6+ 工厂', color: '#15803d' },
       ].map((t) => (
        <span key={t.label} className="flex items-center gap-1">
         <span className="w-2 h-2 rounded-[2px]" style={{ backgroundColor: t.color }} />
         <span className="text-slate-600 font-medium">{t.label}</span>
        </span>
       ))}
      </motion.div>
     )}
    </AnimatePresence>

    {/* Strategic Resources Mode Tactical Legend Strip */}
    <AnimatePresence>
     {mapMode === 'resources' && (
      <motion.div
       initial={{ opacity: 0, y: -4 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: -4 }}
       transition={{ duration: 0.15 }}
       className="pointer-events-auto flex items-center gap-1.5 px-2 py-1 bg-white/95 text-slate-700 backdrop-blur-md border border-slate-200/90 rounded-lg shadow-xs text-[10px] flex-wrap"
      >
       {Object.values(STRATEGIC_RESOURCES).map((res) => (
        <span key={res.id} className="flex items-center gap-1 bg-slate-100/80 px-1 py-0.5 rounded-[3px] border border-slate-200">
         <span className="w-3 h-3 rounded-[2px] flex items-center justify-center p-0.5" style={{ backgroundColor: res.color }}>
          <img src={res.iconUrl} alt={res.name} className="w-full h-full object-contain" />
         </span>
         <span className="text-slate-700 font-semibold">{res.name}</span>
        </span>
       ))}
      </motion.div>
     )}
    </AnimatePresence>

    {/* Terrain Mode Tactical Legend Strip */}
    <AnimatePresence>
     {mapMode === 'terrain' && (
      <motion.div
       initial={{ opacity: 0, y: -4 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: -4 }}
       transition={{ duration: 0.15 }}
       className="pointer-events-auto flex items-center gap-1.5 px-2 py-1 bg-white/95 text-slate-700 backdrop-blur-md border border-slate-200/90 rounded-lg shadow-xs text-[10px] flex-wrap"
      >
       <span className="text-slate-500 font-bold mr-0.5">地形:</span>
       {[
        { label: '平原', color: '#507c49' },
        { label: '山地', color: '#6e6761' },
        { label: '丘陵', color: '#994708' },
        { label: '沙漠', color: '#b37803' },
        { label: '沼泽', color: '#13756d' },
        { label: '城市', color: '#526075' },
        { label: '森林', color: '#166534' },
       ].map((t) => (
        <span key={t.label} className="flex items-center gap-1">
         <span className="w-2 h-2 rounded-[2px]" style={{ backgroundColor: t.color }} />
         <span className="text-slate-600 font-medium">{t.label}</span>
        </span>
       ))}
      </motion.div>
     )}
    </AnimatePresence>
    </div>
    </>
   )}

   {/* Floating Vertical HUD Toolbar: Theme Switch + Zoom Controls */}
   {!isWorkspaceEditor && (
   <motion.div
    key="map-zoom-controls"
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 10 }}
    transition={{
     type: 'spring',
     stiffness: 400,
     damping: 24,
     delay: 0.1,
    }}
    className="absolute top-14 right-2 sm:top-16 sm:right-3.5 z-20 flex flex-col bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-lg overflow-hidden shadow-xs select-none"
   >
    {/* Theme Switcher Button */}
    <button
     id="map-theme-toggle-btn"
     type="button"
     onClick={() => {
      const nextTheme: MapVisualTheme = mapTheme === 'white' ? 'grey' : 'white';
      setMapTheme(nextTheme);
      saveMapTheme(nextTheme);
     }}
     className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer active:scale-95 group relative"
     title={`地图主题: ${mapTheme === 'white' ? '明亮模式 (点击切换为战术灰调模式)' : '战术灰调模式 (点击切换为明亮模式)'} · 350ms 平滑材质过渡`}
     aria-label="切换地图视觉主题"
    >
     {mapTheme === 'white' ? (
      <Sun className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-45 transition-transform duration-300" />
     ) : (
      <Moon className="w-3.5 h-3.5 text-indigo-500 group-hover:-rotate-12 transition-transform duration-300" />
     )}
    </button>
    <div className="w-full h-[1px] bg-slate-200/80" />

    <button
     type="button"
     onClick={() => applyZoom(1.3)}
     className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer active:bg-slate-200/50"
     title="放大视角"
    >
     <span className="font-mono text-xs font-bold leading-none">＋</span>
    </button>
    <div className="w-full h-[1px] bg-slate-200/80" />
    <button
     type="button"
     onClick={() => applyZoom(0.7)}
     className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer active:bg-slate-200/50"
     title="缩小视角"
    >
     <span className="font-mono text-xs font-bold leading-none">－</span>
    </button>
    <div className="w-full h-[1px] bg-slate-200/80" />
    <button
     type="button"
     onClick={handleResetView}
     className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer active:bg-slate-200/50"
     title="重置全图中心"
    >
     <RotateCcw className="w-3 h-3" />
    </button>
   </motion.div>
   )}

   {/* Main Interactive SVG Map Viewport */}
   <div
    className="w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden"
    onMouseDown={handleMouseDown}
    onMouseMove={handleMouseMove}
    onMouseUp={handleMouseUp}
    onMouseLeave={() => {
     setHoveredProvinceId(null);
     setHoveredProvinceData(null);
     setMousePos(null);
    }}
    onWheel={handleWheel}
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={handleTouchEnd}
    style={{ touchAction: 'none' }}
   >
    <svg
     ref={svgRef}
     viewBox={`0 0 ${width} ${height}`}
     className="w-full h-full block"
     style={{
      backgroundColor: currentTheme.ocean,
      transition: 'background-color 400ms cubic-bezier(0.4, 0, 0.2, 1)',
      shapeRendering: 'geometricPrecision',
     }}
    >
     {/* Construction Patterns and Gradients & Spearhead Markers */}
     <defs>
      <pattern id="archival-sea-hatch" width="26" height="26" patternUnits="userSpaceOnUse">
       <path d="M 0 13 H 26 M 13 0 V 26" stroke={currentTheme.seaHatchStroke} strokeOpacity="0.4" strokeWidth="0.5" />
       <path d="M -4 24 L 24 -4 M 2 30 L 30 2" stroke={currentTheme.seaHatchStroke} strokeOpacity="0.25" strokeWidth="0.4" />
      </pattern>
      <filter id="selection-soft-glow" x="-20%" y="-20%" width="140%" height="140%">
       <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#38bdf8" floodOpacity="0.55" />
      </filter>
      <pattern
       id="construction-green-stripes"
       width="12"
       height="12"
       patternTransform="rotate(45 0 0)"
       patternUnits="userSpaceOnUse"
      >
       <line
        x1="0"
        y1="0"
        x2="0"
        y2="12"
        stroke="#22c55e"
        strokeWidth="5"
        strokeOpacity="0.85"
       />
      </pattern>

      <pattern
       id="non-core-stripes"
       width="8"
       height="8"
       patternTransform="rotate(45 0 0)"
       patternUnits="userSpaceOnUse"
      >
       <line
        x1="0"
        y1="0"
        x2="0"
        y2="8"
        stroke={mapTheme === 'white' ? '#0f172a' : '#cbd5e1'}
        strokeWidth="2.2"
        strokeOpacity={mapTheme === 'white' ? 0.35 : 0.45}
       />
      </pattern>

      {/* Tactical Spearhead Arrow Markers */}
      <marker id="spearhead-red" markerWidth="5" markerHeight="5" refX="4.25" refY="2.5" orient="auto">
       <path d="M 0,0 L 5,2.5 L 0,5 L 1.4,2.5 Z" fill="#fb7185" />
      </marker>
      <marker id="spearhead-player" markerWidth="5" markerHeight="5" refX="4.25" refY="2.5" orient="auto">
       <path d="M 0,0 L 5,2.5 L 0,5 L 1.4,2.5 Z" fill="#38bdf8" />
      </marker>
      <marker id="spearhead-amber" markerWidth="5" markerHeight="5" refX="4.25" refY="2.5" orient="auto">
       <path d="M 0,0 L 5,2.5 L 0,5 L 1.4,2.5 Z" fill="#fbbf24" />
      </marker>

      {/* Frontline Combat Visual FX Filters & Glows */}
      <filter id="war-frontline-glow" x="-30%" y="-30%" width="160%" height="160%">
       <feGaussianBlur stdDeviation="2.2" result="blur" />
       <feFlood floodColor="#ef4444" floodOpacity="0.85" />
       <feComposite in2="blur" operator="in" />
       <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
       </feMerge>
      </filter>
      <filter id="war-player-glow" x="-30%" y="-30%" width="160%" height="160%">
       <feGaussianBlur stdDeviation="2.5" result="blur" />
       <feFlood floodColor="#38bdf8" floodOpacity="0.9" />
       <feComposite in2="blur" operator="in" />
       <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
       </feMerge>
      </filter>

      {/* HOI4 Subtle Natural National Border Shadow */}
      <filter id="hoi4-border-subtle-shadow" x="-20%" y="-20%" width="140%" height="140%">
       <feGaussianBlur stdDeviation="0.28" />
       <feColorMatrix type="matrix" values="0 0 0 0 0.04  0 0 0 0 0.07  0 0 0 0 0.11  0 0 0 0.16 0" />
      </filter>

      {/* Modern GIS Resource Data Chip Subtle Shadow */}
      <filter id="resource-chip-shadow" x="-30%" y="-30%" width="160%" height="160%">
       <feDropShadow dx="0" dy="0.08" stdDeviation="0.12" floodColor="#0f172a" floodOpacity="0.12" />
      </filter>
      <style>{`
       @keyframes warFrontlinePulse {
        0%, 100% { opacity: 0.75; stroke-width: 2.2px; }
        50% { opacity: 1; stroke-width: 3.4px; }
       }
       @keyframes warDashFlow {
        to { stroke-dashoffset: -28; }
       }
       @keyframes warRadarRipple {
        0% { r: 6; opacity: 0.9; }
        100% { r: 24; opacity: 0; }
       }
      `}</style>
     </defs>

     <rect
      width={width}
      height={height}
      fill="url(#archival-sea-hatch)"
      pointerEvents="none"
      style={{ transition: 'opacity 400ms ease' }}
     />
     {/* Main Geo Transformed Group */}
     <g
      id="main-geo-transform-group"
      style={{
       transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
       transformOrigin: '0 0',
       transition: isDragging || isPinching ? 'none' : 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
       willChange: 'transform',
      }}
     >
      {/* Coordinate Grid lines (toggled by Settings) */}
      {(effectiveLayerSettings.showGrid || settings.showGridLines) && (
       <g
        stroke={currentTheme.grid}
        strokeWidth={0.7}
        strokeDasharray="2 2"
        opacity={0.85}
        style={{ transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)' }}
       >
        {[1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6].map((ratio, idx) => {
         const y = ratio * height;
         return <line key={`h-grid-${idx}`} x1={0} y1={y} x2={width} y2={y} />;
        })}
        {[1 / 8, 2 / 8, 3 / 8, 4 / 8, 5 / 8, 6 / 8, 7 / 8].map((ratio, idx) => {
         const x = ratio * width;
         return <line key={`v-grid-${idx}`} x1={x} y1={0} x2={x} y2={height} />;
        })}
       </g>
      )}

      {/* High-performance 1000+ Provinces Rendering */}
      <g id="provinces-layer">{provincePathElements}</g>

      {/* HOI4 Restrained Natural Sovereign National Borders (Single thin dark line + subtle soft shadow) */}
      <g id="hoi4-national-borders-layer" className="pointer-events-none select-none">
       {/* 1. 单一极其轻柔的暗色微扩散阴影 (Subtle Soft Outer Shadow - low opacity, embedded into terrain) */}
       {nationalBorders.map((b) => (
        <path
         key={`border-shadow-${b.nationId}`}
         d={b.outerBorderPathD}
         fill="none"
         stroke="#050a12"
         strokeWidth={0.52}
         strokeOpacity={0.10}
         filter="url(#hoi4-border-subtle-shadow)"
         strokeLinejoin="round"
         strokeLinecap="round"
        />
       ))}

       {/* 2. 单一精细国界线 (进一步缩小国界宽度，呈现清晰克制的主权轮廓) */}
       {nationalBorders.map((b) => (
        <path
         key={`border-main-${b.nationId}`}
         d={b.outerBorderPathD}
         fill="none"
         stroke={currentTheme.countryBorder}
         strokeWidth={mapTheme === 'white' ? 0.38 : 0.32}
         strokeOpacity={mapTheme === 'white' ? 0.86 : 0.82}
         strokeLinejoin="round"
         strokeLinecap="round"
        />
       ))}
      </g>

      {/* War Frontlines Border Glow & Hazard Flow Layer (交战双方边境接壤省份特殊战火光晕与流动警戒线) */}
      {displayedFrontlines.length > 0 && (
       <g id="war-frontlines-border-layer" className="pointer-events-none">
        {displayedFrontlines.flatMap((front) => {
         return front.frontlineProvinceIds.map((pid) => {
          const feat = precalculatedFeatures.find((f) => String(f.stateId) === pid);
          if (!feat?.pathD) return null;
          const isPlayer = front.isPlayerInvolved;
          return (
           <g key={`war-border-effect-${front.id}-${pid}`}>
            {/* 呼吸发光底晕 */}
            <path
             d={feat.pathD}
             fill={isPlayer ? 'rgba(239, 68, 68, 0.12)' : 'rgba(249, 115, 22, 0.08)'}
             stroke={isPlayer ? '#ef4444' : '#f97316'}
             strokeWidth={2.8}
             strokeOpacity={0.9}
             filter="url(#war-frontline-glow)"
             style={{
              animation: 'warFrontlinePulse 2s ease-in-out infinite',
             }}
             vectorEffect="non-scaling-stroke"
            />
            {/* 警戒流动虚线 */}
            <path
             d={feat.pathD}
             fill="none"
             stroke={isPlayer ? (front.isPlayerAttacker ? '#38bdf8' : '#fbbf24') : '#fca5a5'}
             strokeWidth={1.3}
             strokeDasharray="5 3"
             strokeOpacity={0.95}
             style={{
              animation: 'warDashFlow 1.2s linear infinite',
             }}
             vectorEffect="non-scaling-stroke"
            />
           </g>
          );
         });
        })}
       </g>
      )}

      {/* Construction Mode Active Queued Indicators (只标记正在施工的省份，绝不全屏大批量卡牌堆叠撞车) */}
      {Boolean(constructionPlacementBuilding) && (
       <g id="construction-placards-layer" className="pointer-events-none">
        {precalculatedFeatures.map((item) => {
         const { stateId, name, centroid } = item;
         if (!centroid) return null;
         const ownerNation = provinceOwnership.get(stateId) || provinceOwnership.get(name);
         const constructionSnapshot = constructionByProvince.get(String(stateId));
         const isMyProv = Boolean(myNation && ownerNation?.id === myNation.id && constructionSnapshot?.isMyProvince);
         if (!isMyProv) return null;

         const isClicked =
          clickedConstructionProvinces.has(String(stateId)) ||
          clickedConstructionProvinces.has(String(name).trim().toLowerCase());
         const isBuilding = Boolean(constructionSnapshot?.isQueued) || isClicked;

         if (!isBuilding) return null;

         const [cx, cy] = centroid;

         return (
          <g
           key={`const-active-badge-${stateId}`}
           transform={`translate(${cx}, ${cy})`}
           className="select-none"
          >
           {/* Active Construction Pulse Ring */}
           <circle
            r={2.2}
            fill="rgba(34, 197, 94, 0.25)"
            stroke="#22c55e"
            strokeWidth={0.35}
            strokeDasharray="0.8 0.6"
           />
           <circle
            r={1.2}
            fill="#15803d"
           />
           {/* Micro Wrench / Hammer Vector */}
           <path
            d="M -0.5,-0.5 L 0.5,0.5 M -0.4,0.4 L 0.4,-0.4"
            stroke="#ffffff"
            strokeWidth={0.25}
            strokeLinecap="round"
           />
          </g>
         );
        })}
       </g>
      )}

      {/* Province Army Glyphs: compact, non-interactive markers for formally deployed divisions. */}
      {armyProvinceMarkers.length > 0 && (
       <g id="province-army-glyphs-layer" className="pointer-events-none">
        {armyProvinceMarkers.map((marker, index) => {
         const alert = marker.fightingCount > 0;
         return (
          <g key={`army-glyph-${index}`} transform={`translate(${marker.x}, ${marker.y})`}>
           <title>{`${marker.nationName} · ${marker.divisionCount} 个陆军师${alert ? ' · 交战中' : ''}`}</title>
           <circle r={2.25} fill={alert ? 'rgba(127, 29, 29, 0.92)' : 'rgba(5, 22, 18, 0.92)'} stroke={alert ? '#fb7185' : '#6ee7b7'} strokeWidth={0.28} />
           <path d="M -1.05,-0.55 H 1.05 V 0.72 H -1.05 Z M -0.62,-1.18 V -0.55 M 0,-1.18 V -0.55 M 0.62,-1.18 V -0.55" fill="none" stroke={alert ? '#fecdd3' : '#d1fae5'} strokeWidth={0.25} strokeLinecap="round" />
           {marker.divisionCount > 1 && <text x={1.75} y={-1.15} fill="#fef3c7" fontSize={1.5} fontWeight="bold" className="font-mono">{marker.divisionCount}</text>}
          </g>
         );
        })}
       </g>
      )}

      {/* Combat & Occupation Markers */}
      <g id="combat-markers-layer" className="pointer-events-none select-none">
       {nations.flatMap(n => n.provinces || []).filter(p => (p as any).occupationValue > 0).map(prov => {
        const featureItem = precalculatedFeatures.find(f => String(f.stateId) === String(prov.id) || f.name === prov.name);
        if (!featureItem) return null;
        const pt = getFeaturePixelCenter(featureItem.feature, pathGenerator, projection);
        if (!pt) return null;
        const occ = (prov as any).occupationValue;
        const isCombat = (prov as any).occupationStatus === 'combat';
        return (
         <g key={`combat-${prov.id}`} transform={`translate(${pt[0]}, ${pt[1]})`}>
          <rect x={-4} y={-1.5} width={8} height={1.5} fill="#1e293b" opacity={0.8} rx={0.5} />
          <rect x={-4} y={-1.5} width={8 * (occ / 100)} height={1.5} fill={isCombat ? "#ef4444" : "#f59e0b"} rx={0.5} />
          <text x={0} y={-2.2} fontSize={1.6} textAnchor="middle" fill="#fca5a5" fontWeight="bold">
           {isCombat ? '' : ''} {Math.round(occ)}%
          </text>
         </g>
        );
       })}
      </g>

      {/* Strategic Resources Tactical Overlay Layer */}
      {mapMode === 'resources' && (
       <g id="strategic-resources-overlay-layer" className="pointer-events-none select-none">
        {precalculatedFeatures.map((item) => {
         const { stateId, name, centroid, properties } = item;
         if (!centroid) return null;
         const ownerNation = provinceOwnership.get(stateId) || provinceOwnership.get(name);
         const provRecord = ownerNation?.provinces?.find(
          (p) => String(p.id) === String(stateId) || (p.name && String(p.name).trim().toLowerCase() === String(name).trim().toLowerCase())
         );
         const rawDeposits = (provRecord?.resources && Object.keys(provRecord.resources).length > 0)
          ? provRecord.resources
          : getProvinceResourceDeposits(stateId, name, properties);
         const deposits = (Object.keys(rawDeposits) as StrategicResourceType[])
          .filter((k) => Boolean(rawDeposits[k] && rawDeposits[k]! > 0))
          .map((k) => ({ type: k, amount: rawDeposits[k]! }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 2);

         if (!deposits || deposits.length === 0) return null;

         const [cx, cy] = centroid;
         // 现代轻量 GIS 战略资源数据芯片（Modern Resource Data Chip）
         const isSingle = deposits.length === 1;
         const badgeHeight = 1.28;
         const rx = 0.38;

         let badgeWidth = 2.6;
         let items: Array<{
          type: StrategicResourceType;
          amount: number;
          iconCx: number;
          textX: number;
          chipColor: string;
          fontSize: number;
         }> = [];

         if (isSingle) {
          const dep = deposits[0];
          const s = String(dep.amount);
          const numWidth = s.length * 0.42;
          const iconDiameter = 0.68;
          const iconTextGap = 0.18;
          const padLeft = 0.32;
          const padRight = 0.32;
          badgeWidth = Math.max(2.4, padLeft + iconDiameter + iconTextGap + numWidth + padRight);

          const contentWidth = iconDiameter + iconTextGap + numWidth;
          const startX = -badgeWidth / 2 + (badgeWidth - contentWidth) / 2;
          const iconCx = startX + iconDiameter / 2;
          const textX = iconCx + iconDiameter / 2 + iconTextGap;

          items = [
           {
            type: dep.type,
            amount: dep.amount,
            iconCx,
            textX,
            chipColor: RESOURCE_CHIP_COLORS[dep.type] || '#475569',
            fontSize: dep.amount >= 100 ? 0.66 : 0.72,
           },
          ];
         } else {
          const dep0 = deposits[0];
          const dep1 = deposits[1];
          const s0 = String(dep0.amount);
          const s1 = String(dep1.amount);
          const numW0 = s0.length * 0.42;
          const numW1 = s1.length * 0.42;
          const iconDiameter = 0.68;
          const iconTextGap = 0.16;
          const padOuter = 0.32;
          const padInner = 0.28;

          const leftWidth = padOuter + iconDiameter + iconTextGap + numW0 + padInner;
          const rightWidth = padInner + iconDiameter + iconTextGap + numW1 + padOuter;
          badgeWidth = leftWidth + rightWidth;

          const leftIconCx = -badgeWidth / 2 + padOuter + iconDiameter / 2;
          const leftTextX = leftIconCx + iconDiameter / 2 + iconTextGap;

          const rightIconCx = padInner + iconDiameter / 2;
          const rightTextX = rightIconCx + iconDiameter / 2 + iconTextGap;

          items = [
           {
            type: dep0.type,
            amount: dep0.amount,
            iconCx: leftIconCx,
            textX: leftTextX,
            chipColor: RESOURCE_CHIP_COLORS[dep0.type] || '#475569',
            fontSize: dep0.amount >= 100 ? 0.66 : 0.72,
           },
           {
            type: dep1.type,
            amount: dep1.amount,
            iconCx: rightIconCx,
            textX: rightTextX,
            chipColor: RESOURCE_CHIP_COLORS[dep1.type] || '#475569',
            fontSize: dep1.amount >= 100 ? 0.66 : 0.72,
           },
          ];
         }

         return (
          <g key={`res-overlay-${stateId}`} transform={`translate(${cx}, ${cy})`}>
           {/* 半透明磨砂玻璃信息芯片底板 */}
           <rect
            x={-badgeWidth / 2}
            y={-badgeHeight / 2}
            width={badgeWidth}
            height={badgeHeight}
            rx={rx}
            fill="rgba(255, 255, 255, 0.88)"
            stroke="rgba(203, 213, 225, 0.75)"
            strokeWidth={0.06}
            filter="url(#resource-chip-shadow)"
           />
           {items.map((item, idx) => {
            const resDef = STRATEGIC_RESOURCES[item.type];
            if (!resDef) return null;
            return (
             <g key={`dep-${item.type}-${idx}`}>
              {/* 现代专属特征色圆形微标 */}
              <circle cx={item.iconCx} cy={0} r={0.35} fill={item.chipColor} />
              {/* 高保真纯矢量资源图标 */}
              {RESOURCE_ICON_PATHS[item.type] && (
               <g transform={`translate(${item.iconCx}, 0) scale(0.00092) translate(-256, -256)`}>
                <path d={RESOURCE_ICON_PATHS[item.type]} fill="#ffffff" />
               </g>
              )}
              {/* 重点突出的深色清晰中等字重数字 */}
              <text
               x={item.textX}
               y={0}
               dominantBaseline="central"
               fontSize={item.fontSize}
               fontWeight="600"
               fill="#0f172a"
               fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
               style={{ fontVariantNumeric: 'tabular-nums' }}
               textAnchor="start"
              >
               {item.amount}
              </text>
             </g>
            );
           })}
           {!isSingle && (
            <line
             x1={0}
             y1={-0.34}
             x2={0}
             y2={0.34}
             stroke="rgba(203, 213, 225, 0.85)"
             strokeWidth={0.06}
             strokeLinecap="round"
            />
           )}
          </g>
         );
        })}
       </g>
      )}

      {/* Dynamic Country Name Labels (HOI4-inspired Grand Strategy Map Typography) */}
      {effectiveLayerSettings.showCountryName && (
       <g id="adaptive-country-labels-layer" className="pointer-events-none select-none">
        <defs>
         <filter id="country-label-subtle-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0.1" dy="0.15" stdDeviation="0.25" floodColor="#000000" floodOpacity="0.28" />
         </filter>
         {countryLabels.map((label) => (
          <path
           key={`spine-def-${label.pathId}`}
           id={label.pathId}
           d={label.pathD}
           fill="none"
           stroke="none"
          />
         ))}
        </defs>
        {countryLabels.map((label) => {
         const effectiveFontKey = label.nation.nameFont || globalSettings?.nationFontFamily || 'condensed';
         const fontOption = getNationFontOption(effectiveFontKey);
         const finalFontSize = label.fontSize;

         return (
          <text
           key={`country-label-${label.pathId}`}
           dominantBaseline="central"
           textAnchor="middle"
           fill={currentTheme.labelColor}
           fillOpacity={label.opacity}
           filter="url(#country-label-subtle-shadow)"
           style={{
            fontFamily: fontOption.fontFamily,
            fontStretch: fontOption.fontStretch || 'normal',
            textTransform: 'uppercase',
            transition: 'fill-opacity 240ms ease',
           }}
           stroke={currentTheme.labelStroke}
           strokeWidth={Math.max(0.24, finalFontSize * 0.052)}
           strokeOpacity={0.96}
           strokeLinejoin="round"
           strokeLinecap="round"
           paintOrder="stroke fill"
           fontSize={finalFontSize}
           fontWeight="700"
           letterSpacing={`${label.letterSpacing}px`}
           className="select-none pointer-events-none"
          >
           <textPath
            href={`#${label.pathId}`}
            startOffset="50%"
            textAnchor="middle"
           >
            {label.displayText}
           </textPath>
          </text>
         );
        })}
       </g>
      )}

      {/* Dynamic Province Name Labels (toggled by Layer Settings) */}
      {effectiveLayerSettings.showProvinceName && (
       <g id="adaptive-province-labels-layer" className="pointer-events-none select-none">
        {precalculatedFeatures.map((item) => {
         const { stateId, name, centroid, area } = item;
         if (!centroid || !name) return null;
         const [cx, cy] = centroid;
         if (isNaN(cx) || isNaN(cy)) return null;

         const baseSize = area > 180 ? 3.0 : 2.4;
         const fontSize = Math.max(1.5, Math.min(4.2, baseSize / Math.sqrt(Math.max(0.65, zoom))));

         // 优先显示省份自定义名称或汉化标准名
         const provOwner = provinceOwnership.get(stateId) || (name ? provinceOwnership.get(String(name).trim().toLowerCase()) : undefined);
         const provRecord = provOwner?.provinces?.find(
          (p) => String(p.id) === String(stateId) || (p.name && String(p.name).trim().toLowerCase() === String(name).trim().toLowerCase())
         );
         const displayName = provRecord?.customName || getProvinceChineseName(name || stateId) || name;

         return (
          <text
           key={`prov-label-${stateId}`}
           x={cx}
           y={cy}
           textAnchor="middle"
           dominantBaseline="central"
           fill={mapTheme === 'white' ? '#334155' : '#E2E8F0'}
           stroke={mapTheme === 'white' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)'}
           strokeWidth={fontSize * 0.24}
           paintOrder="stroke fill"
           strokeLinejoin="round"
           fontSize={fontSize}
           fontWeight="600"
           className="select-none pointer-events-none"
           style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            opacity: 0.92,
           }}
          >
           {displayName}
          </text>
         );
        })}
       </g>
      )}

      {/* Plotted Nation Capital Markers & Tactical Capital Hubs (纯矢量极简随地图缩放) */}
      <g id="nation-markers-layer">
       {/* Capital Preview Beacon when picking capital in CreateNationModal */}
       {previewState?.mode === 'capital' && previewState.capital && (() => {
        const dummyNation = {
         id: 'preview',
         name: '新立帝国',
         capital: previewState.capital,
         territory: '',
         ownerId: '',
         ownerUsername: '',
         regime: '君主立宪制',
         ideology: '中立和平主义',
         flagColor: previewState.flagColor || '#6366f1',
         provinces: previewState.provinces || [],
         createdAt: new Date().toISOString(),
        } as unknown as Nation;
        const pt = findNationCapitalPoint(dummyNation, geoData, pathGenerator, projection, width, height);

        return (
         <g
          key="capital-preview-marker"
          transform={`translate(${pt.x}, ${pt.y})`}
          className="pointer-events-none"
         >
          <circle
           r={3.2}
           fill="none"
           stroke="#f59e0b"
           strokeWidth={0.4}
           strokeDasharray="1.2 0.8"
          />
          <circle
           r={1.8}
           fill="#0f172a"
           stroke="#f59e0b"
           strokeWidth={0.3}
          />
          <circle
           r={1.1}
           fill={previewState.flagColor || '#6366f1'}
           stroke="#ffffff"
           strokeWidth={0.2}
          />
          <path
           d="M 0,-0.8 L 0.22,-0.22 L 0.8,-0.22 L 0.32,0.15 L 0.5,0.7 L 0,0.35 L -0.5,0.7 L -0.32,0.15 L -0.8,-0.22 L -0.22,-0.22 Z"
           fill="#fef08a"
           stroke="#ca8a04"
           strokeWidth={0.08}
           strokeLinejoin="round"
          />
         </g>
        );
       })()}

       {nationMarkers.map(({ nation, x, y }) => {
        const isAtWar = (nation.activeWars || []).length > 0;
        const isHovered = hoveredNation?.id === nation.id;
        // Capital names are strictly interaction-only. Province/city strings never enter the default map label layer.
        const showCapitalName = isHovered;
        return (
         <g
          key={`marker-${nation.id}`}
          transform={`translate(${x}, ${y})`}
          className="cursor-pointer select-none"
          onClick={(e) => { e.stopPropagation(); onSelectNation(nation); }}
          onMouseEnter={() => setHoveredNation(nation)}
          onMouseLeave={() => setHoveredNation(null)}
         >
          <title>{`${nation.name} · 首都 ${nation.capital || '未设定'}`}</title>
          {isAtWar && isHovered && <circle r={0.82} fill="none" stroke="#8f554d" strokeWidth={0.13} strokeDasharray="0.28 0.26" />}
          <circle r={0.18} fill="#e7ddbd" stroke="#2a3131" strokeWidth={0.09} />
          <path d="M 0,-0.48 L 0.11,-0.11 L 0.48,-0.11 L 0.17,0.09 L 0.28,0.42 L 0,0.21 L -0.28,0.42 L -0.17,0.09 L -0.48,-0.11 L -0.11,-0.11 Z" fill="#b9a36b" stroke="#443d2e" strokeWidth={0.045} />
          {showCapitalName && (
           <text x={1.15} y={0.38} fill="#ded7c8" stroke="#1d2729" strokeWidth={0.16} paintOrder="stroke" fontSize={1.15} fontWeight="600" className="pointer-events-none font-serif">
            {nation.capital || nation.name}
           </text>
          )}
         </g>
        );
       })}
      </g>

      {/* Dynamic Border Clashes & Tactical Frontline Badges Layer (双方边境接触火线与前线交锋焦点勋章) */}
      {(mapMode === 'military' || displayedFrontlines.length > 0) && (
       <g id="military-frontlines-layer">
        {/* 1. 双方接壤边境短距交火矛头与阻绝线 */}
        {displayedFrontlines.map((front) => {
         const {
          contactPairs,
          isPlayerInvolved,
          isPlayerAttacker,
          isLandBorder,
         } = front;

         const strokeColor = isPlayerAttacker ? '#38bdf8' : '#ef4444';
         const markerId = isPlayerAttacker ? 'url(#spearhead-player)' : 'url(#spearhead-red)';

         return (
          <g key={`frontline-clashes-${front.id}`}>
           {contactPairs.map((pair, idx) => {
            const dx = pair.toX - pair.fromX;
            const dy = pair.toY - pair.fromY;
            const len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;
            const barrierHalfWidth = 10;
            const bx1 = pair.midX - nx * barrierHalfWidth;
            const by1 = pair.midY - ny * barrierHalfWidth;
            const bx2 = pair.midX + nx * barrierHalfWidth;
            const by2 = pair.midY + ny * barrierHalfWidth;

            return (
             <g key={`clash-node-${front.id}-${idx}`}>
              {/* 防守接触阻绝线 */}
              <line
               x1={bx1}
               y1={by1}
               x2={bx2}
               y2={by2}
               stroke="#0a0f1d"
               strokeWidth={2.4}
               strokeOpacity={0.6}
               strokeLinecap="round"
               vectorEffect="non-scaling-stroke"
              />
              <line
               x1={bx1}
               y1={by1}
               x2={bx2}
               y2={by2}
               stroke={isPlayerInvolved ? '#fbbf24' : '#fb7185'}
               strokeWidth={1.2}
               strokeOpacity={0.88}
               strokeDasharray="2.5 2.5"
               strokeLinecap="round"
               vectorEffect="non-scaling-stroke"
              />

              {/* 短距离进攻突破矛头 */}
              <line
               x1={pair.fromX + dx * 0.15}
               y1={pair.fromY + dy * 0.15}
               x2={pair.toX - dx * 0.15}
               y2={pair.toY - dy * 0.15}
               stroke={strokeColor}
               strokeWidth={isPlayerAttacker ? 2.0 : 1.5}
               strokeDasharray={activeOffensiveLaunched ? '3 2' : (isLandBorder ? 'none' : '4 3')}
               markerEnd={markerId}
               opacity={isPlayerInvolved ? 0.95 : 0.75}
               vectorEffect="non-scaling-stroke"
              />
             </g>
            );
           })}
          </g>
         );
        })}

        {/* 2. 前线核心交火焦点战况徽章 (带雷达波纹与即时战略信息，点击平滑聚焦) */}
        {displayedFrontlines.map((front) => {
         const {
          focusPos,
          id,
          attackerNation,
          defenderNation,
          attackerDivisions,
          defenderDivisions,
          isPlayerInvolved,
          isPlayerAttacker,
          isLandBorder,
         } = front;

         if (!focusPos.x || !focusPos.y) return null;
         const badgeScale = Math.max(0.38, 0.92 / Math.pow(zoom, 0.55));

         return (
          <g
           key={`frontline-focal-badge-${id}`}
           transform={`translate(${focusPos.x}, ${focusPos.y}) scale(${badgeScale})`}
           className="cursor-pointer"
           onClick={(e) => {
            e.stopPropagation();
            // 点击战火徽标快速聚焦该战线
            setView((prev) => ({
             zoom: Math.max(prev.zoom, 2.6),
             pan: {
              x: width / 2 - focusPos.x * Math.max(prev.zoom, 2.6),
              y: height / 2 - focusPos.y * Math.max(prev.zoom, 2.6),
             },
            }));
           }}
          >
           {/* 雷达探测扫描脉冲环 */}
           <circle
            cx={0}
            cy={0}
            r={8}
            fill="none"
            stroke={isPlayerInvolved ? '#f43f5e' : '#f97316'}
            strokeWidth={1.5}
            style={{ animation: 'warRadarRipple 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) infinite' }}
           />

           {/* 战火核心标牌底板 */}
           <rect
            x={-34}
            y={-9}
            width={68}
            height={18}
            rx={4}
            fill="#090d16"
            fillOpacity={0.95}
            stroke={isPlayerInvolved ? (isPlayerAttacker ? '#38bdf8' : '#f43f5e') : '#fbbf24'}
            strokeWidth={1.0}
            filter="drop-shadow(0 2px 5px rgba(0,0,0,0.6))"
           />

           {/* 战火与交锋图标 */}
           <g transform="translate(-29, -5.5) scale(0.6)">
            <Flame
             className={isPlayerInvolved ? 'text-rose-400' : 'text-amber-400'}
             color={isPlayerInvolved ? '#fb7185' : '#fbbf24'}
            />
           </g>

           {/* 状态与兵力标签 */}
           <text
            x={-16}
            y={-0.5}
            fill="#ffffff"
            fontSize={5.4}
            fontWeight="900"
            className="pointer-events-none select-none font-sans"
           >
            {isPlayerInvolved
             ? (isPlayerAttacker ? `⚔ 战线攻势: ${attackerNation.name}` : `⚔ 防线激战: ${attackerNation.name}`)
             : `⚔ 边境交火: ${attackerNation.name}`}
           </text>
           <text
            x={-16}
            y={5.8}
            fill="#94a3b8"
            fontSize={4.3}
            fontWeight="bold"
            className="pointer-events-none select-none font-mono"
           >
            {`${attackerDivisions}师 ⚔ ${defenderDivisions}师 (${isLandBorder ? '边境接壤' : '跨海远征'})`}
           </text>
          </g>
         );
        })}
       </g>
      )}
     </g>

     {/* 框选矩形框 (Box Selection Overlay) */}
     {isBoxSelectMode && boxSelectStart && boxSelectCurrent && (
      <rect
       x={Math.min(boxSelectStart.x, boxSelectCurrent.x)}
       y={Math.min(boxSelectStart.y, boxSelectCurrent.y)}
       width={Math.abs(boxSelectCurrent.x - boxSelectStart.x)}
       height={Math.abs(boxSelectCurrent.y - boxSelectStart.y)}
       fill="rgba(99, 102, 241, 0.18)"
       stroke="#4f46e5"
       strokeWidth={2}
       strokeDasharray="5 3"
       rx={3}
       pointerEvents="none"
      />
     )}
    </svg>
   </div>

   {/* 工作区沙盘专属图例浮动面板 (受 effectiveLayerSettings.showLegend 严格控制) */}
   {isWorkspaceEditor && effectiveLayerSettings.showLegend && (
    <div className="absolute bottom-16 left-3 sm:left-4 z-20 pointer-events-auto select-none max-w-[calc(100vw-2rem)] sm:max-w-md animate-fadeIn">
     {mapMode === 'population' && (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 text-slate-700 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-md text-[11px] flex-wrap">
       <span className="text-slate-900 font-bold mr-0.5">人口阶梯:</span>
       {[
        { label: '<40万', color: '#a7f3d0' },
        { label: '40-90万', color: '#34d399' },
        { label: '90-180万', color: '#10b981' },
        { label: '180-350万', color: '#059669' },
        { label: '350-600万', color: '#047857' },
        { label: '>600万', color: '#064e3b' },
       ].map((t) => (
        <span key={t.label} className="flex items-center gap-1">
         <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: t.color }} />
         <span className="text-slate-600 font-medium text-[10px]">{t.label}</span>
        </span>
       ))}
      </div>
     )}
     {mapMode === 'industrial' && (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 text-slate-700 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-md text-[11px] flex-wrap">
       <span className="text-slate-900 font-bold mr-0.5">工业产能:</span>
       {[
        { label: '0厂', color: '#64748b' },
        { label: '1-2厂', color: '#d97706' },
        { label: '3-5厂', color: '#2563eb' },
        { label: '6+厂', color: '#15803d' },
       ].map((t) => (
        <span key={t.label} className="flex items-center gap-1">
         <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: t.color }} />
         <span className="text-slate-600 font-medium text-[10px]">{t.label}</span>
        </span>
       ))}
      </div>
     )}
     {mapMode === 'resources' && (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 text-slate-700 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-md text-[11px] flex-wrap">
       {Object.values(STRATEGIC_RESOURCES).map((res) => (
        <span key={res.id} className="flex items-center gap-1 bg-slate-100/80 px-1.5 py-0.5 rounded-[3px] border border-slate-200">
         <span className="w-3 h-3 rounded-xs shrink-0 flex items-center justify-center p-0.5" style={{ backgroundColor: res.color }}>
          <img src={res.iconUrl} alt={res.name} className="w-full h-full object-contain" />
         </span>
         <span className="text-slate-700 font-semibold text-[10px]">{res.name}</span>
        </span>
       ))}
      </div>
     )}
     {mapMode === 'terrain' && (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 text-slate-700 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-md text-[11px] flex-wrap">
       <span className="text-slate-900 font-bold mr-0.5">地形地貌:</span>
       {[
        { label: '平原', color: '#86efac' },
        { label: '丘陵', color: '#fde047' },
        { label: '山地', color: '#fdba74' },
        { label: '高原', color: '#fca5a5' },
        { label: '沙漠', color: '#fef08a' },
       ].map((t) => (
        <span key={t.label} className="flex items-center gap-1">
         <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: t.color }} />
         <span className="text-slate-600 font-medium text-[10px]">{t.label}</span>
        </span>
       ))}
      </div>
     )}
     {mapMode === 'political' && nations.length > 0 && (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 text-slate-700 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-md text-[11px] flex-wrap max-h-24 overflow-y-auto custom-scrollbar">
       <span className="text-slate-900 font-bold mr-0.5">势力图例:</span>
       {nations.slice(0, 6).map((nat) => (
        <span key={nat.id} className="flex items-center gap-1">
         <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: nat.flagColor || '#3b82f6' }} />
         <span className="text-slate-700 font-medium text-[10px] truncate max-w-16">{nat.name}</span>
        </span>
       ))}
       {nations.length > 6 && (
        <span className="text-[9px] text-slate-400 font-mono">+{nations.length - 6}国</span>
       )}
      </div>
     )}
    </div>
   )}

   {/* Floating Tactical Theater High Command & Stance Controls Panel (左下角战术姿态面板，避开底部中央地球按钮与和平扩张) */}
   {(mapMode === 'military' || (myNation?.activeWars && myNation.activeWars.length > 0)) && (
     <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="absolute bottom-3 left-2 sm:bottom-4 sm:left-4 z-20 w-[calc(100vw-1.5rem)] sm:w-auto sm:max-w-md bg-white/95 backdrop-blur-xl border border-rose-200 rounded-xl shadow-xl p-2.5 text-slate-800 flex flex-col gap-2 pointer-events-auto select-none"
     >
      <div className="flex items-center justify-between gap-2">
       <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
         <Swords className="w-4 h-4" />
        </div>
        <div className="min-w-0">
         <div className="flex items-center gap-1.5">
          <span className="font-bold text-xs text-slate-900 tracking-wide">战区统帅部 · 作战姿态</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold">
           {displayedFrontlines.length}/{activeFrontlines.length} 前线
          </span>
         </div>
        </div>
       </div>

       {/* General Offensive Trigger Button */}
       <button
        type="button"
        onClick={() => {
         setActiveOffensiveLaunched(!activeOffensiveLaunched);
        }}
        className={`px-2.5 py-1 rounded text-[11px] font-black transition cursor-pointer flex items-center gap-1 border shrink-0 ${
         activeOffensiveLaunched
          ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 animate-pulse'
          : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
        }`}
       >
        <Zap className="w-3 h-3" />
        <span>{activeOffensiveLaunched ? '执行总攻中' : '下达总攻'}</span>
       </button>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
       <p className="text-[10px] text-slate-600 truncate flex-1">
        {armyGroupPosture === 'aggressive'
         ? '激进突破：战力+25%，推进极快，战损+15%'
         : armyGroupPosture === 'balanced'
         ? '均衡推进：稳扎稳打，战损平衡'
         : '堑壕固守：防御+35%，依托要塞极大减少人员伤亡'}
       </p>

       {/* Stance Selector */}
       <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] shrink-0">
        {(
         [
          { id: 'aggressive', label: '突击', icon: Flame },
          { id: 'balanced', label: '均衡', icon: Navigation },
          { id: 'defensive', label: '固守', icon: Shield },
         ] as const
        ).map((st) => (
         <button
          key={st.id}
          type="button"
          onClick={() => setArmyGroupPosture(st.id)}
          className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 transition cursor-pointer ${
           armyGroupPosture === st.id
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
          }`}
         >
          <st.icon className="w-3 h-3" />
          <span>{st.label}</span>
         </button>
        ))}
       </div>
      </div>
     </motion.div>
    )}

    {/* Click-Selected Province Tactical Details & Construction Panel */}
    <AnimatePresence>
     {selectedProvince && !previewState?.mode && !constructionPlacementBuilding && (
      <ProvinceDetailPanel
       provinceData={{
        id: selectedProvince.id,
        name: selectedProvince.name,
        properties: selectedProvince.properties,
       }}
       ownerNation={selectedProvince.ownerNation}
       myNation={myNation || null}
       allNations={nations}
       onClose={() => setSelectedProvince(null)}
       onOpenConstruction={onOpenConstruction}
       onBuildInProvince={(pId, pName, bType) => {
        onBuildInProvince?.(pId, pName, bType);
       }}
       onSelectNation={onSelectNation}
       onNavigateProvince={handleNavigateProvince}
       onOpenDispute={onOpenDispute}
      />
     )}
    </AnimatePresence>

    {/* Hover Nation Tooltip Card */}
    {hoveredNation && (
     <div className="absolute top-16 left-4 sm:top-20 sm:left-6 z-30 w-72 p-4 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl animate-fadeIn pointer-events-none text-slate-900">
      <div className="flex items-center gap-3 mb-3">
       <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0"
        style={{ backgroundColor: hoveredNation.flagColor }}
       >
        {renderEmblemIcon(hoveredNation.emblemIcon, { className: 'w-5 h-5' })}
       </div>
       <div className="min-w-0">
        <h4 className="font-bold text-base text-slate-900 truncate">
         {hoveredNation.name}
        </h4>
        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
         <Landmark className="w-3.5 h-3.5 text-indigo-500" /> 首都：
         {hoveredNation.capital}
        </p>
       </div>
      </div>

      <div className="text-xs space-y-1.5 text-slate-600 border-t border-slate-100 pt-3">
       <p>
        <span className="text-slate-400">疆域：</span>
        <span className="font-medium text-slate-700">{hoveredNation.territory}</span>
       </p>
       <p>
        <span className="text-slate-400">领主：</span>
        <span className="font-medium text-slate-700">
         {hoveredNation.ownerUsername}
        </span>{' '}
        <span className="text-slate-400">
         (创联号：{hoveredNation.ownerDouyinName})
        </span>
       </p>
       <p>
        <span className="text-slate-400">政体：</span>
        <span className="font-medium text-slate-700">
         {hoveredNation.regime} · {hoveredNation.ideology}
        </span>
       </p>
      </div>
     </div>
    )}

    {/* Peaceful Expansion Success Formal Ratification Card / Modal */}
    <AnimatePresence>
     {expansionSuccessData && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
       <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="w-full max-w-md bg-white border border-emerald-300 rounded-2xl shadow-2xl overflow-hidden text-slate-800"
       >
        {/* Header with emerald highlight */}
        <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-4 flex items-center gap-3">
         <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0 shadow-xs">
          <CheckCircle2 className="w-6 h-6" />
         </div>
         <div>
          <h3 className="text-base font-black text-slate-900 tracking-wide">和平扩张成功</h3>
          <p className="text-xs text-emerald-700">疆域勘界确认，已载入国家主权名册</p>
         </div>
        </div>

        {/* Body with crisp key-values */}
        <div className="p-5 space-y-4">
         <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
          <span className="text-xs text-slate-500">获得领土</span>
          <strong className="text-sm font-black text-emerald-700">
           「{expansionSuccessData.provinceName}」
          </strong>
         </div>

         <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
           <span className="text-slate-500">领土状态</span>
           <span className="font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
            非核心领土
           </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
           <span className="text-slate-500">核心状态</span>
           <span className="text-slate-700 font-medium">未整合 (需要日后行政整编)</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
           <span className="text-slate-500">资源产出</span>
           <span className="text-slate-400 font-medium">暂不可使用</span>
          </div>

          <div className="flex items-center justify-between py-1.5">
           <span className="text-slate-500">今日和平扩张</span>
           <span className="text-emerald-600 font-bold">已使用 (明日 00:00 刷新)</span>
          </div>
         </div>
        </div>

        {/* Footer Action */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex justify-end">
         <button
          type="button"
          onClick={() => setExpansionSuccessData(null)}
          className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
         >
          确定并查看地图
         </button>
        </div>
       </motion.div>
      </div>
     )}
    </AnimatePresence>

    {/* Province Hover HUD Card (智能支持：选地防挡视野固定停靠 / 极简光标微标 / 浮动跟随 / 彻底隐藏) */}
    {hoveredProvinceData && !isDragging && effectiveHUDMode !== 'hidden' && (() => {
       const provName = hoveredProvinceData.name || '';
       const provId = hoveredProvinceData.id ?? '';
       const cnName = getProvinceChineseName(provName || provId);
       const owner = hoveredProvinceData.ownerNation as Nation | undefined;
       const terrain = getProvinceTerrain(provId, provName, hoveredProvinceData.properties);
       const rawPop = (hoveredProvinceData.properties?.manpower as number) ??
        (hoveredProvinceData.properties?.population as number) ??
        (owner?.provinces?.find((p: any) => String(p.id) === String(provId) || p.name === provName)?.population) ??
        (1200000 + Math.abs(Number(provId || 1) * 3821) % 4500000);
       const popDisplay = rawPop >= 100000000
        ? `${(rawPop / 100000000).toFixed(2)} 亿`
        : rawPop >= 10000
        ? `${(rawPop / 10000).toFixed(1)} 万`
        : `${rawPop.toLocaleString()}`;
       const rawArea = hoveredProvinceData.properties?.area_km2
        ? Math.round(hoveredProvinceData.properties.area_km2)
        : hoveredProvinceData.properties?.area
        ? Math.round(hoveredProvinceData.properties.area)
        : Math.round(25000 + Math.abs(Number(provId || 1) * 317) % 65000);

       // 是否为国家法定首都
       const isCapitalCity = Boolean(
        owner &&
        ((owner.capitalId != null && String(owner.capitalId) === String(provId)) ||
         (owner.capital && (owner.capital === provName || owner.capital === cnName)))
       );

       // 是否处于合法和平扩张目标
       const isValidExpansion = Boolean(validExpansionIds?.has(String(provId)));

       // 是否处于新建国家划定疆域状态
       const isSelectedForCreation = Boolean(
        previewState?.provinces?.some((p: any) => String(p.id) === String(provId) || p.name === provName)
       );

       // 1. 如果是纯粹的极简微胶囊模式 (Mini Pill Only)
       if (effectiveHUDMode === 'mini') {
        const miniX = mousePos ? Math.max(10, Math.min((containerRef.current?.clientWidth || width || 800) - 130, mousePos.x + 12)) : 16;
        const miniY = mousePos ? Math.max(10, mousePos.y - 28) : 16;
        return (
         <div
          id="province-hover-mini-pill"
          className="pointer-events-none absolute z-40 px-2 py-0.5 rounded-full bg-slate-900/85 text-slate-100 text-[10px] font-medium border border-slate-700/70 shadow-md backdrop-blur-xs flex items-center gap-1.5 whitespace-nowrap transition-[opacity] duration-75 ease-out select-none"
          style={{ left: `${miniX}px`, top: `${miniY}px` }}
         >
          {owner && (
           <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: owner.flagColor || '#6366f1' }} />
          )}
          <span className="font-semibold text-white tracking-tight">{cnName || provName || '未知地块'}</span>
          <span className="text-slate-400 font-mono">#{provId || '—'}</span>
          {isCapitalCity && <span className="text-amber-300 font-bold">★</span>}
         </div>
        );
       }

       // 2. 如果是停靠模式 (Docked HUD) 或 浮动模式 (Floating Card)
       const isDocked = effectiveHUDMode === 'docked';
       const isLegendVisible = Boolean(isWorkspaceEditor && effectiveLayerSettings?.showLegend);
       const isBottomToolbarPresent = Boolean(isWorkspaceEditor || isSelectingTerritory);

       // 浮动坐标计算 (仅在 floating 模式下计算跟随鼠标坐标)
       const CARD_W = 222;
       const CARD_H = 132;
       const containerW = containerRef.current?.clientWidth || width || 800;
       const containerH = containerRef.current?.clientHeight || height || 600;
       // 底部避让安全距离：工作区底部有操作工具栏（高约48px在bottom-5），必须避让至少80px
       const BOTTOM_SAFE_OFFSET = isBottomToolbarPresent ? 84 : 56;

       let leftPos = mousePos ? mousePos.x + 14 : 16;
       let topPos = mousePos ? mousePos.y + 14 : containerH - CARD_H - 80;

       if (mousePos && !isDocked) {
        if (leftPos + CARD_W > containerW - 12) {
         leftPos = Math.max(12, mousePos.x - CARD_W - 14);
        }
        if (topPos + CARD_H > containerH - BOTTOM_SAFE_OFFSET) {
         topPos = Math.max(12, mousePos.y - CARD_H - 14);
        }
       }

       // 光标微标签坐标 (在 docked 模式下，鼠标上方同时配合一个极小微标签，高仅 18px，距离鼠标 24px，绝不挡地块)
       const microX = mousePos ? Math.max(10, Math.min(containerW - 130, mousePos.x + 12)) : 16;
       const microY = mousePos ? Math.max(10, mousePos.y - 26) : 16;

       // 停靠位置：当底部有操作栏（单点/框选/新建国家）时，停靠在 bottom-20（约距底80px），垂直方向与操作栏完全错开，彻底避免重叠遮挡
       const dockedPositionClass = isBottomToolbarPresent
        ? (isLegendVisible ? 'bottom-36 left-3 sm:left-4' : 'bottom-20 left-3 sm:left-4')
        : (isLegendVisible ? 'bottom-28 left-3 sm:left-4' : 'bottom-4 sm:bottom-5 left-3 sm:left-4');

       return (
        <>
         {/* 在 Docked 选地模式下，光标上方只留一个超微小标签（不挡任何地块边界与邻居） */}
         {isDocked && mousePos && (
          <div
           className="pointer-events-none absolute z-40 px-2 py-0.5 rounded-full bg-slate-900/80 text-slate-100 text-[10px] border border-slate-700/60 shadow-xs flex items-center gap-1.5 whitespace-nowrap select-none"
           style={{ left: `${microX}px`, top: `${microY}px` }}
          >
           <span className="font-medium text-white">{cnName || provName}</span>
           <span className="text-slate-400 font-mono text-[9px]">#{provId}</span>
          </div>
         )}

         {/* 详细属性卡片：若 isDocked 则停靠在左下角安全区域，高居操作条上方，零遮挡；若 floating 则跟随光标 */}
         <div
          id="province-hover-hud"
          className={`absolute z-40 bg-slate-900/96 text-slate-100 border border-slate-700/80 rounded-lg shadow-xl px-2.5 py-2 backdrop-blur-md select-none w-[222px] transition-all duration-100 ease-out ${
           isDocked
            ? `pointer-events-auto ${dockedPositionClass}`
            : 'pointer-events-none'
          }`}
          style={!isDocked ? { left: `${leftPos}px`, top: `${topPos}px` } : undefined}
         >
          {/* 1. Header: 省份地名、首都标识、地块编号以及模式快捷控制按钮 */}
          <div className="flex items-start justify-between gap-1.5 border-b border-slate-800/80 pb-2 mb-2">
           <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
             <span className="font-semibold text-xs text-slate-100 tracking-tight truncate leading-snug">
              {cnName || provName || '未知省份'}
             </span>
             {isCapitalCity && (
              <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30 shrink-0 leading-none">
               首都
              </span>
             )}
            </div>
            {provName && provName !== cnName && (
             <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5 leading-none">
              {provName}
             </div>
            )}
           </div>

           {/* 右上角：地块编号与模式切换微按钮 */}
           <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-slate-400 font-mono bg-slate-800/90 border border-slate-700/70 px-1.5 py-0.5 rounded leading-none">
             #{provId || '—'}
            </span>
            {isDocked && (
             <div className="flex items-center gap-0.5 ml-1">
              <button
               type="button"
               onClick={() => updateHoverHUDMode(hoverHUDMode === 'docked' ? 'floating' : 'docked')}
               className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
               title={hoverHUDMode === 'docked' ? '固定在角落 (当前已锁定停靠，避免遮挡光标视野)' : '切换为停靠在角落'}
              >
               <Pin className="w-3 h-3 text-indigo-400" />
              </button>
              <button
               type="button"
               onClick={() => updateHoverHUDMode('mini')}
               className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
               title="切换为极简光标微胶囊 (只显示微标签)"
              >
               <Minimize2 className="w-3 h-3" />
              </button>
              <button
               type="button"
               onClick={() => updateHoverHUDMode('hidden')}
               className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
               title="关闭悬停提示"
              >
               <EyeOff className="w-3 h-3" />
              </button>
             </div>
            )}
           </div>
          </div>

          {/* 2. 主权归属信息 */}
          <div className="flex items-center justify-between gap-2 mb-2">
           <span className="text-[11px] text-slate-400">所属主权</span>
           {owner ? (
            <div className="flex items-center gap-1.5 min-w-0">
             <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ring-1 ring-white/20"
              style={{ backgroundColor: owner.flagColor || '#6366f1' }}
             />
             <span className="text-[11px] font-medium text-slate-200 truncate max-w-[120px]">
              {owner.name}
             </span>
            </div>
           ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-800/80 text-slate-400 border border-slate-700/60 shrink-0">
             中立无主荒野
            </span>
           )}
          </div>

          {/* 3. 核心地缘数据 */}
          <div className="space-y-1.5 text-[11px]">
           <div className="flex items-center justify-between">
            <span className="text-slate-400">总人口</span>
            <span className="font-medium text-slate-100 font-mono">{popDisplay}</span>
           </div>
           <div className="flex items-center justify-between">
            <span className="text-slate-400">土地面积</span>
            <span className="font-medium text-slate-200 font-mono">{rawArea.toLocaleString()} km²</span>
           </div>
           <div className="flex items-center justify-between">
            <span className="text-slate-400">地貌环境</span>
            <div className="flex items-center gap-1.5">
             <span
              className="w-2 h-2 rounded-[2px] shrink-0"
              style={{ backgroundColor: terrain.color }}
             />
             <span className="font-medium text-slate-300">{terrain.label}</span>
            </div>
           </div>
          </div>

          {/* 4. 交互引导与情境状态 */}
          {(isValidExpansion || isSelectedForCreation || previewState?.mode === 'capital') && (
           <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-slate-400">状态指示</span>
            {isValidExpansion && (
             <span className="text-emerald-400 font-medium">接壤 · 可和平划入</span>
            )}
            {isSelectedForCreation && (
             <span className="text-indigo-400 font-medium">已圈选领土</span>
            )}
            {previewState?.mode === 'capital' && !isSelectedForCreation && (
             <span className="text-amber-300 font-medium">可设为国家首都</span>
            )}
           </div>
          )}

          </div>
        </>
       );
      })()}

    {/* 当用户关闭提示框时的轻量唤醒胶囊 (避让底部操作栏) */}
    {effectiveHUDMode === 'hidden' && !isDragging && (
     <div className={`absolute ${isWorkspaceEditor || isSelectingTerritory ? 'bottom-20' : 'bottom-4'} left-3 sm:left-4 z-30 pointer-events-auto select-none`}>
      <button
       type="button"
       onClick={() => updateHoverHUDMode('docked')}
       className="px-2.5 py-1 rounded-full bg-slate-900/85 hover:bg-slate-900 text-slate-300 hover:text-white text-xs border border-slate-700/80 shadow-md backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
       title="点击恢复省份悬停信息"
      >
       <Eye className="w-3.5 h-3.5 text-indigo-400" />
       <span>开启地块提示</span>
      </button>
     </div>
    )}

    {/* Geopolitical Factions Tactical Sidebar (Non-blocking docked overlay) */}
    <GeopoliticalFactionsSidebar
     isOpen={showNationsDrawer}
     onClose={() => setShowNationsDrawer(false)}
     nations={nations}
     myNation={myNation}
     onJumpToNation={(n) => {
      handleNationJump(n);
      setHoveredNation(n);
      setTimeout(() => setHoveredNation(null), 3000);
     }}
     onViewNationDetail={(n) => {
      onSelectNation(n);
     }}
     onOpenDiplomacy={(n) => {
      onOpenDiplomacy(n);
     }}
    />
   </div>
  );
 };
