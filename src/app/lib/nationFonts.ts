export interface NationFontOption {
  id: string;
  name: string;
  category: string;
  fontFamily: string;
  previewSample: string;
  description: string;
  fontStretch?: string;
  letterSpacing?: number;
}

export const NATION_FONT_OPTIONS: NationFontOption[] = [
  {
    id: 'condensed',
    name: '战术窄黑 (默认)',
    category: '大战略',
    fontFamily: '"Barlow Condensed", "Oswald", "Arial Narrow", "Impact", "Noto Sans SC", sans-serif',
    previewSample: 'HUANGLONG · 战备沙盘',
    description: '紧凑刚毅，大战略地图标绘经典风格，曲率延伸极佳',
    fontStretch: 'condensed',
    letterSpacing: 0.1,
  },
  {
    id: 'sans',
    name: '现代无衬线',
    category: '现代政务',
    fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Heiti SC", system-ui, sans-serif',
    previewSample: '主权共和国 · 现代疆界',
    description: '字型饱满方正、极高可辨识度，适合近现代民主与联邦国家',
    fontStretch: 'normal',
    letterSpacing: 0.05,
  },
  {
    id: 'serif',
    name: '庄严宋体',
    category: '历史王朝',
    fontFamily: '"Noto Serif SC", "Songti SC", "SimSun", "STSong", "Georgia", serif',
    previewSample: '大明皇朝 · 舆地万国',
    description: '刀刻宋体、历史厚重感强烈，适合传统封建帝国与古文明',
    fontStretch: 'normal',
    letterSpacing: 0.08,
  },
  {
    id: 'kaiti',
    name: '东方楷体',
    category: '东方美学',
    fontFamily: '"STKaiti", "KaiTi", "BiauKai", "Noto Serif SC", serif',
    previewSample: '九州社稷 · 锦绣江山',
    description: '东方书法运笔清逸秀丽，展现典雅东方神韵与国风气派',
    fontStretch: 'normal',
    letterSpacing: 0.12,
  },
  {
    id: 'fangsong',
    name: '条约仿宋',
    category: '政务纪律',
    fontFamily: '"STFangsong", "FangSong", "SimSun", serif',
    previewSample: '国家公署 · 宪章公报',
    description: '清朗峻拔，具有国家政府法典文书与正式外交公文的严谨权威',
    fontStretch: 'normal',
    letterSpacing: 0.06,
  },
  {
    id: 'cinzel',
    name: '罗马史诗',
    category: '古典铭刻',
    fontFamily: '"Cinzel", "Trajan Pro", "Times New Roman", "Baskerville", serif',
    previewSample: 'IMPERIUM · 纪念碑铭文',
    description: '西方古典大理石铭文体，气势雄浑，适合泛欧帝国与古典阵营',
    fontStretch: 'normal',
    letterSpacing: 0.15,
  },
];

export function getNationFontFamily(fontId?: string): string {
  if (!fontId) return NATION_FONT_OPTIONS[0].fontFamily;
  const match = NATION_FONT_OPTIONS.find((f) => f.id === fontId);
  return match ? match.fontFamily : fontId;
}

export function getNationFontOption(fontId?: string): NationFontOption {
  if (!fontId) return NATION_FONT_OPTIONS[0];
  const match = NATION_FONT_OPTIONS.find((f) => f.id === fontId);
  return match || NATION_FONT_OPTIONS[0];
}
