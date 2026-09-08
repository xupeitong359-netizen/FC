import { TikTokIcon } from './components/TikTokIcon';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
 Crown,
 Search,
 Filter,
 SlidersHorizontal,
 RotateCcw,
 Globe,
 Compass,
 Swords,
 HeartHandshake,
 ShieldCheck,
 Plus,
 Sparkles,
 RefreshCw,
 Landmark,
 Scale,
 Languages,
 Coins,
 MapPin,
 BookOpen,
 Edit3,
 Trash2,
 User,
 ShieldAlert,
 AlertTriangle,
 Info,
 Users,
 Activity,
 Building2,
 Shield,
 ChevronRight,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Nation, DiplomacyType, ConstructionQueueItem } from './types';
import { api } from './services/api';
import {
 STRATEGIC_BUILDINGS,
 StrategicBuildingType,
 calculateBuildingUpgradeCost,
 getMaxLevelForBuilding,
 getInfrastructureBonus,
 getTotalBuildingsInProvince,
 MAX_BUILDINGS_PER_PROVINCE,
} from './lib/constructionRules';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileTabBar } from './components/MobileTabBar';
import { NationCard } from './components/NationCard';
import { NationModal } from './components/NationModal';
import { NationFilterDrawer } from './components/NationFilterDrawer';
import { NationSearchModal } from './components/NationSearchModal';
import { WorkspaceModal } from './components/WorkspaceModal';
import { WorkspaceCreationWizard } from './components/WorkspaceCreationWizard';
import { CreateNationModal } from './components/CreateNationModal';
import { EditNationModal } from './components/EditNationModal';
import { DiplomacyModal } from './components/DiplomacyModal';
import { WorldMap } from './components/WorldMap';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { NationalStrategicDossier } from './components/NationalStrategicDossier';
import { AdminAuthModal } from './components/AdminAuthModal';
import { ConstructionModal } from './components/ConstructionModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { MilitaryIndustryDashboard } from './components/MilitaryIndustryDashboard';
import { MilitaryCostRuleTable } from './components/MilitaryCostRuleTable';
import { DisputeAndWarModal } from './components/DisputeAndWarModal';
import { DecreeAndCabinetModal } from './components/DecreeAndCabinetModal';
import { ChronicleAndMedalsModal } from './components/ChronicleAndMedalsModal';
import { ResearchPage } from './components/ResearchPage';
import { ArmyPage } from './components/ArmyPage';
import { NationalEconomyDashboard } from './components/NationalEconomyDashboard';
import { BugFeedbackModal } from './components/BugFeedbackModal';
import { SettingsDebugModal } from './components/SettingsDebugModal';
import { renderEmblemIcon, MilitaryFactoryPlantIcon, CivilianFactoryPlantIcon } from './lib/icons';
import { hydrateStrategicStorage } from './services/strategicGameplayService';
import { useEconomyTicker } from './lib/useEconomyTicker';
import { settleMilitaryProduction, getTotalMilitaryFactories } from './lib/militaryIndustry';
import { getTotalCivilianFactories } from './lib/economyEngine';
import { CommandSidebar } from './components/CommandSidebar';
import { DemographicsView } from './components/DemographicsView';
import { PoliticsAndGovernanceView } from './components/PoliticsAndGovernanceView';
import { StrategicResourcesView } from './components/StrategicResourcesView';
import { InternationalEmbargoView } from './components/InternationalEmbargoView';
import { WarCommandCenter } from './components/WarCommandCenter';
import { ProfileView } from './components/ProfileView';
import { NationalFocusTreePage } from './components/NationalFocusTreePage';
import { BrandSplashScreen } from './components/BrandSplashScreen';
import { MessagesView } from './components/MessagesView';

export type TabView =
 | 'lobby'
 | 'messages'
 | 'my_nation'
 | 'national_focus'
 | 'world_map'
 | 'workspace'
 | 'admin'
 | 'research'
 | 'army'
 | 'wars'
 | 'demographics'
 | 'politics'
 | 'resources'
 | 'embargo'
 | 'governance';

const MAX_CIV_FACTORIES_PER_QUEUE = 15;

function allocateConstructionFactories(queue: ConstructionQueueItem[], totalCivFactories: number) {
 let remaining = Math.max(0, totalCivFactories);
 // Completed projects are terminal records: their province upgrade has already been applied,
 // so they must not occupy a queue card or consume an allocation slot.
 return queue.filter((item) => item.status !== 'completed').map((item) => {
  const assigned = Math.min(MAX_CIV_FACTORIES_PER_QUEUE, remaining);
  remaining -= assigned;
  return {
   ...item,
   assignedFactories: assigned,
   allocatedCivFactories: assigned,
   status: assigned > 0 ? 'in_progress' as const : 'paused' as const,
  };
 });
}

function getNationCivilianFactories(nation: Nation | null | undefined): number {
 return getTotalCivilianFactories(nation);
}

function getNationMilitaryFactories(nation: Nation | null | undefined): number {
 return getTotalMilitaryFactories(nation);
}

function LiveCurrencyBalance({ nation }: { nation: Nation }) {
 const stats = useEconomyTicker(nation, true);
 const value = stats.currentTreasury.toLocaleString('zh-CN', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
 });

 return (
  <span className="font-mono text-[11px] font-bold tabular-nums text-emerald-700 group-hover:text-emerald-800">
   {stats.currencySymbol}{value}
  </span>
 );
}

