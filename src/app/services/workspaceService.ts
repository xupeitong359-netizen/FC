import { ProvinceStrategicResources } from '../types';

export interface WorkspaceComment {
  id: string;
  workspaceId: string;
  authorName: string;
  authorAvatar?: string;
  authorColor?: string;
  content: string;
  createdAt: string;
  isGuest?: boolean;
}

export interface WorkspaceChronicle {
  id: string;
  workspaceId: string;
  year: string;
  title: string;
  category: 'battle' | 'treaty' | 'crisis' | 'politics' | 'focus';
  content: string;
  factions?: string[];
  tensionChange?: string;
  authorName: string;
  authorRole?: string;
  likesCount?: number;
  createdAt: string;
}

export interface WorkspaceRulesConfig {
  paceMode?: 'turn' | 'realtime' | 'free';
  warTaxCap?: number;
  conversionRate?: string;
  nukeAllowed?: boolean;
  maxAllies?: number;
  arbitrationEnabled?: boolean;
  joinPolicy?: 'open' | 'apply' | 'spectate';
  victoryCondition?: 'domination' | 'treaty' | 'endless';
  initialTension?: number;
}

export interface CustomProvinceOverride {
  id: string | number;
  name?: string;
  manpower?: number;
  populationName?: string;
  terrainType?: string;
  resources?: ProvinceStrategicResources;
  modifiedAt?: string;
}

export interface WorkspaceItem {
  id: string;
  name: string;
  era: string;
  visibility: 'public' | 'private';
  creatorId: string;
  creatorName: string;
  description?: string;
  scenarioType?: '拟实' | '架空';
  scenarioName?: string;
  scenarioEra?: string;
  scenarioDesc?: string;
  totemIcon?: string;
  themeColor?: string;
  rulesConfig?: WorkspaceRulesConfig;
  coreFactions?: string[];
  joinPolicy?: 'open' | 'apply' | 'spectate';
  victoryCondition?: 'domination' | 'treaty' | 'endless';
  initialTension?: number;
  licenseType?: string;
  createdAt: string;
  updatedAt?: string;
  likesCount: number;
  likedUserIds: string[];
  comments: WorkspaceComment[];
  chronicles?: WorkspaceChronicle[];
  provinceOverrides?: Record<string, CustomProvinceOverride>;
}

const STORAGE_KEY_WORKSPACES = 'chuanglian_workspaces_v1';
const STORAGE_KEY_ACTIVE_WORKSPACE = 'chuanglian_active_workspace_id';
const STORAGE_KEY_GUEST_COMMENT_COUNT = 'chuanglian_guest_comments_count';
const STORAGE_KEY_LIKED_WORKSPACES = 'chuanglian_guest_liked_workspaces';

