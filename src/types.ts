export type UserRole = 'visitor' | 'creator';

export interface CreatorProfile {
  creatorCode: string; // 专属创作代码，如 T4-PL-9824-7102
  identityName: string; // 创作者代号 / 笔名
  scenarioName?: string; // 剧本名称
  scenarioEra?: string; // 剧本年代（如：1936年、21世纪、近未来）
  scenarioType?: '拟实' | '架空'; // 剧本性质
  scenarioDesc?: string; // 剧本简介
  activatedAt: string; // 激活时间
}

export type PoliticalSystem =
  | '创联民主同盟'
  | '议会立宪邦'
  | '工造公社联合体'
  | '中央协约共和国'
  | '自由城邦同盟'
  | '总督开拓辖区'
  | '神权保民官廷'
  | '军务督抚同盟'
  | '商业行会托拉斯'
  | '生态游牧联邦';

export type RegimeType = PoliticalSystem;
export type FlagEmblem = string;

export type TerrainType = 'plains' | 'hills' | 'mountains' | 'coastal' | 'islands' | 'basin' | 'desert';

export type RegionZone = '粉陆本土' | '绯霞东海' | '苍蓝外海' | '暮光群岛' | '北境霜原' | '赤荒南陆';

export interface TerritoryTile {
  id: string;
  name: string;
  regionZone: RegionZone;
  countryId: string | null;
  path: string; // SVG 路径数据
  center: [number, number]; // 地块中心坐标 [x, y]
  terrain: TerrainType;
  basePopulation: number; // 基础人口 (万人)
  baseIndustry: number; // 基础工业实力
  baseResources: number; // 基础资源储量
  isCapitalCity?: boolean; // 是否为国家首都所在地
  capitalName?: string; // 首都名称
  infrastructureLevel?: number; // 基建等级 (1-5)
  garrisonLevel?: number; // 卫戍等级 (1-5)
}

export interface CountryResources {
  crystal: number; // 创联源晶储备
  industry: number; // 工业实力指数
  agriculture: number; // 农业丰足指数
  energy: number; // 战略能源储备
  infrastructure: number; // 交通与基建指数
}

export type TreatyType =
  | '全面同盟协定'
  | '互不侵犯公约'
  | '自由贸易通商'
  | '军事要塞互助'
  | '源晶联合开发';

export interface BilateralTreaty {
  id: string;
  targetCountryId: string;
  type: TreatyType;
  signedYear: number;
  description: string;
}

export type StrategicDoctrine =
  | '全境深度工业化'
  | '海陆通商拓荒'
  | '边防要塞常备'
  | '民生安定与复兴'
  | '源晶矿脉深采'
  | '大洋航运枢纽';

export interface Country {
  id: string;
  name: string; // 国家全称
  shortName: string; // 简称 (2-4字)
  code: string; // 3位代码
  regime: PoliticalSystem; // 政体宪章
  color: string; // 疆域主色调
  accentColor: string; // 辅助强调色
  flagEmblem: string; // 国徽标识
  capital: string; // 首都城市
  leader: string; // 元首 / 执政长官
  foundedYear: number; // 建国时间
  controlledTileIds: string[]; // 所辖行省地块
  population: number; // 总人口 (万人)
  gdpIndex: number; // 综合经济指数 (亿创联点)
  resources: CountryResources; // 资源与国力指标
  militaryStrength: number; // 军务防御指数 (0-100)
  stability: number; // 内部稳定度 (0-100)
  ideology: string; // 核心立国方针
  description: string; // 国家概况
  alliances: string[]; // 盟友国家ID列表
  treaties?: BilateralTreaty[]; // 双边条约
  activeDoctrine?: StrategicDoctrine; // 当前核心战略国策
  creatorIdentity?: string; // 创作者标识
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  year: number;
  title: string;
  description: string;
  type: 'founding' | 'border' | 'regime' | 'diplomacy' | 'crisis' | 'era' | 'doctrine';
  countryId?: string;
  timestamp: string;
}

export interface WorldState {
  currentYear: number;
  eraName: string;
  scenarioName?: string;
  scenarioEra?: string;
  scenarioType?: '拟实' | '架空';
  scenarioDesc?: string;
  lastUpdated: string;
  countries: Country[];
  territories: TerritoryTile[];
  events: TimelineEvent[];
}

export type MapViewMode = 'political' | 'terrain' | 'zones' | 'population' | 'infrastructure';
