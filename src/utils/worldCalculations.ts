import {
  Country,
  CountryResources,
  PoliticalSystem,
  StrategicDoctrine,
  TerritoryTile,
  TreatyType,
} from '../types';

export function calculateCountryMetrics(
  tileIds: string[],
  allTerritories: TerritoryTile[],
  regime: PoliticalSystem,
  doctrine?: StrategicDoctrine
): {
  population: number;
  gdpIndex: number;
  resources: CountryResources;
  militaryStrength: number;
  stability: number;
} {
  const tiles = allTerritories.filter((t) => tileIds.includes(t.id));

  let totalPop = 0;
  let totalInd = 0;
  let totalRes = 0;

  tiles.forEach((tile) => {
    totalPop += tile.basePopulation;
    totalInd += tile.baseIndustry;
    totalRes += tile.baseResources;
  });

  // Multipliers based on regime
  let popMod = 1.0;
  let indMod = 1.0;
  let resMod = 1.0;
  let infraMod = 1.0;
  let milBase = 70;
  let stabBase = 85;

  switch (regime) {
    case '创联民主同盟':
      popMod = 1.15;
      indMod = 1.1;
      resMod = 1.1;
      infraMod = 1.25;
      milBase = 80;
      stabBase = 92;
      break;
    case '议会立宪邦':
      popMod = 1.05;
      indMod = 1.05;
      resMod = 1.0;
      infraMod = 1.15;
      milBase = 82;
      stabBase = 88;
      break;
    case '工造公社联合体':
      popMod = 0.95;
      indMod = 1.4;
      resMod = 1.3;
      infraMod = 1.35;
      milBase = 80;
      stabBase = 90;
      break;
    case '军务督抚同盟':
      popMod = 0.9;
      indMod = 1.15;
      resMod = 1.2;
      infraMod = 1.05;
      milBase = 95;
      stabBase = 80;
      break;
    case '自由城邦同盟':
      popMod = 1.1;
      indMod = 1.2;
      resMod = 1.05;
      infraMod = 1.3;
      milBase = 74;
      stabBase = 87;
      break;
    case '中央协约共和国':
      popMod = 1.05;
      indMod = 1.05;
      resMod = 1.05;
      infraMod = 1.2;
      milBase = 78;
      stabBase = 91;
      break;
    case '总督开拓辖区':
      popMod = 0.95;
      indMod = 1.25;
      resMod = 1.35;
      infraMod = 1.1;
      milBase = 88;
      stabBase = 76;
      break;
    case '神权保民官廷':
      popMod = 1.2;
      indMod = 0.9;
      resMod = 1.1;
      infraMod = 1.0;
      milBase = 84;
      stabBase = 94;
      break;
    case '商业行会托拉斯':
      popMod = 1.0;
      indMod = 1.3;
      resMod = 1.15;
      infraMod = 1.35;
      milBase = 72;
      stabBase = 83;
      break;
    case '生态游牧联邦':
      popMod = 0.85;
      indMod = 0.8;
      resMod = 1.4;
      infraMod = 0.9;
      milBase = 85;
      stabBase = 89;
      break;
  }

  const finalPop = Math.round(totalPop * popMod);
  const crystal = Math.round(totalRes * 1.8 * resMod);
  const industry = Math.round(totalInd * 1.5 * indMod);
  const agriculture = Math.round(totalPop * 0.32 * popMod);
  const energy = Math.round((totalRes + totalInd) * 0.95 * resMod);
  const infrastructure = Math.round((totalInd * 0.8 + totalPop * 0.15) * infraMod);

  const gdp = Math.round(
    (industry * 1.2 + crystal * 0.8 + energy * 0.5 + agriculture * 0.4 + infrastructure * 0.6) * 0.65
  );

  return {
    population: finalPop,
    gdpIndex: gdp,
    resources: {
      crystal,
      industry,
      agriculture,
      energy,
      infrastructure,
    },
    militaryStrength: Math.min(99, Math.max(40, Math.round(milBase + tiles.length * 2))),
    stability: Math.min(99, Math.max(45, Math.round(stabBase - (tiles.length > 6 ? 4 : 0)))),
  };
}

export function generateCreatorCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 4; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `T4-PL-${p1}-${p2}`;
}

export const EMBLEM_OPTIONS = [
  { id: 'compass', label: '创联罗盘', desc: '象征全球拓荒与多边协同' },
  { id: 'crown', label: '皇室王冠', desc: '象征宪制法统与主权尊严' },
  { id: 'layers', label: '工造晶阵', desc: '象征高阶工业与系统工程' },
  { id: 'shield', label: '守望重盾', desc: '象征边防要塞与军武卫戍' },
  { id: 'landmark', label: '自由商殿', desc: '象征大洋商港与法理契约' },
  { id: 'scale', label: '协约天平', desc: '象征多边平衡与宪政法典' },
  { id: 'building', label: '开拓堡垒', desc: '象征矿脉勘探与重工统领' },
  { id: 'sun', label: '黎明光芒', desc: '象征万邦复兴与文明繁荣' },
];

