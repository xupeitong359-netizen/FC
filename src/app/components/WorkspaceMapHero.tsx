import React, { useState, useEffect } from 'react';
import { Nation } from '../types';
import { api } from '../services/api';
import { WorldMap } from './WorldMap';

interface WorkspaceMapHeroProps {
  era?: string;
  isInteractive?: boolean;
  nations?: Nation[];
  myNation?: Nation | null;
  onSelectNation?: (nation: Nation) => void;
  onOpenDiplomacy?: (nation: Nation, type?: any) => void;
  onSelectProvince?: (provinceId: string | number, name: string) => void;
  onOpenFullscreen?: () => void;
  className?: string;
}

export const WorkspaceMapHero: React.FC<WorkspaceMapHeroProps> = ({
  era = '1936年',
  nations: initialNations,
  myNation,
  onSelectNation,
  onOpenDiplomacy,
  className = 'h-[380px] sm:h-[460px]',
}) => {
  const [internalNations, setInternalNations] = useState<Nation[]>([]);

  useEffect(() => {
    if (!initialNations || initialNations.length === 0) {
      api.nations.list().then((data) => {
        if (data && data.nations) setInternalNations(data.nations);
      }).catch(() => {});
    }
  }, [initialNations]);

  const activeNations = (initialNations && initialNations.length > 0) ? initialNations : internalNations;

  return (
    <div className={`w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs relative bg-slate-100 ${className}`}>
      <WorldMap
        nations={activeNations}
        myNation={myNation}
        onSelectNation={onSelectNation}
        onOpenDiplomacy={onOpenDiplomacy}
      />
    </div>
  );
};