const DEFAULT_CHRONICLES: WorkspaceChronicle[] = [
  {
    id: 'chr_1',
    workspaceId: 'ws_default_1936',
    year: '1936.03',
    title: '莱茵非军事区重军化：凡尔赛防线初现动荡',
    category: 'crisis',
    content: '德意志先锋营开入莱茵河左岸。英法外交使团进入紧急斡旋，欧洲地缘均势被打破。',
    factions: ['德意志国', '法兰西第三共和国', '大英帝国'],
    tensionChange: '+5%',
    authorName: '地缘观察哨',
    authorRole: '战略参谋',
    likesCount: 24,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'chr_2',
    workspaceId: 'ws_default_1936',
    year: '1936.07',
    title: '西班牙半岛战火蔓延：首轮装甲与战鹰试炼',
    category: 'battle',
    content: '国民军与共和国军在托莱多及马德里外围激烈交火，多国志愿航空队与装甲分队进驻半岛。',
    factions: ['西班牙共和国', '西班牙国民军', '国际志愿军'],
    tensionChange: '+8%',
    authorName: '马德里战线参谋',
    authorRole: '前线记者',
    likesCount: 31,
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
  {
    id: 'chr_3',
    workspaceId: 'ws_default_1936',
    year: '1936.11',
    title: '柏林-罗马轴心协同公约签署',
    category: 'treaty',
    content: '确立双边地缘互信与东地中海至中欧势力协调，大国同盟版图开始剧烈分化。',
    factions: ['德意志国', '意大利王国'],
    tensionChange: '+4%',
    authorName: '外交总署',
    authorRole: '外交公使',
    likesCount: 19,
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
  },
  {
    id: 'chr_4',
    workspaceId: 'ws_default_1936',
    year: '1937.07',
    title: '卢沟桥事变爆发：东方主战场全民动员',
    category: 'battle',
    content: '宛平城守军奋勇抵抗，全国各界发布通电结成统一战线，东方全面反侵略持久战正式开启。',
    factions: ['中华民国', '远东战区防卫军'],
    tensionChange: '+15%',
    authorName: '战区统帅部',
    authorRole: '远东观察员',
    likesCount: 56,
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: 'chr_5',
    workspaceId: 'ws_default_1936',
    year: '1938.09',
    title: '慕尼黑地缘协定签定：绥靖政策抵达极限',
    category: 'treaty',
    content: '英法德意四国代表达成苏台德交割方案，捷克斯洛伐克边境要塞群丧失，欧洲局势加速恶化。',
    factions: ['大英帝国', '法兰西第三共和国', '德意志国'],
    tensionChange: '+10%',
    authorName: '中欧防卫委员会',
    authorRole: '战略参谋',
    likesCount: 22,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'chr_6',
    workspaceId: 'ws_default_1936',
    year: '1939.05',
    title: '诺门罕哈拉哈河战役：远东坦克合围战捷报',
    category: 'battle',
    content: '朱可夫兵团实施装甲双钳合围，重挫敌方边境进攻力量，确立远东边境战略稳定。',
    factions: ['苏维埃联盟', '蒙古人民共和国'],
    tensionChange: '+6%',
    authorName: '第57特别军司令部',
    authorRole: '装甲参谋',
    likesCount: 38,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'chr_7',
    workspaceId: 'ws_default_1936',
    year: '1939.08',
    title: '莫斯科苏德互不侵犯条约及密约缔结',
    category: 'treaty',
    content: '两强达成十年互不侵犯协议并划分东欧势力缓冲圈，为东线赢得工业迁徙与战略重组窗口。',
    factions: ['苏维埃联盟', '德意志国'],
    tensionChange: '+12%',
    authorName: '对外人民委员部',
    authorRole: '外交公使',
    likesCount: 27,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'chr_8',
    workspaceId: 'ws_default_1936',
    year: '1939.09',
    title: '第一号最高战备通令：欧战全面爆发',
    category: 'battle',
    content: '前线突破边境防线，英法根据集体安全公约向侵略方正式宣战，世界进入全面战火状态。',
    factions: ['德意志国', '波兰共和国', '大英帝国', '法兰西第三共和国'],
    tensionChange: '+30%',
    authorName: '联合最高司令部',
    authorRole: '总参谋长',
    likesCount: 68,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'chr_9',
    workspaceId: 'ws_default_1936',
    year: '架空新历',
    title: '粉陆大陆立宪互保公约：领主自主推演开启',
    category: 'focus',
    content: '全球推演创作者在粉陆中心确立万邦自决公约，允许领主自由规划省份边界、调动工业资源。',
    factions: ['粉陆自由邦联', '创世工坊'],
    tensionChange: '-10%',
    authorName: '创联工坊委员会',
    authorRole: '世界架构师',
    likesCount: 82,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_INITIAL_WORKSPACE: WorkspaceItem = {
  id: 'ws_default_1936',
  name: '1936 全球风云地缘沙盘',
  era: '1936年',
  visibility: 'public',
  creatorId: 'usr_dev_system',
  creatorName: '创联世界官方',
  description: '全球地缘战略与推演默认工作区，包含1936年标准大战略疆域与地貌环境。',
  totemIcon: 'landmark',
  themeColor: '#6366f1',
  rulesConfig: {
    paceMode: 'turn',
    warTaxCap: 25,
    conversionRate: '15%',
    nukeAllowed: false,
    maxAllies: 0,
    arbitrationEnabled: true,
  },
  coreFactions: ['德意志国', '苏维埃联盟', '大英帝国', '中华民国', '美利坚合众国'],
  licenseType: 'CC-BY-NC 自由派生',
  createdAt: new Date().toISOString(),
  likesCount: 128,
  likedUserIds: [],
  comments: [
    {
      id: 'cmt_1',
      workspaceId: 'ws_default_1936',
      authorName: '地缘推演家',
      authorAvatar: undefined,
      authorColor: '#6366f1',
      content: '工作区地图很完整，欢迎各位领主在不同年代剧本中进行外交博弈与粉陆演进！',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      isGuest: false,
    },
    {
      id: 'cmt_2',
      workspaceId: 'ws_default_1936',
      authorName: '访客探员88',
      authorColor: '#10b981',
      content: '支持自由开创粉陆和拖框批量修改地形，体验非常顺畅。',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      isGuest: true,
    }
  ],
  chronicles: DEFAULT_CHRONICLES,
  provinceOverrides: {},
};

export const workspaceService = {
  getWorkspaces(): WorkspaceItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WORKSPACES);
      if (!raw) {
        const initial = [DEFAULT_INITIAL_WORKSPACE];
        localStorage.setItem(STORAGE_KEY_WORKSPACES, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(raw);
    } catch {
      return [DEFAULT_INITIAL_WORKSPACE];
    }
  },

  saveWorkspaces(workspaces: WorkspaceItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_WORKSPACES, JSON.stringify(workspaces));
      window.dispatchEvent(new CustomEvent('workspaces-updated', { detail: { workspaces } }));
    } catch (e) {
      console.error('Failed to save workspaces', e);
    }
  },

  getActiveWorkspaceId(): string {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_WORKSPACE) || 'ws_default_1936';
  },

  setActiveWorkspaceId(id: string): void {
    localStorage.setItem(STORAGE_KEY_ACTIVE_WORKSPACE, id);
    window.dispatchEvent(new CustomEvent('active-workspace-changed', { detail: { workspaceId: id } }));
  },

  getActiveWorkspace(): WorkspaceItem {
    const list = this.getWorkspaces();
    const activeId = this.getActiveWorkspaceId();
    const found = list.find((w) => w.id === activeId);
    return found || list[0] || DEFAULT_INITIAL_WORKSPACE;
  },

  createWorkspace(payload: {
    name: string;
    era: string;
    visibility: 'public' | 'private';
    description?: string;
    scenarioType?: '拟实' | '架空';
    scenarioName?: string;
    scenarioEra?: string;
    scenarioDesc?: string;
    totemIcon?: string;
    themeColor?: string;
    rulesConfig?: WorkspaceRulesConfig;
    coreFactions?: string[];
    joinPolicy?: 'open' | 'apply' | 'spectate';
    victoryCondition?: 'domination' | 'treaty' | 'endless';
    initialTension?: number;
    licenseType?: string;
    creatorId: string;
    creatorName: string;
  }): WorkspaceItem {
    const list = this.getWorkspaces();
    const wsId = 'ws_' + Math.random().toString(36).substring(2, 9);
    
    // Initial founding chronicle
    const initialChronicle: WorkspaceChronicle = {
      id: 'chr_' + Math.random().toString(36).substring(2, 9),
      workspaceId: wsId,
      year: payload.era || '纪元启程',
      title: `推演工作区【${payload.name.trim()}】正式建立`,
      category: 'focus',
      content: payload.description?.trim() || `世界观架构师【${payload.creatorName}】确立了本沙盘的初始地缘法则与文明格局。`,
      factions: payload.coreFactions && payload.coreFactions.length > 0 ? payload.coreFactions : ['文明同盟'],
      tensionChange: '0%',
      authorName: payload.creatorName,
      authorRole: '世界架构师',
      likesCount: 1,
      createdAt: new Date().toISOString(),
    };

    const newWs: WorkspaceItem = {
      id: wsId,
      name: payload.name.trim() || payload.scenarioName?.trim() || '未命名工作区',
      era: payload.era || payload.scenarioEra || '1936年',
      visibility: payload.visibility || 'public',
      creatorId: payload.creatorId,
      creatorName: payload.creatorName,
      description: payload.description?.trim() || payload.scenarioDesc?.trim() || '',
      scenarioType: payload.scenarioType || '拟实',
      scenarioName: payload.scenarioName || payload.name,
      scenarioEra: payload.scenarioEra || payload.era,
      scenarioDesc: payload.scenarioDesc || payload.description,
      totemIcon: payload.totemIcon || 'landmark',
      themeColor: payload.themeColor || '#6366f1',
      rulesConfig: payload.rulesConfig || {
        paceMode: 'turn',
        warTaxCap: 25,
        conversionRate: '15%',
        nukeAllowed: false,
        maxAllies: 0,
        arbitrationEnabled: true,
      },
      coreFactions: payload.coreFactions || [],
      joinPolicy: payload.joinPolicy || payload.rulesConfig?.joinPolicy || 'open',
      victoryCondition: payload.victoryCondition || payload.rulesConfig?.victoryCondition || 'domination',
      initialTension: payload.initialTension ?? payload.rulesConfig?.initialTension ?? 25,
      licenseType: payload.licenseType || 'CC-BY-NC 自由派生',
      createdAt: new Date().toISOString(),
      likesCount: 0,
      likedUserIds: [],
      comments: [],
      chronicles: [initialChronicle],
      provinceOverrides: {},
    };

    const nextList = [newWs, ...list];
    this.saveWorkspaces(nextList);
    this.setActiveWorkspaceId(newWs.id);
    return newWs;
  },

  // 编年史战报管理
  getChronicles(workspaceId: string): WorkspaceChronicle[] {
    const list = this.getWorkspaces();
    const ws = list.find((w) => w.id === workspaceId);
    if (!ws) return DEFAULT_CHRONICLES;
    if (!ws.chronicles || ws.chronicles.length === 0) {
      return DEFAULT_CHRONICLES;
    }
    return ws.chronicles;
  },

  addChronicle(
    workspaceId: string,
    data: {
      year: string;
      title: string;
      category: 'battle' | 'treaty' | 'crisis' | 'politics' | 'focus';
      content: string;
      factions?: string[];
      tensionChange?: string;
      authorName: string;
      authorRole?: string;
    }
  ): WorkspaceChronicle {
    const list = this.getWorkspaces();
    const index = list.findIndex((w) => w.id === workspaceId);
    
    const newChr: WorkspaceChronicle = {
      id: 'chr_' + Math.random().toString(36).substring(2, 9),
      workspaceId,
      year: data.year.trim() || '当前纪元',
      title: data.title.trim(),
      category: data.category,
      content: data.content.trim(),
      factions: data.factions || [],
      tensionChange: data.tensionChange || '0%',
      authorName: data.authorName.trim() || '战区参谋部',
      authorRole: data.authorRole || '战地观察员',
      likesCount: 0,
      createdAt: new Date().toISOString(),
    };

    if (index !== -1) {
      const prevChr = list[index].chronicles || [];
      list[index].chronicles = [newChr, ...prevChr];
      this.saveWorkspaces(list);
    }

    window.dispatchEvent(new CustomEvent('chronicle-added', { detail: { workspaceId, chronicle: newChr } }));
    return newChr;
  },

  toggleChronicleLike(workspaceId: string, chronicleId: string): number {
    const list = this.getWorkspaces();
    const index = list.findIndex((w) => w.id === workspaceId);
    if (index === -1) return 0;

    const ws = list[index];
    if (!ws.chronicles) return 0;

    const cIndex = ws.chronicles.findIndex((c) => c.id === chronicleId);
    if (cIndex === -1) return 0;

    ws.chronicles[cIndex].likesCount = (ws.chronicles[cIndex].likesCount || 0) + 1;
    list[index] = ws;
    this.saveWorkspaces(list);
    return ws.chronicles[cIndex].likesCount;
  },

  updateWorkspace(id: string, updates: Partial<WorkspaceItem>): WorkspaceItem {
    const list = this.getWorkspaces();
    const index = list.findIndex((w) => w.id === id);
    if (index === -1) throw new Error('工作区未找到');

    const updated = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    this.saveWorkspaces(list);
    return updated;
  },

  // 访客/用户点赞（单作品单用户/设备仅可点赞一次）
  toggleLike(workspaceId: string, userIdOrDeviceId: string): { liked: boolean; likesCount: number } {
    const list = this.getWorkspaces();
    const index = list.findIndex((w) => w.id === workspaceId);
    if (index === -1) return { liked: false, likesCount: 0 };

    const ws = list[index];
    // Check localStorage device liked set
    let localLikedMap: Record<string, boolean> = {};
    try {
      localLikedMap = JSON.parse(localStorage.getItem(STORAGE_KEY_LIKED_WORKSPACES) || '{}');
    } catch {}

    const alreadyLiked = ws.likedUserIds.includes(userIdOrDeviceId) || !!localLikedMap[workspaceId];
    if (alreadyLiked) {
      // Already liked: no duplicate liking (单作品仅一次)
      return { liked: true, likesCount: ws.likesCount };
    }

    // Add like
    ws.likesCount = (ws.likesCount || 0) + 1;
    ws.likedUserIds.push(userIdOrDeviceId);
    localLikedMap[workspaceId] = true;
    try {
      localStorage.setItem(STORAGE_KEY_LIKED_WORKSPACES, JSON.stringify(localLikedMap));
    } catch {}

    list[index] = ws;
    this.saveWorkspaces(list);
    return { liked: true, likesCount: ws.likesCount };
  },

  hasLiked(workspaceId: string, userIdOrDeviceId: string): boolean {
    const ws = this.getWorkspaces().find((w) => w.id === workspaceId);
    if (!ws) return false;
    if (ws.likedUserIds.includes(userIdOrDeviceId)) return true;
    try {
      const localLikedMap = JSON.parse(localStorage.getItem(STORAGE_KEY_LIKED_WORKSPACES) || '{}');
      return !!localLikedMap[workspaceId];
    } catch {
      return false;
    }
  },

  // 访客评论限制检查（超过3条需注册）
  getGuestCommentCount(): number {
    try {
      return Number(localStorage.getItem(STORAGE_KEY_GUEST_COMMENT_COUNT) || 0);
    } catch {
      return 0;
    }
  },

  incrementGuestCommentCount(): number {
    const count = this.getGuestCommentCount() + 1;
    try {
      localStorage.setItem(STORAGE_KEY_GUEST_COMMENT_COUNT, String(count));
    } catch {}
    return count;
  },

  addComment(workspaceId: string, comment: {
    authorName: string;
    authorAvatar?: string;
    authorColor?: string;
    content: string;
    isGuest: boolean;
  }): { success: boolean; comment?: WorkspaceComment; requiresAuth?: boolean; message?: string } {
    if (comment.isGuest) {
      const currentCount = this.getGuestCommentCount();
      if (currentCount >= 3) {
        return {
          success: false,
          requiresAuth: true,
          message: '访客免登录留言已达上限（3条），请注册或登录账户继续互动',
        };
      }
      this.incrementGuestCommentCount();
    }

    const list = this.getWorkspaces();
    const index = list.findIndex((w) => w.id === workspaceId);
    if (index === -1) return { success: false, message: '工作区不存在' };

    const newComment: WorkspaceComment = {
      id: 'cmt_' + Math.random().toString(36).substring(2, 9),
      workspaceId,
      authorName: comment.authorName || (comment.isGuest ? '匿名访客' : '领主'),
      authorAvatar: comment.authorAvatar,
      authorColor: comment.authorColor || '#6366f1',
      content: comment.content.trim(),
      createdAt: new Date().toISOString(),
      isGuest: comment.isGuest,
    };

    list[index].comments = [newComment, ...(list[index].comments || [])];
    this.saveWorkspaces(list);
    return { success: true, comment: newComment };
  },

  // 省份自定义数据修改 (人口、名称、资源、地形类型)
  setProvinceOverride(workspaceId: string, provinceId: string | number, data: Partial<CustomProvinceOverride>): void {
    const list = this.getWorkspaces();
    const index = list.findIndex((w) => w.id === workspaceId);
    if (index === -1) return;

    const ws = list[index];
    if (!ws.provinceOverrides) ws.provinceOverrides = {};
    
    const key = String(provinceId);
    const existing = ws.provinceOverrides[key] || { id: provinceId };
    ws.provinceOverrides[key] = {
      ...existing,
      ...data,
      modifiedAt: new Date().toISOString(),
    };

    list[index] = ws;
    this.saveWorkspaces(list);
    window.dispatchEvent(new CustomEvent('province-override-updated', {
      detail: { workspaceId, provinceId, data: ws.provinceOverrides[key] }
    }));
  },

  // 批量修改选定省份数据（用于拖框选）
  batchSetProvinceOverrides(
    workspaceId: string,
    provinceIds: (string | number)[],
    batchData: {
      terrainType?: string;
      manpowerMultiplier?: number;
      manpowerFixed?: number;
      addResources?: ProvinceStrategicResources;
      setResources?: ProvinceStrategicResources;
      namePrefix?: string;
    }
  ): number {
    const list = this.getWorkspaces();
    const index = list.findIndex((w) => w.id === workspaceId);
    if (index === -1 || provinceIds.length === 0) return 0;

    const ws = list[index];
    if (!ws.provinceOverrides) ws.provinceOverrides = {};

    let modifiedCount = 0;
    provinceIds.forEach((pid) => {
      const key = String(pid);
      const prev = ws.provinceOverrides![key] || { id: pid };
      const updated: CustomProvinceOverride = { ...prev };

      if (batchData.terrainType) {
        updated.terrainType = batchData.terrainType;
      }
      if (typeof batchData.manpowerFixed === 'number') {
        updated.manpower = batchData.manpowerFixed;
      } else if (typeof batchData.manpowerMultiplier === 'number') {
        const baseManpower = updated.manpower || 1500000;
        updated.manpower = Math.round(baseManpower * batchData.manpowerMultiplier);
      }
      if (batchData.setResources) {
        updated.resources = { ...batchData.setResources };
      } else if (batchData.addResources) {
        updated.resources = {
          oil: (updated.resources?.oil || 0) + (batchData.addResources.oil || 0),
          steel: (updated.resources?.steel || 0) + (batchData.addResources.steel || 0),
          aluminium: (updated.resources?.aluminium || 0) + (batchData.addResources.aluminium || 0),
          rubber: (updated.resources?.rubber || 0) + (batchData.addResources.rubber || 0),
          tungsten: (updated.resources?.tungsten || 0) + (batchData.addResources.tungsten || 0),
          chromium: (updated.resources?.chromium || 0) + (batchData.addResources.chromium || 0),
        };
      }
      if (batchData.namePrefix && prev.name) {
        updated.name = `${batchData.namePrefix}${prev.name}`;
      }

      updated.modifiedAt = new Date().toISOString();
      ws.provinceOverrides![key] = updated;
      modifiedCount++;
    });

    list[index] = ws;
    this.saveWorkspaces(list);
    window.dispatchEvent(new CustomEvent('province-batch-override-updated', {
      detail: { workspaceId, count: modifiedCount }
    }));
    return modifiedCount;
  }
};
