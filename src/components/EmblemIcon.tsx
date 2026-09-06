import React from 'react';
import {
  Compass,
  Crown,
  Layers,
  Shield,
  Landmark,
  Scale,
  Building2,
  Sun,
  Flag,
  Globe,
  Star,
  Flame,
} from 'lucide-react';

interface EmblemIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const EmblemIcon: React.FC<EmblemIconProps> = ({ name, className = 'w-4 h-4', size }) => {
  const iconProps = { className, ...(size ? { size } : {}) };

  switch (name) {
    case 'compass':
      return <Compass {...iconProps} />;
    case 'crown':
      return <Crown {...iconProps} />;
    case 'layers':
      return <Layers {...iconProps} />;
    case 'shield':
      return <Shield {...iconProps} />;
    case 'landmark':
      return <Landmark {...iconProps} />;
    case 'scale':
      return <Scale {...iconProps} />;
    case 'building':
      return <Building2 {...iconProps} />;
    case 'sun':
      return <Sun {...iconProps} />;
    case 'star':
      return <Star {...iconProps} />;
    case 'flame':
      return <Flame {...iconProps} />;
    case 'globe':
      return <Globe {...iconProps} />;
    default:
      return <Flag {...iconProps} />;
  }
};
