/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Country,
  CreatorProfile,
  StrategicDoctrine,
  TerritoryTile,
  TimelineEvent,
  TreatyType,
  UserRole,
  WorldState,
} from './types';
import {
  INITIAL_COUNTRIES,
  INITIAL_TERRITORIES,
  INITIAL_TIMELINE,
  INITIAL_WORLD_STATE,
} from './data/initialWorldData';
import { calculateCountryMetrics } from './utils/worldCalculations';

// Components
import { TopNavbar } from './components/TopNavbar';
import { WorldMap } from './components/WorldMap';
import { CountryInspector } from './components/CountryInspector';
import { CountryListSidebar } from './components/CountryListSidebar';
import { CreateCountryModal } from './components/CreateCountryModal';
import { EditCountryModal } from './components/EditCountryModal';
import { CreatorModal } from './components/CreatorModal';
import { WorldTimeModal } from './components/WorldTimeModal';
import { TimelineModal } from './components/TimelineModal';
import { TerritoryPaintBar } from './components/TerritoryPaintBar';
import { WorldSimulationModal } from './components/WorldSimulationModal';

const STORAGE_KEY_WORLD = 'T4NEW_WORLD_STATE_V2';
const STORAGE_KEY_CREATOR = 'T4NEW_CREATOR_PROFILE_V2';