function MainApp() {
 const { user, myNation, isAuthenticated, isAdmin, setMyNation, unreadNotifsCount, quickGuestLogin, logout, updateProfile } = useAuth();

 // Navigation Tab
 const [activeTab, setActiveTab] = useState<TabView>('lobby');
 const [myNationSubTab, setMyNationSubTab] = useState<'overview' | 'focus' | 'economy' | 'military'>('overview');
 const [targetNationToFocus, setTargetNationToFocus] = useState<Nation | null>(null);

 // Nations Data
 const [nations, setNations] = useState<Nation[]>([]);
 const [isLoadingNations, setIsLoadingNations] = useState(true);
 const [isInitialAppLoading, setIsInitialAppLoading] = useState(true);

 // Search & Filter
 const [searchTerm, setSearchTerm] = useState('');
 const [selectedRegime, setSelectedRegime] = useState('all');
 const [selectedIdeology, setSelectedIdeology] = useState('all');
 const [searchModalOpen, setSearchModalOpen] = useState(false);
 const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

 // Modals state
 const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
 const [workspaceWizardOpen, setWorkspaceWizardOpen] = useState(false);
 const [authModalOpen, setAuthModalOpen] = useState(false);
 const [adminAuthModalOpen, setAdminAuthModalOpen] = useState(false);
 const [bugFeedbackOpen, setBugFeedbackOpen] = useState(false);
 const [settingsModalOpen, setSettingsModalOpen] = useState(false);
 const [authDefaultMode, setAuthDefaultMode] = useState<'login' | 'register'>('login');
 const [createNationModalOpen, setCreateNationModalOpen] = useState(false);
 const [autoStartMapNationMode, setAutoStartMapNationMode] = useState(false);
 const [isMapSelectionMode, setIsMapSelectionMode] = useState(false);
 const [editNationModalOpen, setEditNationModalOpen] = useState(false);
 const [nationToEdit, setNationToEdit] = useState<Nation | null>(null);

 const [detailModalOpen, setDetailModalOpen] = useState(false);
 const [selectedNationForDetail, setSelectedNationForDetail] = useState<Nation | null>(null);

 const [diplomacyModalOpen, setDiplomacyModalOpen] = useState(false);
 const [targetNationForDiplomacy, setTargetNationForDiplomacy] = useState<Nation | null>(null);
 const [initialDipType, setInitialDipType] = useState<DiplomacyType>('peace');
 const [constructionModalOpen, setConstructionModalOpen] = useState(false);
 const [constructionPlacementBuilding, setConstructionPlacementBuilding] = useState<StrategicBuildingType | null>(null);

 // Strategic 4 Modules State
 const [disputeModalOpen, setDisputeModalOpen] = useState(false);
 const [disputeTargetNation, setDisputeTargetNation] = useState<Nation | null>(null);
 const [disputeTargetProvince, setDisputeTargetProvince] = useState<string | undefined>(undefined);
 const [decreeModalOpen, setDecreeModalOpen] = useState(false);
 const [chronicleModalOpen, setChronicleModalOpen] = useState(false);

 const handleOpenDispute = (target?: Nation, provinceName?: string) => {
  setDisputeTargetNation(target || null);
  setDisputeTargetProvince(provinceName || undefined);
  setDisputeModalOpen(true);
 };

 // Global Notification / Toast alert
 const [toastMessage, setToastMessage] = useState<string | null>(null);

 // Dangerous Confirmation Dialog
 const [confirmDialog, setConfirmDialog] = useState<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
 }>({
  isOpen: false,
  title: '',
  message: '',
  confirmText: '确定',
  isDangerous: false,
  onConfirm: () => {},
 });

 const handleClearTargetNationFocus = useCallback(() => {
  setTargetNationToFocus(null);
 }, []);

 const handleMapModeChange = useCallback((isSelecting: boolean) => {
  setIsMapSelectionMode(isSelecting);
 }, []);

 const showToast = (msg: string) => {
  setToastMessage(msg);
  setTimeout(() => setToastMessage(null), 4000);
 };

 useEffect(() => {
  const handleAppToast = (e: any) => {
   if (e.detail?.message) showToast(e.detail.message);
  };
  window.addEventListener('app-toast', handleAppToast);
  return () => window.removeEventListener('app-toast', handleAppToast);
 }, []);

 const myNationRef = useRef<Nation | null>(myNation);
 useEffect(() => {
  myNationRef.current = myNation;
 }, [myNation]);

 // Nation modules share one persistence path, so strategic state is retained remotely.
 const persistNationUpdate = useCallback((updated: Nation) => {
  setMyNation(updated);
  setNations((previous) => previous.map((nation) => (nation.id === updated.id ? updated : nation)));
  void api.nations.update(updated.id, updated).then((result) => {
   setMyNation(result.nation);
   setNations((previous) => previous.map((nation) => (nation.id === result.nation.id ? result.nation : nation)));
  }).catch((error) => console.warn('Nation persistence failed:', error));
 }, [setMyNation]);

 const userId = user?.id;
 const userRef = useRef(user);
 userRef.current = user;

 const fetchNations = useCallback(async (options?: { localOnly?: boolean; showLoading?: boolean }) => {
  const showLoading = options?.showLoading !== false;
  try {
   if (showLoading) setIsLoadingNations(true);
   const res = await api.nations.list({
    search: searchTerm || undefined,
    regime: selectedRegime !== 'all' ? selectedRegime : undefined,
    ideology: selectedIdeology !== 'all' ? selectedIdeology : undefined,
   }, { localOnly: options?.localOnly });
   const nationList = Array.isArray(res?.nations) ? res.nations : [];
   setNations(nationList);

   // Also update myNation in context if it changed
   const currentUser = userRef.current;
   if (currentUser) {
    const foundMine = nationList.find((n) => n.ownerId === currentUser.id);
    setMyNation((prev) => {
     if (!foundMine) return null;
     if (prev && prev.id === foundMine.id && prev.updatedAt === foundMine.updatedAt) {
      return prev;
     }
     return foundMine;
    });
   }
  } catch (err) {
   console.error('Failed to load nations:', err);
  } finally {
   if (showLoading) setIsLoadingNations(false);
  }
 }, [searchTerm, selectedRegime, selectedIdeology, setMyNation]);

  const isCreator = Boolean(
   user?.isCreator ||
   user?.isLingyuBaby ||
   user?.role === 'admin' ||
   user?.creatorId ||
   localStorage.getItem('creator_profile_auth')
  );

  const handleOpenWorkspaceWizard = () => {
   if (!isCreator) {
    showToast('仅已注册的创作者可构筑推演沙盘，请先注册/认证创作者账户');
    setAuthDefaultMode('register');
    setAuthModalOpen(true);
    return;
   }
   setWorkspaceWizardOpen(true);
  };

  const handleOpenAuthRegister = () => {
   setAuthDefaultMode('register');
   setAuthModalOpen(true);
  };

  useEffect(() => {
   const handleNationUpdated = (e: any) => {
    const updatedNation = e.detail?.nation;
    if (updatedNation) {
     setNations((prev) => prev.map((n) => (n.id === updatedNation.id ? updatedNation : n)));
     setMyNation((prev) => {
      const currentUserId = userRef.current?.id;
      if (prev?.id === updatedNation.id || (currentUserId && currentUserId === updatedNation.ownerId)) {
       return updatedNation;
      }
      return prev;
     });
    }
   };
   const handleRefreshNations = () => {
    void fetchNations({ showLoading: false });
   };

   const handleOpenCreateNation = () => {
    handleOpenWorkspaceWizard();
   };

   window.addEventListener('nation-updated', handleNationUpdated);
   window.addEventListener('refresh-nations', handleRefreshNations);
   window.addEventListener('open-create-nation', handleOpenCreateNation);
   window.addEventListener('open-workspace-wizard', handleOpenWorkspaceWizard);
   window.addEventListener('open-auth-register', handleOpenAuthRegister);

   return () => {
    window.removeEventListener('nation-updated', handleNationUpdated);
    window.removeEventListener('refresh-nations', handleRefreshNations);
    window.removeEventListener('open-create-nation', handleOpenCreateNation);
    window.removeEventListener('open-workspace-wizard', handleOpenWorkspaceWizard);
    window.removeEventListener('open-auth-register', handleOpenAuthRegister);
   };
  }, [setMyNation, fetchNations, isAuthenticated, user, isCreator]);

  useEffect(() => {
  const minTimer = setTimeout(() => {
   setIsInitialAppLoading(false);
  }, 1200);

  // Render the local archive first. A remote refresh then replaces it when
  // available, without trapping the lobby behind a full-screen loader.
  void fetchNations({ localOnly: true }).finally(() => {
   void fetchNations({ showLoading: false });
  });

  // Strategic data is supplementary and must never block the lobby.
  void hydrateStrategicStorage().catch((error) => {
   console.warn('Strategic archive sync deferred:', error);
  });

  return () => clearTimeout(minTimer);
 }, [fetchNations]);

 // Handler: Open Diplomacy modal
 const handleOpenDiplomacy = (nation: Nation, defaultType: DiplomacyType = 'peace') => {
  if (!isAuthenticated) {
   setAuthDefaultMode('login');
   setAuthModalOpen(true);
   return;
  }
  if (!myNation) {
   showToast(' 您尚未开创粉陆，请先创建属于您的粉陆再进行外交派遣！');
   setActiveTab('my_nation');
   return;
  }
  setTargetNationForDiplomacy(nation);
  setInitialDipType(defaultType);
  setDiplomacyModalOpen(true);
 };

 // Handler: View Nation detail
 const handleViewNation = (nation: Nation) => {
  setSelectedNationForDetail(nation);
  setDetailModalOpen(true);
 };

 // Handler: View Territory
 const handleViewTerritory = (nation: Nation) => {
  setTargetNationToFocus(nation);
  setActiveTab('world_map');
 };

 // Handler: Edit Nation
 const handleEditNation = (nation: Nation) => {
  if (!isAuthenticated) {
   setAuthModalOpen(true);
   return;
  }
  setNationToEdit(nation);
  setEditNationModalOpen(true);
 };

 // Handler: Delete Nation with Danger Confirmation
 const handleDeleteNation = (nation: Nation) => {
  if (!isAuthenticated) {
   setAuthModalOpen(true);
   return;
  }

  // Prevent deleting nation if currently in active war
  if ((nation.activeWars || []).length > 0) {
   showToast(` 国家【${nation.name}】当前处于交战状态，处于战争状态时无法解散国家！请先签署和平条约或投降。`);
   alert(`国家【${nation.name}】当前处于战时交火状态（共 ${(nation.activeWars || []).length} 场正在进行的战争）。\n\n根据国际公法与战时体制，交战中国家无法解散！请先达成停战和平条约或在军事指挥部宣布投降。`);
   return;
  }

  setConfirmDialog({
   isOpen: true,
   title: `确认解散国家【${nation.name}】？`,
   message: `解散国家为重大毁灭性决策！执行后，该国家将从世界地缘大厅彻底除名，领土将被释放为中立无主荒野。`,
   confirmText: '确认销毁并解散',
   isDangerous: true,
   onConfirm: async () => {
    try {
     const res = await api.nations.delete(nation.id);
     showToast(res.message);
     setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
     if (myNation?.id === nation.id) {
      setMyNation(null);
     }
     fetchNations();
    } catch (err: any) {
     alert(err.message || '解散国家失败');
    }
   },
  });
 };

 // Handler: Terminate Treaty with Confirmation
 const handleTerminateTreaty = (treatyId: string, withNationName: string) => {
  setConfirmDialog({
   isOpen: true,
   title: `废除与【${withNationName}】的外交条约`,
   message: `确定要单方面废除该项条约吗？对方国家将收到条约废除通报。`,
   confirmText: '确认废除',
   isDangerous: true,
   onConfirm: async () => {
    try {
     const res = await api.diplomacy.terminate(treatyId);
     showToast(res.message);
     setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
     fetchNations();
    } catch (err: any) {
     alert(err.message || '废除条约失败');
    }
   },
  });
 };

 // Handler: Add Building to Province Construction Queue from World Map click
 const handleBuildInProvince = async (
  provinceId: string | number,
  provinceName: string,
  buildingType: StrategicBuildingType
 ) => {
  if (!myNation) {
   showToast(' 您尚未开创粉陆，无法建造省份战略工程！');
   return;
  }

  const provIndex = (myNation.provinces || []).findIndex(
   (p) => String(p.id) === String(provinceId) || String(p.name) === String(provinceName)
  );

  if (provIndex === -1) {
   showToast(` 省份【${provinceName}】不属于您的粉陆主权领土！`);
   return;
  }

  const prov = myNation.provinces![provIndex];
  const detailed = prov.detailedBuildings || {
   infrastructure: 1,
   civilian_factory: typeof prov.civilianFactories === 'number' ? prov.civilianFactories : 1,
   military_factory: typeof prov.militaryFactories === 'number' ? prov.militaryFactories : 1,
  };

  const totalBuildings = getTotalBuildingsInProvince(detailed);
  if (totalBuildings >= MAX_BUILDINGS_PER_PROVINCE) {
   showToast(` 省份【${prov.name}】建筑总数已达 30 座上限，无法继续增建！`);
   return;
  }

  const currentLevel = (detailed as any)[buildingType] || 0;
  const maxLevel = getMaxLevelForBuilding(buildingType, myNation.radarTech || 'decimeter');
  if (typeof maxLevel === 'number' && currentLevel >= maxLevel) {
   showToast(
    ` 省份【${prov.name}】的【${STRATEGIC_BUILDINGS[buildingType].name}】已达到最高等级上限 (Lv.${maxLevel})！`
   );
   return;
  }

  const targetLevel = currentLevel + 1;
  const upgradeCost = calculateBuildingUpgradeCost(buildingType, currentLevel);
  const buildingInfo = STRATEGIC_BUILDINGS[buildingType];

  const newItem: ConstructionQueueItem = {
   id: 'cq-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
   buildingType,
   provinceId: prov.id,
   provinceName: prov.name,
   targetLevel,
   cost: upgradeCost,
   totalCost: upgradeCost,
   progress: 0,
   investedCapacity: 0,
   allocatedCivFactories: 0,
   assignedFactories: 0,
   speedBonus: getInfrastructureBonus(detailed.infrastructure || 1),
   createdAt: new Date().toISOString(),
   status: 'in_progress',
  };

  const updatedQueue = allocateConstructionFactories(
   [...(myNation.constructionQueue || []), newItem],
   getNationCivilianFactories(myNation)
  );

  try {
   const res = await api.nations.update(myNation.id, {
    constructionQueue: updatedQueue,
   });
   setMyNation(res.nation);
   setNations((prev) => prev.map((n) => (n.id === res.nation.id ? res.nation : n)));
   showToast(
    ` 已将【${prov.name} - ${buildingInfo.name} (Lv.${targetLevel})】加入建造队列！`
   );
  } catch (err: any) {
   showToast(` 下达建造指令失败: ${err.message || '网络错误'}`);
  }
 };

 // Handler: Cancel construction queue item
 const handleCancelConstruction = async (queueId: string) => {
  if (!myNation) return;
  const updatedQueue = (myNation.constructionQueue || []).filter((q) => q.id !== queueId);
  try {
   const res = await api.nations.update(myNation.id, {
    constructionQueue: updatedQueue,
   });
   setMyNation(res.nation);
   setNations((prev) => prev.map((n) => (n.id === res.nation.id ? res.nation : n)));
   showToast(' 已取消该项工程并释放分配的民用工厂产能');
  } catch (err: any) {
   showToast(` 取消工程失败: ${err.message || '网络错误'}`);
  }
 };

 // Handler: Reorder construction queue priority
 const handleReorderConstructionQueue = async (fromIndex: number, toIndex: number) => {
  if (!myNation) return;
  const queue = [...(myNation.constructionQueue || [])];
  if (fromIndex < 0 || fromIndex >= queue.length || toIndex < 0 || toIndex >= queue.length) return;
  const [moved] = queue.splice(fromIndex, 1);
  queue.splice(toIndex, 0, moved);
  const redistributedQueue = allocateConstructionFactories(queue, getNationCivilianFactories(myNation));
  try {
   const res = await api.nations.update(myNation.id, {
    constructionQueue: redistributedQueue,
   });
   setMyNation(res.nation);
   setNations((prev) => prev.map((n) => (n.id === res.nation.id ? res.nation : n)));
  } catch (err: any) {
   showToast(` 调整优先级失败: ${err.message || '网络错误'}`);
  }
 };

 // Advance queued projects once per minute. Work is based on the factories
 // actually allocated by priority, never the per-line maximum of 15.
 useEffect(() => {
  const advance = () => {
   const currentNation = myNationRef.current;
   if (!currentNation) return;
   const now = Date.now();
   const totalCiv = getNationCivilianFactories(currentNation);
   const originalQueue = currentNation.constructionQueue || [];
   const allocated = allocateConstructionFactories(originalQueue, totalCiv);
   let changed = allocated.length !== originalQueue.length || allocated.some((item, index) => {
    const previous = originalQueue[index];
    return item.assignedFactories !== previous?.assignedFactories ||
     item.allocatedCivFactories !== previous?.allocatedCivFactories ||
     item.status !== previous?.status;
   });
   let provinces = currentNation.provinces || [];

   const queue = allocated.map((item) => {
    if (item.status !== 'in_progress' || !item.assignedFactories) return item;
    const previousAt = Date.parse(item.lastCalculatedAt || item.createdAt);
    const elapsed = Math.max(0, now - (Number.isFinite(previousAt) ? previousAt : now));
    if (elapsed < 10_000) return item;
    const gained = (item.assignedFactories * 2000 * (1 + (item.speedBonus || 0)) * elapsed) / 86_400_000;
    const totalCost = item.totalCost || item.cost || 1;
    const progress = Math.min(totalCost, (item.progress || item.investedCapacity || 0) + gained);
    const completed = progress >= totalCost;
    changed = true;

    if (completed) {
     provinces = provinces.map((province) => {
      if (String(province.id) !== String(item.provinceId)) return province;
      const nextDetailed = { ...(province.detailedBuildings || {}), [item.buildingType]: item.targetLevel };
      const nextCiv = item.buildingType === 'civilian_factory' ? item.targetLevel : (nextDetailed.civilian_factory ?? province.civilianFactories ?? 1);
      const nextMil = item.buildingType === 'military_factory' ? item.targetLevel : (nextDetailed.military_factory ?? province.militaryFactories ?? 1);
      return {
       ...province,
       detailedBuildings: nextDetailed,
       civilianFactories: nextCiv,
       militaryFactories: nextMil,
      };
     });
    }
    return {
     ...item,
     progress,
     investedCapacity: progress,
     status: completed ? 'completed' as const : 'in_progress' as const,
     assignedFactories: completed ? 0 : item.assignedFactories,
     allocatedCivFactories: completed ? 0 : item.allocatedCivFactories,
     lastCalculatedAt: new Date(now).toISOString(),
    };
   });

   // 实时结算军工厂生产产出，避免军工厂装备不增加
   let nextMilitaryIndustry = currentNation.militaryIndustry;
   const { updatedStockpiles, lastUpdated, hasProduced } = settleMilitaryProduction(currentNation, now);
   if (hasProduced) {
    changed = true;
    nextMilitaryIndustry = {
     ...(currentNation.militaryIndustry || { productionLines: [], customDesigns: [], stockpiles: {} }),
     stockpiles: updatedStockpiles,
     lastUpdated,
    };
   }

   if (changed) {
    persistNationUpdate({
     ...currentNation,
     provinces,
     constructionQueue: allocateConstructionFactories(queue, totalCiv),
     militaryIndustry: nextMilitaryIndustry,
    });
   }
  };

  const timer = window.setInterval(() => {
   advance();
   api.processCombatTicks();
  }, 60_000);
  return () => window.clearInterval(timer);
 }, [persistNationUpdate]);

 // Listen for peaceful expansion events from WorldMap
 useEffect(() => {
  const handleExpand = async (e: any) => {
   if (!myNation) return;
   const prov = e.detail.province;
   const updatedProvinces = [...(myNation.provinces || []), prov];
   try {
    const res = await api.nations.update(myNation.id, { provinces: updatedProvinces });
    setMyNation(res.nation);
    setNations((prev) => prev.map((n) => (n.id === res.nation.id ? res.nation : n)));
    showToast(` 成功扩张至【${prov.name}】！`);
   } catch (err: any) {
    showToast(` 扩张失败: ${err.message}`);
   }
  };
  window.addEventListener('map-peaceful-expand', handleExpand);
  return () => window.removeEventListener('map-peaceful-expand', handleExpand);
 }, [myNation]);

 // Global Tactical Hotkeys Listener (F1 Map, F2 Economy, F3 Research, F4 Construction, Space Pause/Run)
 const [isSimulationPaused, setIsSimulationPaused] = useState(false);

 useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
   // Ignore if active element is an editable field
   const activeTag = document.activeElement?.tagName.toLowerCase();
   const isEditable =
    activeTag === 'input' ||
    activeTag === 'textarea' ||
    (document.activeElement as HTMLElement)?.isContentEditable;

   if (isEditable) return;

   if (e.key === 'F1') {
    e.preventDefault();
    setActiveTab('world_map');
    showToast(' 战术快捷键 [F1]：已切换至宏观世界地图');
   } else if (e.key === 'F2') {
    e.preventDefault();
    setActiveTab('my_nation');
    setMyNationSubTab('economy');
    showToast(' 战术快捷键 [F2]：已切换至宏观经济内政');
   } else if (e.key === 'F3') {
    e.preventDefault();
    setActiveTab('research');
    showToast(' 战术快捷键 [F3]：已切换至科研科技树');
   } else if (e.key === 'F4') {
    e.preventDefault();
    setConstructionModalOpen((prev) => !prev);
    showToast(' 战术快捷键 [F4]：已唤出军工建造工程部');
   } else if (e.code === 'Space' && !e.repeat) {
    // Space to toggle simulation pause / tick
    e.preventDefault();
    setIsSimulationPaused((prev) => {
     const next = !prev;
     showToast(next ? '⏸ 战局推演：已暂停实时时间流逝' : '▶ 战局推演：恢复全域战略时间推演');
     return next;
    });
   }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
 }, []);

 // Compute stats
 const totalNations = nations.length;
 const activeWarsCount = nations.reduce((acc, n) => acc + (n.activeWars?.length || 0), 0) / 2;
 const activeTreatiesCount = nations.reduce((acc, n) => acc + (n.activeTreaties?.length || 0), 0) / 2;
 // A war is stored by both participants. Collapse those mirrored records into one war-room entry.
 const currentWars = useMemo(() => {
  const seen = new Set<string>();
  return nations.flatMap((nation) => (nation.activeWars || []).flatMap((war) => {
   const pairKey = [nation.id, war.withNationId].sort().join(':');
   if (seen.has(pairKey)) return [];
   seen.add(pairKey);
   return [{ ...war, nation, opponent: nations.find((item) => item.id === war.withNationId) || null }];
  }));
 }, [nations]);

 return (
  <>
   <BrandSplashScreen isLoading={isInitialAppLoading} />
   <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-indigo-100 selection:text-indigo-900">
    {/* Command Navigation Sidebar for Desktop */}
    <CommandSidebar
     activeTab={activeTab}
     setActiveTab={setActiveTab}
     activeWarsCount={activeWarsCount}
     unreadNotifsCount={unreadNotifsCount}
     onOpenAdminPrompt={() => setAdminAuthModalOpen(true)}
    />

   <div className={`flex-1 flex flex-col min-w-0 relative ${activeTab === 'world_map' || activeTab === 'research' || activeTab === 'national_focus' || activeTab === 'workspace' ? 'h-screen overflow-hidden pb-0' : 'pb-20 md:pb-0 h-screen overflow-y-auto'}`}>
    {/* Navigation Header for Non-Map, Non-Research, Non-Focus, Non-Workspace Tabs */}
    <AnimatePresence>
     {activeTab !== 'world_map' && activeTab !== 'research' && activeTab !== 'national_focus' && activeTab !== 'workspace' && (
      <motion.div
       key="top-navbar-wrapper"
       initial={{ y: -80, opacity: 0 }}
       animate={{ y: 0, opacity: 1 }}
       exit={{
        y: -90,
        opacity: 0,
        transition: {
         duration: 0.22,
         ease: [0.32, 0, 0.67, 0],
        },
       }}
       transition={{
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
       }}
       className="sticky top-0 z-40 w-full"
      >
       <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={(mode) => {
         setAuthDefaultMode(mode || 'login');
         setAuthModalOpen(true);
        }}
        onOpenAdminPrompt={() => setAdminAuthModalOpen(true)}
        onOpenBugFeedback={() => setBugFeedbackOpen(true)}
         onOpenSettings={() => setSettingsModalOpen(true)}
         onOpenCreateNation={handleOpenWorkspaceWizard}
         onOpenConstruction={() => setConstructionModalOpen(true)}
        onOpenWorkspace={() => setActiveTab('workspace')}
        onRefreshNations={fetchNations}
       />
      </motion.div>
     )}
    </AnimatePresence>

    {/* Global Toast */}
    {toastMessage && (
     <div className="fixed top-4 right-4 z-50 px-3.5 py-2 bg-slate-900/95 text-slate-100 border border-slate-700/80 shadow-2xl backdrop-blur-md rounded-xl text-xs font-mono flex items-center gap-2 max-w-md animate-fadeIn">
      <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
      <span className="leading-snug">{toastMessage}</span>
     </div>
    )}

   {/* Main Container */}
   <main className={`flex-1 w-full flex flex-col ${activeTab === 'world_map' || activeTab === 'research' || activeTab === 'national_focus' || activeTab === 'workspace' ? 'p-0 h-full overflow-hidden relative' : 'py-2 sm:py-4'}`}>
    {/* VIEW 1: LOBBY (国家页面) */}
    {activeTab === 'lobby' && (
     <div className="flex-1 flex flex-col animate-fadeIn">
      {/* Top Header Row with Title and Independent Search/Filter Buttons on the Same Line */}
      <div className="px-2 sm:px-4 mb-3 sm:mb-4 flex items-center justify-between gap-3">
       <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-700 flex items-center justify-center flex-shrink-0">
         <Crown className="w-4 h-4" />
        </div>
        <div className="min-w-0">
         <div className="flex items-baseline gap-2.5">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap">粉陆</h1>
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
           {totalNations} 个粉陆
          </span>
         </div>
        </div>
       </div>

       {/* Right Action Icons: Reset, Search (⌕), Filter (☷ / Sliders) */}
       <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {(searchTerm.trim() || selectedRegime !== 'all' || selectedIdeology !== 'all') && (
         <button
          type="button"
          onClick={() => {
           setSearchTerm('');
           setSelectedRegime('all');
           setSelectedIdeology('all');
          }}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          title="重置全部筛选与搜索"
         >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">重置</span>
         </button>
        )}

        {/* 1. Independent Search Button (⌕ / Search icon) */}
        <button
         id="lobby-search-trigger"
         type="button"
         onClick={() => setSearchModalOpen(true)}
         className={`relative w-8 h-8 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
          searchTerm.trim()
           ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-2xs'
           : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 shadow-xs hover:text-slate-900'
         }`}
         title={searchTerm.trim() ? `当前搜索: "${searchTerm}"` : '搜索粉陆'}
         aria-label="搜索粉陆"
        >
         <Search className="w-4 h-4" />
         {searchTerm.trim() && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
           <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600 ring-2 ring-white" />
          </span>
         )}
        </button>

        {/* 2. Independent Filter Button (☷ / Sliders icon) */}
        <button
         id="lobby-filter-drawer-trigger"
         type="button"
         onClick={() => setFilterDrawerOpen(true)}
         className={`relative w-8 h-8 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
          selectedRegime !== 'all' || selectedIdeology !== 'all'
           ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-2xs'
           : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 shadow-xs hover:text-slate-900'
         }`}
         title="政体与意识形态筛选"
         aria-label="政体与意识形态筛选"
        >
         <SlidersHorizontal className="w-4 h-4" />
         {(selectedRegime !== 'all' || selectedIdeology !== 'all') && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
           <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600 ring-2 ring-white" />
          </span>
         )}
        </button>
       </div>
      </div>

      {/* Nations Grid */}
      {isLoadingNations && nations.length === 0 ? (
       <div className="p-16 text-center">
        <span className="w-8 h-8 border-3 border-indigo-100 border-t-indigo-600 rounded-full animate-spin inline-block mb-3" />
        <p className="text-sm text-slate-500">正在召集全球粉陆档案...</p>
       </div>
      ) : nations.length === 0 ? (
       <div className="p-10 sm:p-14 text-center bg-white border border-slate-200/90 rounded-3xl shadow-xs max-w-lg mx-auto my-6 sm:my-10">
        <div className="w-16 h-16 bg-indigo-50/90 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xs">
         <Crown className="w-8 h-8 text-indigo-500" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">未搜索到粉陆</h3>
        <p className="text-sm text-slate-500 mt-1.5 mb-6 max-w-sm mx-auto leading-relaxed">
         {searchTerm.trim() || selectedRegime !== 'all' || selectedIdeology !== 'all'
          ? '未匹配到符合当前检索条件的粉陆，您可以重置筛选条件或亲自开创全新粉陆！'
          : '您可以清除搜索词或亲自开创属于您的第一个崭新粉陆！'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
         {(searchTerm.trim() || selectedRegime !== 'all' || selectedIdeology !== 'all') && (
          <button
           type="button"
           onClick={() => {
            setSearchTerm('');
            setSelectedRegime('all');
            setSelectedIdeology('all');
           }}
           className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
           <RotateCcw className="w-4 h-4 text-slate-500" /> 重置筛选
          </button>
         )}
         <button
          type="button"
          onClick={handleOpenWorkspaceWizard}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
          title={isCreator ? '分步构筑推演沙盘' : '仅已注册的创作者可以跳转'}
         >
          <Plus className="w-4 h-4" /> 构筑推演沙盘
         </button>
        </div>
       </div>
      ) : (
       <div className="bg-white border-y sm:border border-slate-200 sm:rounded-3xl shadow-sm overflow-hidden flex-1 sm:mx-4 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
         {nations.map((nation) => (
          <div key={nation.id} className="border-b border-r border-slate-100 h-full">
           <NationCard
            nation={nation}
            onViewDetails={handleViewNation}
            onViewTerritory={handleViewTerritory}
            onOpenDiplomacy={handleOpenDiplomacy}
            onEdit={handleEditNation}
            onDelete={handleDeleteNation}
           />
          </div>
         ))}
        </div>
       </div>
      )}
     </div>
    )}

    {/* VIEW: MESSAGES (消息中心) */}
    {activeTab === 'messages' && (
      <MessagesView
        user={user}
        myNation={myNation}
        nations={nations}
        onNavigateTab={(tab) => setActiveTab(tab as TabView)}
        onOpenDiplomacy={(target) => {
          setTargetNationForDiplomacy(target);
          setInitialDipType('peace');
          setDiplomacyModalOpen(true);
        }}
        showToast={showToast}
      />
    )}

    {/* VIEW 2: MY NATION / PROFILE (领主个人主页与国家治理中枢) */}
    {activeTab === "my_nation" && (
      <ProfileView
        user={user}
        myNation={myNation}
        nations={nations}
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        onOpenAuth={(mode) => {
          if (mode) setAuthDefaultMode(mode);
          setAuthModalOpen(true);
        }}
        onQuickGuestLogin={quickGuestLogin}
        onLogout={logout}
        onOpenCreateNation={() => setCreateNationModalOpen(true)}
        onOpenWorkspace={() => setWorkspaceModalOpen(true)}
        onEditNation={handleEditNation}
        onDeleteNation={handleDeleteNation}
        onUpdateNation={persistNationUpdate}
        onOpenDispute={handleOpenDispute}
        onOpenDecrees={() => setDecreeModalOpen(true)}
        onOpenChronicle={() => setChronicleModalOpen(true)}
        onOpenDiplomacy={handleOpenDiplomacy}
        onTerminateTreaty={handleTerminateTreaty}
        onOpenConstruction={() => setConstructionModalOpen(true)}
        onNavigateTab={(tab) => setActiveTab(tab as any)}
        showToast={showToast}
        updateProfile={updateProfile}
      />
    )}

    {/* VIEW 3: WORLD MAP (世界地图) */}
    {activeTab === 'world_map' && (
     <motion.div
      key="world-map-fullscreen"
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.985 }}
      transition={{
       duration: 0.42,
       ease: [0.16, 1, 0.3, 1], // Non-linear quintic out smooth curve
      }}
      className="flex-1 w-full h-full flex flex-col overflow-hidden"
     >
      <WorldMap
       nations={nations}
       onSelectNation={handleViewNation}
       onOpenDiplomacy={handleOpenDiplomacy}
       targetNationToFocus={targetNationToFocus}
       clearTargetNationFocus={handleClearTargetNationFocus}
       onOpenConstruction={() => setConstructionModalOpen(true)}
       constructionPlacementBuilding={constructionPlacementBuilding}
       onCancelConstructionPlacement={() => setConstructionPlacementBuilding(null)}
       onChangeConstructionBuilding={(b) => setConstructionPlacementBuilding(b)}
       myNation={myNation}
       onBuildInProvince={handleBuildInProvince}
       onOpenDispute={handleOpenDispute}
       onOpenArmyCommand={() => setActiveTab('army')}
       onOpenResources={() => setActiveTab('resources')}
      />
     </motion.div>
    )}

    {/* VIEW: WAR THEATER OPERATIONS (国家统帅部·战争指挥作战厅) */}
    {activeTab === 'wars' && (
     <div className="flex-1 animate-fadeIn px-3 sm:px-5 lg:px-7 py-4 sm:py-6">
      <WarCommandCenter
       nation={myNation}
       allNations={nations}
       onOpenDisputeModal={handleOpenDispute}
       onNavigateToMap={() => setActiveTab('world_map')}
       onOpenDiplomacy={handleOpenDiplomacy}
      />
     </div>
    )}

    {/* VIEW: DEMOGRAPHICS (人口社会动态系统) */}
    {activeTab === 'demographics' && (
     <div className="flex-1 animate-fadeIn">
      <DemographicsView nation={myNation} onNavigateTab={setActiveTab} />
     </div>
    )}

    {/* VIEW: POLITICS & GOVERNANCE (政治体制与国家治理公署) */}
    {(activeTab === 'politics' || activeTab === 'governance') && (
     <div className="flex-1 animate-fadeIn px-3 sm:px-5 lg:px-7 py-4 sm:py-6">
      <PoliticsAndGovernanceView
       nation={myNation}
       onOpenDecreeModal={() => setDecreeModalOpen(true)}
       onNavigateTab={setActiveTab}
      />
     </div>
    )}

    {/* VIEW: STRATEGIC RESOURCES (战略资源储备产销中枢) */}
    {activeTab === 'resources' && (
     <div className="flex-1 animate-fadeIn px-3 sm:px-5 lg:px-7 py-4 sm:py-6">
      <StrategicResourcesView
       nation={myNation}
       onNavigateToMap={() => setActiveTab('world_map')}
      />
     </div>
    )}

    {/* VIEW: INTERNATIONAL EMBARGO & SANCTIONS (贸易禁运与制裁) */}
    {activeTab === 'embargo' && (
     <div className="flex-1 animate-fadeIn px-3 sm:px-5 lg:px-7 py-4 sm:py-6">
      <InternationalEmbargoView
       nation={myNation}
       allNations={nations}
       onPersistNation={persistNationUpdate}
       onNavigateToMap={() => setActiveTab('world_map')}
      />
     </div>
    )}

    {/* VIEW 4: ARMY COMMAND (陆军指挥) */}
    {activeTab === 'army' && (
     <ArmyPage nation={myNation} onUpdateNation={persistNationUpdate} showToast={showToast} />
    )}

    {/* VIEW: NATIONAL FOCUS (国家战略国策树) */}
    {activeTab === 'national_focus' && (
     <div className="flex-1 w-full h-full flex flex-col overflow-hidden animate-fadeIn">
      <NationalFocusTreePage
       nation={myNation}
       onUpdateNation={persistNationUpdate}
       onClose={() => {
        setMyNationSubTab('overview');
        setActiveTab('lobby');
       }}
       onNavigateTab={(tab) => {
        setMyNationSubTab('overview');
        setActiveTab(tab as any);
       }}
      />
     </div>
    )}

    {/* VIEW 5: RESEARCH (国家科研与科技树) */}
    {activeTab === 'research' && (
     <div className="flex-1 w-full h-full flex flex-col overflow-hidden animate-fadeIn">
      <ResearchPage
       nation={myNation}
       onUpdateNation={persistNationUpdate}
       showToast={showToast}
       onNavigateToMap={() => setActiveTab('world_map')}
      />
     </div>
    )}

    {/* VIEW: WORKSPACE PAGE (推演工作区全屏页面) */}
    {activeTab === 'workspace' && (
     <div className="flex-1 w-full h-full flex flex-col overflow-hidden animate-fadeIn">
      <WorkspaceModal
       isOpen
       variant="page"
       nations={nations}
       myNation={myNation}
       onSelectNation={handleViewNation}
       onOpenDiplomacy={handleOpenDiplomacy}
       onClose={() => setActiveTab('lobby')}
       onOpenAuth={(mode) => {
        setAuthDefaultMode(mode || 'register');
        setAuthModalOpen(true);
       }}
       onWorkspaceSelected={(ws) => {
        showToast(`已切换至推演工作区：${ws.name}（${ws.era}）`);
       }}
      />
     </div>
    )}

    {/* VIEW 5: ADMIN (管理员模式) */}
    {activeTab === 'admin' && isAdmin && (
     <div className="animate-fadeIn">
      <AdminPanel
       nations={nations}
       onEditNation={handleEditNation}
       onDeleteNation={handleDeleteNation}
       onRefreshData={fetchNations}
      />
     </div>
    )}
   </main>

   {/* Mobile Bottom Tab Bar - hidden when in focused map selection mode */}
   {!isMapSelectionMode && (
    <MobileTabBar
     activeTab={activeTab}
     setActiveTab={setActiveTab}
     onOpenCreateNation={handleOpenWorkspaceWizard}
     onOpenWorkspace={() => setActiveTab('workspace')}
    />
   )}
   </div>

   {/* Modals */}
   <BugFeedbackModal isOpen={bugFeedbackOpen} onClose={() => setBugFeedbackOpen(false)} />

    <SettingsDebugModal
     isOpen={settingsModalOpen}
     onClose={() => setSettingsModalOpen(false)}
     showToast={showToast}
    />

   <AdminAuthModal
    isOpen={adminAuthModalOpen}
    onClose={() => setAdminAuthModalOpen(false)}
    onSuccess={(msg) => showToast(msg)}
   />

   <AuthModal
    isOpen={authModalOpen}
    defaultMode={authDefaultMode}
    onClose={() => setAuthModalOpen(false)}
   />

   <WorkspaceModal
    isOpen={workspaceModalOpen}
    nations={nations}
    myNation={myNation}
    onSelectNation={handleViewNation}
    onOpenDiplomacy={handleOpenDiplomacy}
    onClose={() => setWorkspaceModalOpen(false)}
    onOpenAuth={(mode) => {
     setAuthDefaultMode(mode || 'register');
     setAuthModalOpen(true);
    }}
    onWorkspaceSelected={(ws) => {
     showToast(`已切换至推演工作区：${ws.name}（${ws.era}）`);
    }}
   />

   <WorkspaceCreationWizard
    isOpen={workspaceWizardOpen}
    onClose={() => setWorkspaceWizardOpen(false)}
    isCreator={isCreator}
    onOpenAuth={(mode) => {
     setAuthDefaultMode(mode || 'register');
     setAuthModalOpen(true);
    }}
    user={user}
    onSuccess={(createdWs) => {
     setWorkspaceWizardOpen(false);
     showToast(`已成功发布沙盘【${createdWs.name}】，立即启动地图圈地建国！`);
     // 自动切换至全景地图并开启地图建国流程
     setActiveTab('world_map');
     setAutoStartMapNationMode(true);
     setCreateNationModalOpen(true);
     setIsMapSelectionMode(true);
    }}
   />

   <CreateNationModal
    isOpen={createNationModalOpen}
    initialMapMode={autoStartMapNationMode}
    onClose={() => {
     setCreateNationModalOpen(false);
     setAutoStartMapNationMode(false);
     setIsMapSelectionMode(false);
    }}
    onMapModeChange={handleMapModeChange}
    onEnterMapMode={() => {
     setActiveTab('world_map');
     setIsMapSelectionMode(true);
    }}
    onSuccess={() => {
     setIsMapSelectionMode(false);
     setAutoStartMapNationMode(false);
     showToast('🎉 恭喜！您的粉陆已正式开创成立并录入全球大厅！');
     fetchNations();
     setActiveTab('my_nation');
    }}
   />

   <EditNationModal
    isOpen={editNationModalOpen}
    nation={nationToEdit}
    onClose={() => {
     setEditNationModalOpen(false);
     setNationToEdit(null);
    }}
    onSuccess={(updated) => {
     showToast(`粉陆【${updated.name}】信息已成功更新！`);
     fetchNations();
    }}
   />

   <NationModal
    isOpen={detailModalOpen}
    nation={selectedNationForDetail}
    onClose={() => {
     setDetailModalOpen(false);
     setSelectedNationForDetail(null);
    }}
    onOpenDiplomacy={(n, type) => handleOpenDiplomacy(n, type)}
    onEdit={(n) => handleEditNation(n)}
    onDelete={(n) => handleDeleteNation(n)}
    onTerminateTreaty={handleTerminateTreaty}
    onOpenDispute={(n) => handleOpenDispute(n)}
    onUpdateNation={(updated) => {
     setSelectedNationForDetail(updated);
     if (myNation?.id === updated.id) {
      setMyNation(updated);
     }
     setNations((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    }}
    showToast={showToast}
   />

   {/* Strategic Gameplay 4 Modals */}
   <DisputeAndWarModal
    isOpen={disputeModalOpen}
    onClose={() => {
     setDisputeModalOpen(false);
     setDisputeTargetNation(null);
     setDisputeTargetProvince(undefined);
    }}
    myNation={myNation}
    allNations={nations}
    onUpdateNation={persistNationUpdate}
    onShowToast={showToast}
    initialTargetNation={disputeTargetNation}
    initialProvinceName={disputeTargetProvince}
   />

   <DecreeAndCabinetModal
    isOpen={decreeModalOpen}
    onClose={() => setDecreeModalOpen(false)}
    myNation={myNation}
    allNations={nations}
    onUpdateNation={persistNationUpdate}
    onShowToast={showToast}
   />

   <ChronicleAndMedalsModal
    isOpen={chronicleModalOpen}
    onClose={() => setChronicleModalOpen(false)}
    myNation={myNation}
    onUpdateNation={(updated) => {
     setMyNation(updated);
     setNations((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    }}
    onShowToast={showToast}
   />

   <DiplomacyModal
    isOpen={diplomacyModalOpen}
    targetNation={targetNationForDiplomacy}
    initialType={initialDipType}
    onClose={() => {
     setDiplomacyModalOpen(false);
     setTargetNationForDiplomacy(null);
    }}
    onSuccess={(msg) => {
     showToast(msg);
     fetchNations();
    }}
   />

   <ConstructionModal
    isOpen={constructionModalOpen}
    nation={myNation}
    onClose={() => setConstructionModalOpen(false)}
    onStartMapPlacement={(b) => {
     setConstructionPlacementBuilding(b);
     setConstructionModalOpen(false);
     setActiveTab('world_map');
    }}
    onBuildInProvince={handleBuildInProvince}
    onCancelQueueItem={handleCancelConstruction}
    onReorderQueueItem={handleReorderConstructionQueue}
    onUpdateNation={(updated) => {
     setMyNation(updated);
     setNations((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    }}
    showToast={showToast}
   />

   <ConfirmDialog
    isOpen={confirmDialog.isOpen}
    title={confirmDialog.title}
    message={confirmDialog.message}
    confirmText={confirmDialog.confirmText}
    isDangerous={confirmDialog.isDangerous}
    onConfirm={confirmDialog.onConfirm}
    onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
   />

   {/* Nation Search Modal (Fast Keyword Search) */}
   <NationSearchModal
    isOpen={searchModalOpen}
    onClose={() => setSearchModalOpen(false)}
    searchTerm={searchTerm}
    onSearchChange={setSearchTerm}
    totalResultsCount={nations.length}
   />

   {/* Nation Filter Bottom Drawer (Regime & Ideology) */}
   <NationFilterDrawer
    isOpen={filterDrawerOpen}
    onClose={() => setFilterDrawerOpen(false)}
    selectedRegime={selectedRegime}
    onRegimeChange={setSelectedRegime}
    selectedIdeology={selectedIdeology}
    onIdeologyChange={setSelectedIdeology}
    totalResultsCount={nations.length}
    onReset={() => {
     setSelectedRegime('all');
     setSelectedIdeology('all');
    }}
   />
  </div>
  </>
 );
}

export default function App() {
 return (
  <AuthProvider>
   <MainApp />
  </AuthProvider>
 );
}
