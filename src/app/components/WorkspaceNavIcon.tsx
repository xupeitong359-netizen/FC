import React from 'react';
import { motion } from 'motion/react';

export type WorkspaceIconStatus = 'default' | 'active' | 'inactive' | 'hover';

interface WorkspaceNavIconProps {
  status?: WorkspaceIconStatus;
  isActive?: boolean;
  isOpen?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showContainer?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Modern, refined Workspace + navigation icon
 * Features:
 * 1. Clean window / multi-panel workspace visual layout (header bar + left/right panes)
 * 2. Subtle glassmorphism / soft gradient squircle container
 * 3. Integrated auxiliary bottom-right plus (+) badge that doesn't overpower the core icon
 * 4. Refined, low-saturation purple aesthetic (#7c3aed / #6366f1) with ambient soft elevation
 */
export const WorkspaceNavIcon: React.FC<WorkspaceNavIconProps> = ({
  status,
  isActive = false,
  isOpen = false,
  size = 'md',
  showContainer = true,
  className = '',
}) => {
  // Resolve effective visual status
  const effectiveStatus: WorkspaceIconStatus =
    status || (isOpen ? 'hover' : isActive ? 'active' : 'inactive');

  // Container sizing: scaled down from oversized to ideal mobile bottom-nav proportion
  const containerDimensions = {
    sm: 'w-6 h-6 rounded-[7px]',
    md: 'w-[32px] h-[32px] rounded-[9.5px]',
    lg: 'w-10 h-10 rounded-[12px]',
    xl: 'w-14 h-14 rounded-[16px]',
  }[size];

  // SVG dimensions: optical balance inside squircle
  const svgDimensions = {
    sm: 'w-3.5 h-3.5',
    md: 'w-[18px] h-[18px]',
    lg: 'w-5 h-5',
    xl: 'w-8 h-8',
  }[size];

  // Colors & styling per state
  const isSelected = effectiveStatus === 'active';
  const isHover = effectiveStatus === 'hover';
  const isDefaultActive = effectiveStatus === 'default';

  // Container styling with sophisticated, non-garish purple gradient and gentle ambient elevation
  const containerClass = isSelected
    ? 'bg-gradient-to-br from-[#7C63F7] via-[#6B50F0] to-[#5736E5] text-white shadow-[0_3px_10px_-1px_rgba(107,80,240,0.30),0_1px_2px_rgba(0,0,0,0.04)] border border-white/25'
    : isHover
    ? 'bg-gradient-to-br from-[#856EF8] via-[#7156F2] to-[#5D3CE8] text-white shadow-[0_4px_14px_-1px_rgba(107,80,240,0.36),0_1px_2px_rgba(0,0,0,0.05)] border border-white/30 scale-[1.03]'
    : isDefaultActive
    ? 'bg-gradient-to-b from-violet-50/95 via-white/90 to-purple-50/80 text-[#6B50F0] border border-violet-200/70 shadow-[0_2px_6px_rgba(107,80,240,0.09),0_1px_2px_rgba(0,0,0,0.02)]'
    : 'bg-slate-50/80 text-slate-400 border border-slate-200/60 shadow-2xs hover:bg-violet-50/50 hover:text-slate-600';

  // Pane line and fill colors
  const strokeColor =
    isSelected || isHover ? '#ffffff' : isDefaultActive ? '#6B50F0' : '#94a3b8';

  const fillColor =
    isSelected || isHover
      ? 'rgba(255, 255, 255, 0.18)'
      : isDefaultActive
      ? 'rgba(107, 80, 240, 0.08)'
      : 'rgba(241, 245, 249, 0.65)';

  // Badge colors: subtle auxiliary integration without dominating center
  const badgeCircleFill = isSelected
    ? '#ffffff'
    : isHover
    ? '#ffffff'
    : isDefaultActive
    ? '#6B50F0'
    : '#94a3b8';

  const badgePlusStroke =
    isSelected || isHover ? '#6B50F0' : '#ffffff';

  const badgeCutoutStroke =
    isSelected || isHover
      ? 'rgba(107, 80, 240, 0.35)'
      : isDefaultActive
      ? '#ffffff'
      : '#ffffff';

  const iconContent = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${svgDimensions} transition-transform duration-200`}
    >
      {/* 1. Header Toolbar: top window command bar */}
      <rect
        x="3"
        y="3"
        width="18"
        height="3.75"
        rx="1.5"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* 2. Left Main Panel: primary workspace canvas */}
      <rect
        x="3"
        y="8.25"
        width="8.5"
        height="12.75"
        rx="1.5"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* 3. Right Top Panel: secondary workspace tool panel */}
      <rect
        x="13"
        y="8.25"
        width="8"
        height="5.75"
        rx="1.5"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* 4. Auxiliary Plus Badge at bottom-right (neatly nestled, does not fight the center) */}
      <circle
        cx="17"
        cy="17.25"
        r="4.25"
        fill={badgeCircleFill}
        stroke={badgeCutoutStroke}
        strokeWidth="1.35"
      />

      {/* Plus glyph with gentle rotation response */}
      <motion.g
        animate={{
          rotate: isOpen ? 90 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 24,
        }}
        style={{ originX: '17px', originY: '17.25px' }}
      >
        <path
          d="M17 15.25V19.25M15 17.25H19"
          stroke={badgePlusStroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.g>
    </svg>
  );

  if (!showContainer) {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {iconContent}
      </div>
    );
  }

  return (
    <motion.div
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      className={`relative flex items-center justify-center backdrop-blur-md transition-all duration-200 cursor-pointer ${containerDimensions} ${containerClass} ${className}`}
    >
      {iconContent}

      {/* Soft Liquid Glass ambient top specular highlight */}
      <div className="absolute inset-x-1 top-0.5 h-[38%] rounded-t-[8px] bg-gradient-to-b from-white/30 via-white/10 to-transparent pointer-events-none" />
    </motion.div>
  );
};