export default function App() {
  // World State initialization
  const [worldState, setWorldState] = useState<WorldState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WORLD);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse saved world state', e);
    }
    return INITIAL_WORLD_STATE;
  });

  // Creator Profile & Role initialization
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CREATOR);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse creator profile', e);
    }
    return {
      creatorCode: 'CR-8829-XPL',
      identityName: '林初霁',
      scenarioName: '粉陆纪元·开天辟地',
      scenarioEra: '1936年',
      scenarioType: '架空',
      scenarioDesc: '粉陆大陆秩序初定，万邦立宪自决，重构全球文明版图与政治格局。',
      activatedAt: new Date().toISOString(),
    };
  });

  const [userRole, setUserRole] = useState<UserRole>(() => (creatorProfile ? 'creator' : 'visitor'));

  // Sync role if creator profile changes
  useEffect(() => {
    if (creatorProfile) {
      setUserRole('creator');
      localStorage.setItem(STORAGE_KEY_CREATOR, JSON.stringify(creatorProfile));
    } else {
      setUserRole('visitor');
      localStorage.removeItem(STORAGE_KEY_CREATOR);
    }
  }, [creatorProfile]);

  // Persist world state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WORLD, JSON.stringify(worldState));
    } catch (e) {
      console.error('Failed to persist world state', e);
    }
  }, [worldState]);

  // UI Navigation & Selection State
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCountryListOpen, setIsCountryListOpen] = useState<boolean>(false);

  // Modals
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState<boolean>(false);
  const [isCreateCountryModalOpen, setIsCreateCountryModalOpen] = useState<boolean>(false);
  const [isEditCountryModalOpen, setIsEditCountryModalOpen] = useState<boolean>(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState<boolean>(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState<boolean>(false);
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState<boolean>(false);

  // Simulation Logs
  const [simulationLogs, setSimulationLogs] = useState<string[]>([
    '创联历第248年全球经济周期结算就绪。',
    '《粉陆创联民主联邦与晨星公社全面同盟协定》正常履约中。',
  ]);

  // Territory Painting Mode State
  const [isPaintingMode, setIsPaintingMode] = useState<boolean>(false);
  const [paintingCountryId, setPaintingCountryId] = useState<string | null>(null);

  // Active selected country
  const selectedCountry = useMemo(() => {
    if (!selectedCountryId) return null;
    return worldState.countries.find((c) => c.id === selectedCountryId) || null;
  }, [selectedCountryId, worldState.countries]);

  // Country for editing
  const countryToEdit = useMemo(() => {
    if (!selectedCountryId) return null;
    return worldState.countries.find((c) => c.id === selectedCountryId) || null;
  }, [selectedCountryId, worldState.countries]);

  // Unassigned territories for new country modal
  const unassignedTerritories = useMemo(() => {
    return worldState.territories.filter((t) => !t.countryId);
  }, [worldState.territories]);

  // Handle Tile Selection
  const handleSelectTile = useCallback(
    (tileId: string | null) => {
      setSelectedTileId(tileId);
      if (tileId) {
        const tile = worldState.territories.find((t) => t.id === tileId);
        if (tile && tile.countryId) {
          setSelectedCountryId(tile.countryId);
        }
      }
    },
    [worldState.territories]
  );

  // Handle Country Selection
  const handleSelectCountry = useCallback((countryId: string | null) => {
    setSelectedCountryId(countryId);
    if (countryId) {
      const firstTile = worldState.territories.find((t) => t.countryId === countryId);
      if (firstTile) {
        setSelectedTileId(firstTile.id);
      }
    }
  }, [worldState.territories]);

  // Authenticate Creator
  const handleAuthenticateCreator = useCallback((profile: CreatorProfile) => {
    setCreatorProfile(profile);
    setUserRole('creator');
    // Also sync world state scenario meta
    setWorldState((prev) => ({
      ...prev,
      scenarioName: profile.scenarioName,
      scenarioEra: profile.scenarioEra,
      scenarioType: profile.scenarioType,
      scenarioDesc: profile.scenarioDesc,
      lastUpdated: new Date().toISOString(),
    }));
    setIsCreatorModalOpen(false);
  }, []);

  // Switch to Visitor Mode
  const handleSwitchToVisitor = useCallback(() => {
    setUserRole('visitor');
    setCreatorProfile(null);
    setIsPaintingMode(false);
    setPaintingCountryId(null);
  }, []);

  // Create Country
  const handleCreateCountry = useCallback((newCountry: Country) => {
    setWorldState((prev) => {
      // Update territory ownership for initial tile IDs
      const updatedTerritories = prev.territories.map((tile) => {
        if (newCountry.controlledTileIds.includes(tile.id)) {
          return {
            ...tile,
            countryId: newCountry.id,
            isCapitalCity: tile.name.includes(newCountry.capital) || tile.id === newCountry.controlledTileIds[0],
            capitalName: newCountry.capital,
          };
        }
        return tile;
      });

      // Recalculate metrics
      const metrics = calculateCountryMetrics(
        newCountry.controlledTileIds,
        updatedTerritories,
        newCountry.regime,
        newCountry.activeDoctrine
      );

      const finalizedCountry: Country = {
        ...newCountry,
        population: metrics.population || 3000,
        gdpIndex: metrics.gdpIndex || 2000,
        resources: metrics.resources,
        militaryStrength: metrics.militaryStrength || 75,
        stability: metrics.stability || 85,
      };

      // Add founding chronicle event
      const foundingEvent: TimelineEvent = {
        id: `EVT-${Date.now().toString().slice(-4)}`,
        year: prev.currentYear,
        title: `【${newCountry.name}】宣告立国`,
        description: `于创联历 ${prev.currentYear} 年完成主权缔结，确立【${newCountry.regime}】宪制，定都于【${newCountry.capital}】。`,
        type: 'founding',
        countryId: newCountry.id,
        timestamp: new Date().toISOString(),
      };

      return {
        ...prev,
        countries: [finalizedCountry, ...prev.countries],
        territories: updatedTerritories,
        events: [foundingEvent, ...prev.events],
        lastUpdated: new Date().toISOString(),
      };
    });

    setSelectedCountryId(newCountry.id);
    setIsCreateCountryModalOpen(false);
  }, []);

  // Save Country Edits
  const handleSaveCountry = useCallback((updatedCountry: Country) => {
    setWorldState((prev) => {
      const updatedCountries = prev.countries.map((c) =>
        c.id === updatedCountry.id ? updatedCountry : c
      );

      // Add regime / name shift event if changed
      const original = prev.countries.find((c) => c.id === updatedCountry.id);
      const events = [...prev.events];

      if (original && (original.name !== updatedCountry.name || original.regime !== updatedCountry.regime)) {
        events.unshift({
          id: `EVT-${Date.now().toString().slice(-4)}`,
          year: prev.currentYear,
          title: `【${updatedCountry.shortName}】国号与政体宪章修订`,
          description: `国家主权修订为【${updatedCountry.name}】，确立【${updatedCountry.regime}】。`,
          type: 'regime',
          countryId: updatedCountry.id,
          timestamp: new Date().toISOString(),
        });
      }

      return {
        ...prev,
        countries: updatedCountries,
        events,
        lastUpdated: new Date().toISOString(),
      };
    });

    setIsEditCountryModalOpen(false);
  }, []);

  // Delete Country
  const handleDeleteCountry = useCallback((countryId: string) => {
    setWorldState((prev) => {
      const countryToDelete = prev.countries.find((c) => c.id === countryId);

      // Release territories
      const updatedTerritories = prev.territories.map((tile) => {
        if (tile.countryId === countryId) {
          return {
            ...tile,
            countryId: null,
            isCapitalCity: false,
            capitalName: undefined,
          };
        }
        return tile;
      });

      // Filter out country and cleanse alliances
      const updatedCountries = prev.countries
        .filter((c) => c.id !== countryId)
        .map((c) => ({
          ...c,
          alliances: c.alliances.filter((aId) => aId !== countryId),
          treaties: c.treaties ? c.treaties.filter((t) => t.targetCountryId !== countryId) : [],
        }));

      // Chronicle event
      const dissolutionEvent: TimelineEvent = {
        id: `EVT-${Date.now().toString().slice(-4)}`,
        year: prev.currentYear,
        title: `【${countryToDelete?.name || '未知主权体'}】主权注销`,
        description: `该国疆域正式解体并重归中立开拓荒野，所有外交盟约依法失效。`,
        type: 'crisis',
        timestamp: new Date().toISOString(),
      };

      return {
        ...prev,
        countries: updatedCountries,
        territories: updatedTerritories,
        events: [dissolutionEvent, ...prev.events],
        lastUpdated: new Date().toISOString(),
      };
    });

    setSelectedCountryId(null);
    setSelectedTileId(null);
  }, []);

  // Start Painting Territory
  const handleStartPaintingTerritory = useCallback((countryId: string) => {
    setPaintingCountryId(countryId);
    setIsPaintingMode(true);
  }, []);

  // Toggle single tile ownership during painting
  const handleToggleTileOwnership = useCallback(
    (tileId: string) => {
      if (!paintingCountryId) return;

      setWorldState((prev) => {
        const targetTile = prev.territories.find((t) => t.id === tileId);
        if (!targetTile) return prev;

        const isCurrentlyOwned = targetTile.countryId === paintingCountryId;
        const newOwner = isCurrentlyOwned ? null : paintingCountryId;

        const updatedTerritories = prev.territories.map((t) =>
          t.id === tileId ? { ...t, countryId: newOwner } : t
        );

        // Recalculate metrics for all countries
        const updatedCountries = prev.countries.map((country) => {
          const controlledTiles = updatedTerritories
            .filter((t) => t.countryId === country.id)
            .map((t) => t.id);

          const metrics = calculateCountryMetrics(
            controlledTiles,
            updatedTerritories,
            country.regime,
            country.activeDoctrine
          );

          return {
            ...country,
            controlledTileIds: controlledTiles,
            population: metrics.population,
            gdpIndex: metrics.gdpIndex,
            resources: metrics.resources,
            militaryStrength: metrics.militaryStrength,
            stability: metrics.stability,
          };
        });

        return {
          ...prev,
          countries: updatedCountries,
          territories: updatedTerritories,
        };
      });
    },
    [paintingCountryId]
  );

  // Finish Painting
  const handleFinishPainting = useCallback(() => {
    if (paintingCountryId) {
      const country = worldState.countries.find((c) => c.id === paintingCountryId);
      if (country) {
        setWorldState((prev) => ({
          ...prev,
          events: [
            {
              id: `EVT-${Date.now().toString().slice(-4)}`,
              year: prev.currentYear,
              title: `【${country.shortName}】界碑疆域划定`,
              description: `创作者完成对【${country.name}】的疆域调整，现辖 ${country.controlledTileIds.length} 个省区。`,
              type: 'border',
              countryId: country.id,
              timestamp: new Date().toISOString(),
            },
            ...prev.events,
          ],
        }));
      }
    }
    setIsPaintingMode(false);
    setPaintingCountryId(null);
  }, [paintingCountryId, worldState.countries]);

  // Update Strategic Doctrine for a country
  const handleUpdateCountryDoctrine = useCallback(
    (countryId: string, doctrine: StrategicDoctrine) => {
      setWorldState((prev) => {
        const updatedCountries = prev.countries.map((c) => {
          if (c.id === countryId) {
            const metrics = calculateCountryMetrics(
              c.controlledTileIds,
              prev.territories,
              c.regime,
              doctrine
            );
            return {
              ...c,
              activeDoctrine: doctrine,
              population: metrics.population,
              gdpIndex: metrics.gdpIndex,
              resources: metrics.resources,
              militaryStrength: metrics.militaryStrength,
              stability: metrics.stability,
            };
          }
          return c;
        });

        const country = prev.countries.find((c) => c.id === countryId);
        const event: TimelineEvent = {
          id: `EVT-${Date.now().toString().slice(-4)}`,
          year: prev.currentYear,
          title: `【${country?.shortName || ''}】确立【${doctrine}】国策`,
          description: `该国发布国家战略指令，全面贯彻【${doctrine}】。`,
          type: 'regime',
          countryId,
          timestamp: new Date().toISOString(),
        };

        return {
          ...prev,
          countries: updatedCountries,
          events: [event, ...prev.events],
          lastUpdated: new Date().toISOString(),
        };
      });
    },
    []
  );

  // Sign Bilateral Treaty
  const handleSignTreaty = useCallback(
    (countryId: string, targetCountryId: string, treatyType: TreatyType) => {
      setWorldState((prev) => {
        const countryA = prev.countries.find((c) => c.id === countryId);
        const countryB = prev.countries.find((c) => c.id === targetCountryId);
        if (!countryA || !countryB) return prev;

        const treatyId = `TR-${Date.now().toString().slice(-4)}`;

        const updatedCountries = prev.countries.map((c) => {
          if (c.id === countryId) {
            const currentTreaties = c.treaties || [];
            return {
              ...c,
              treaties: [
                ...currentTreaties,
                {
                  id: treatyId,
                  targetCountryId,
                  type: treatyType,
                  signedYear: prev.currentYear,
                  description: `与【${countryB.name}】缔结${treatyType}`,
                },
              ],
            };
          }
          if (c.id === targetCountryId) {
            const currentTreaties = c.treaties || [];
            return {
              ...c,
              treaties: [
                ...currentTreaties,
                {
                  id: `${treatyId}-B`,
                  targetCountryId: countryId,
                  type: treatyType,
                  signedYear: prev.currentYear,
                  description: `与【${countryA.name}】缔结${treatyType}`,
                },
              ],
            };
          }
          return c;
        });

        const treatyEvent: TimelineEvent = {
          id: `EVT-${Date.now().toString().slice(-4)}`,
          year: prev.currentYear,
          title: `【${countryA.shortName}】与【${countryB.shortName}】签署《${treatyType}》`,
          description: `双方法定代表在世界网见证下签署协定，促进地缘繁荣与互信。`,
          type: 'diplomacy',
          countryId,
          timestamp: new Date().toISOString(),
        };

        return {
          ...prev,
          countries: updatedCountries,
          events: [treatyEvent, ...prev.events],
          lastUpdated: new Date().toISOString(),
        };
      });
    },
    []
  );

  // Advance Year & Era
  const handleAdvanceYear = useCallback(
    (years: number, newEraName?: string, eventTitle?: string) => {
      setWorldState((prev) => {
        const nextYear = prev.currentYear + years;
        const events = [...prev.events];

        if (eventTitle) {
          events.unshift({
            id: `EVT-${Date.now().toString().slice(-4)}`,
            year: nextYear,
            title: eventTitle,
            description: `历史年轮推进至创联历 ${nextYear} 年，${newEraName || prev.eraName}。`,
            type: 'era',
            timestamp: new Date().toISOString(),
          });
        }

        return {
          ...prev,
          currentYear: nextYear,
          eraName: newEraName || prev.eraName,
          events,
          lastUpdated: new Date().toISOString(),
        };
      });
      setIsTimeModalOpen(false);
    },
    []
  );

  // Update Scenario Metadata
  const handleUpdateScenarioMeta = useCallback(
    (name: string, era: string, type: '拟实' | '架空', desc: string) => {
      setWorldState((prev) => ({
        ...prev,
        scenarioName: name,
        scenarioEra: era,
        scenarioType: type,
        scenarioDesc: desc,
        lastUpdated: new Date().toISOString(),
      }));
      if (creatorProfile) {
        setCreatorProfile((prev) =>
          prev
            ? {
                ...prev,
                scenarioName: name,
                scenarioEra: era,
                scenarioType: type,
                scenarioDesc: desc,
              }
            : null
        );
      }
    },
    [creatorProfile]
  );

  // Add Event to Timeline
  const handleAddTimelineEvent = useCallback((event: TimelineEvent) => {
    setWorldState((prev) => ({
      ...prev,
      events: [event, ...prev.events],
    }));
  }, []);

  // Run Sandtable Simulation Cycle
  const handleRunSimulationCycle = useCallback(
    (cycleType: 'economy' | 'diplomacy' | 'crisis') => {
      setWorldState((prev) => {
        let logMsg = '';
        let updatedCountries = [...prev.countries];
        const nextYear = prev.currentYear + 1;

        if (cycleType === 'economy') {
          updatedCountries = prev.countries.map((c) => {
            const growthRate = c.stability > 80 ? 1.05 : 1.02;
            const popGrowth = Math.round(c.population * 0.015);
            return {
              ...c,
              population: c.population + popGrowth,
              gdpIndex: Math.round(c.gdpIndex * growthRate),
              resources: {
                ...c.resources,
                industry: c.resources.industry + 50,
                infrastructure: c.resources.infrastructure + 40,
              },
            };
          });
          logMsg = `[经济结算] 历 ${nextYear} 年全球宏观经济结算完成，各国工业与基础设施稳步扩张。`;
        } else if (cycleType === 'diplomacy') {
          logMsg = `[贸易推演] 历 ${nextYear} 年苍蓝海港商路与东海关税同盟结算完成，通商邦国能源储备提升 8%。`;
        } else {
          logMsg = `[地缘事态] 历 ${nextYear} 年北境霜原发现深层熔晶新矿脉，引发极地多边勘探协议谈判。`;
        }

        setSimulationLogs((logs) => [logMsg, ...logs]);

        return {
          ...prev,
          currentYear: nextYear,
          countries: updatedCountries,
          lastUpdated: new Date().toISOString(),
        };
      });
    },
    []
  );

  // Export World JSON
  const handleExportWorld = useCallback(() => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(worldState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `T4NEW_WORLD_DATA_YEAR_${worldState.currentYear}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [worldState]);

  // Reset to initial world
  const handleResetWorld = useCallback(() => {
    if (window.confirm('确认重置世界至粉陆创联初始设定？这将清除所有自建国家与疆域修改。')) {
      setWorldState(INITIAL_WORLD_STATE);
      setSelectedCountryId(null);
      setSelectedTileId(null);
      localStorage.removeItem(STORAGE_KEY_WORLD);
    }
  }, []);

  const activePaintingCountry = useMemo(() => {
    if (!paintingCountryId) return null;
    return worldState.countries.find((c) => c.id === paintingCountryId) || null;
  }, [paintingCountryId, worldState.countries]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-800 font-sans select-none">
      {/* Top Navigation Bar */}
      <TopNavbar
        userRole={userRole}
        creatorProfile={creatorProfile}
        worldState={worldState}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCreatorModal={() => setIsCreatorModalOpen(true)}
        onSwitchToVisitor={handleSwitchToVisitor}
        onOpenTimeModal={() => setIsTimeModalOpen(true)}
        onOpenCreateCountryModal={() => setIsCreateCountryModalOpen(true)}
        onOpenTimelineModal={() => setIsTimelineModalOpen(true)}
        onOpenSimulationModal={() => setIsSimulationModalOpen(true)}
        onToggleCountryList={() => setIsCountryListOpen((prev) => !prev)}
        isCountryListOpen={isCountryListOpen}
        onExportWorld={handleExportWorld}
        onResetWorld={handleResetWorld}
      />

      {/* Main Vector Cartography Workspace */}
      <main className="flex-1 relative flex overflow-hidden">
        {/* Left Drawer: Sovereign Countries Directory */}
        {isCountryListOpen && (
          <CountryListSidebar
            countries={worldState.countries}
            territories={worldState.territories}
            selectedCountryId={selectedCountryId}
            userRole={userRole}
            onSelectCountry={(id) => {
              setSelectedCountryId(id);
            }}
            onClose={() => setIsCountryListOpen(false)}
            onOpenCreateCountryModal={() => setIsCreateCountryModalOpen(true)}
          />
        )}

        {/* Center: High-Precision Vector SVG World Map */}
        <WorldMap
          territories={worldState.territories}
          countries={worldState.countries}
          selectedCountryId={selectedCountryId}
          selectedTileId={selectedTileId}
          onSelectCountry={handleSelectCountry}
          onSelectTile={handleSelectTile}
          userRole={userRole}
          isPaintingMode={isPaintingMode}
          paintingCountryId={paintingCountryId}
          onToggleTileOwnership={handleToggleTileOwnership}
          searchQuery={searchQuery}
        />

        {/* Right Drawer: Country / Region Inspector */}
        {selectedCountry && !isPaintingMode && (
          <CountryInspector
            country={selectedCountry}
            allTerritories={worldState.territories}
            allCountries={worldState.countries}
            userRole={userRole}
            onClose={() => {
              setSelectedCountryId(null);
              setSelectedTileId(null);
            }}
            onSelectTile={handleSelectTile}
            onEditCountry={() => setIsEditCountryModalOpen(true)}
            onStartPaintingTerritory={handleStartPaintingTerritory}
            onDeleteCountry={handleDeleteCountry}
            onUpdateCountryDoctrine={handleUpdateCountryDoctrine}
            onSignTreaty={handleSignTreaty}
          />
        )}

        {/* Floating Territory Paint Toolbar */}
        {isPaintingMode && activePaintingCountry && (
          <TerritoryPaintBar
            country={activePaintingCountry}
            allTerritories={worldState.territories}
            onFinishPainting={handleFinishPainting}
          />
        )}
      </main>

      {/* Modals */}
      {isCreatorModalOpen && (
        <CreatorModal
          initialProfile={creatorProfile}
          onClose={() => setIsCreatorModalOpen(false)}
          onAuthenticateCreator={handleAuthenticateCreator}
        />
      )}

      {isCreateCountryModalOpen && (
        <CreateCountryModal
          unassignedTerritories={unassignedTerritories}
          currentYear={worldState.currentYear}
          onClose={() => setIsCreateCountryModalOpen(false)}
          onCreateCountry={handleCreateCountry}
        />
      )}

      {isEditCountryModalOpen && countryToEdit && (
        <EditCountryModal
          country={countryToEdit}
          onClose={() => setIsEditCountryModalOpen(false)}
          onSaveCountry={handleSaveCountry}
        />
      )}

      {isTimeModalOpen && (
        <WorldTimeModal
          worldState={worldState}
          onClose={() => setIsTimeModalOpen(false)}
          onAdvanceYear={handleAdvanceYear}
          onUpdateScenarioMeta={handleUpdateScenarioMeta}
        />
      )}

      {isTimelineModalOpen && (
        <TimelineModal
          events={worldState.events}
          countries={worldState.countries}
          currentYear={worldState.currentYear}
          userRole={userRole}
          onClose={() => setIsTimelineModalOpen(false)}
          onAddEvent={handleAddTimelineEvent}
        />
      )}

      {isSimulationModalOpen && (
        <WorldSimulationModal
          worldState={worldState}
          onClose={() => setIsSimulationModalOpen(false)}
          onRunSimulationCycle={handleRunSimulationCycle}
          simulationLogs={simulationLogs}
        />
      )}
    </div>
  );
}