export const REGIME_OPTIONS: { name: PoliticalSystem; desc: string; icon: string }[] = [
  { name: '创联民主同盟', desc: '基于创联宪章的去中心化民主邦联，注重基建与多边协同', icon: 'compass' },
  { name: '议会立宪邦', desc: '保留立宪法统地位，议会与内阁执掌实际行政与外交', icon: 'crown' },
  { name: '工造公社联合体', desc: '以工程师、工匠联合会与规划评议会为主导的重工实体', icon: 'layers' },
  { name: '中央协约共和国', desc: '依托多边协约与宪政法典构建的稳固联邦共和制', icon: 'scale' },
  { name: '自由城邦同盟', desc: '由多个具有独立主权的自治商港城邦组成的经贸大联盟', icon: 'landmark' },
  { name: '总督开拓辖区', desc: '统领前沿矿脉与能源基建的重工业军民开拓实体', icon: 'building' },
  { name: '军务督抚同盟', desc: '由边防督抚与卫戍将领组成的常备防卫统帅体制', icon: 'shield' },
  { name: '商业行会托拉斯', desc: '跨区域商业行会与联合产业财阀执政的商政共同体', icon: 'landmark' },
  { name: '神权保民官廷', desc: '以创联古训与星火信仰保民官为核心的道德公理体制', icon: 'sun' },
  { name: '生态游牧联邦', desc: '尊重原始水系与自然灵晶脉搏的游牧自治部族联盟', icon: 'compass' },
];

export const DOCTRINE_OPTIONS: { id: StrategicDoctrine; name: string; desc: string; effect: string }[] = [
  {
    id: '全境深度工业化',
    name: '全境深度工业化',
    desc: '开采战略矿藏，加速扩建骨干重工业工厂与制造基地',
    effect: '工业实力提升 25%，基础设施指数提升 15%',
  },
  {
    id: '海陆通商拓荒',
    name: '海陆通商拓荒',
    desc: '开拓沿海大洋商港，签订多边自由贸易关税协定',
    effect: '经济综合指数提升 20%，贸易收益大幅增长',
  },
  {
    id: '边防要塞常备',
    name: '边防要塞常备',
    desc: '在险要关隘构筑永久性防御工事，部署战备卫戍部队',
    effect: '军事防御指数提升 30%，国家内部稳定度 +10',
  },
  {
    id: '民生安定与复兴',
    name: '民生安定与复兴',
    desc: '普及农业丰产技术，兴修水利水运，安抚全境各省民心',
    effect: '农业产出提升 20%，稳定度提升至 95% 以上',
  },
  {
    id: '源晶矿脉深采',
    name: '源晶矿脉深采',
    desc: '探明地下深层高纯度源晶富集带，建立提炼精炼枢纽',
    effect: '创联源晶产出提升 40%，战略能源储备 +25%',
  },
  {
    id: '大洋航运枢纽',
    name: '大洋航运枢纽',
    desc: '贯通海峡深水航道，建立全球航路灯塔与补给港群',
    effect: '海区行省发展速度加快，综合经济指数显著增强',
  },
];

export const TREATY_OPTIONS: { type: TreatyType; name: string; desc: string }[] = [
  { type: '全面同盟协定', name: '全面同盟协定', desc: '缔结生死与共的战略盟友关系，共同防御外敌入侵' },
  { type: '互不侵犯公约', name: '互不侵犯公约', desc: '双方承诺尊重现有疆域界标，十年内互不诉诸军事冲突' },
  { type: '自由贸易通商', name: '自由贸易通商', desc: '免除边境关税壁垒，开放商队与物资无阻碍过境' },
  { type: '军事要塞互助', name: '军事要塞互助', desc: '共享边境预警情报，允许盟军进驻补给与要塞驻防' },
  { type: '源晶联合开发', name: '源晶联合开发', desc: '跨界联合勘探深层晶脉，按比例共享能源精炼产出' },
];

export const COLOR_PALETTE = [
  { label: '创联靛蓝', value: '#4f46e5' },
  { label: '极地宝蓝', value: '#2563eb' },
  { label: '苍蓝海穹', value: '#0284c7' },
  { label: '晨星青葱', value: '#0d9488' },
  { label: '平原翠绿', value: '#059669' },
  { label: '绯樱绯红', value: '#e11d48' },
  { label: '蔷薇粉彩', value: '#db2777' },
  { label: '暮光紫罗', value: '#7c3aed' },
  { label: '赤砂琥珀', value: '#ea580c' },
  { label: '炽热金砂', value: '#d97706' },
  { label: '玄曜精钢', value: '#475569' },
];

export function generateCountryCode(name: string): string {
  if (!name) return 'CTY';
  // If latin letters are in name
  const latinChars = name.replace(/[^A-Za-z]/g, '').toUpperCase();
  if (latinChars.length >= 3) {
    return latinChars.slice(0, 3);
  }
  // Generate code based on string hash or random
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const a = chars[Math.abs(hash) % 26];
  const b = chars[Math.abs(hash >> 3) % 26];
  const c = chars[Math.abs(hash >> 6) % 26];
  return `${a}${b}${c}`;
}

