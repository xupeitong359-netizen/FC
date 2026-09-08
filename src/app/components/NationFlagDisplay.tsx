import React from 'react';
import { FlagRatio } from '../types';

export const getAspectRatioCSS = (ratio?: FlagRatio | string): string => {
  switch (ratio) {
    case '1:1':
      return '1 / 1';
    case '19:10':
      return '19 / 10';
    case '1:2':
      return '2 / 1'; // 旗帜学中 1:2 指高宽比 1:2，即长宽为 2:1
    case '3:2':
    default:
      return '3 / 2';
  }
};

export const NationFlagDisplay: React.FC<{
  flagUrl?: string;
  flagColor?: string;
  name?: string;
  className?: string;
  ratio?: FlagRatio;
}> = ({ flagUrl, flagColor = '#3b82f6', name = '', className = 'w-9 h-6', ratio }) => {
  // 推断或匹配比例：预设国旗具备天然比例
  const effectiveRatio: FlagRatio = ratio || (
    flagUrl === 'flag_gb'
      ? '1:2'
      : flagUrl === 'flag_us'
      ? '19:10'
      : '3:2'
  );

  const aspectCss = getAspectRatioCSS(effectiveRatio);

  if (flagUrl && (flagUrl.startsWith('data:image') || flagUrl.startsWith('http'))) {
    return (
      <img
        src={flagUrl}
        alt={name}
        style={{ aspectRatio: aspectCss }}
        className={`${className} object-cover rounded shadow-xs border border-slate-300/80`}
      />
    );
  }

  // 预设 SVG 图形国旗
  switch (flagUrl) {
    case 'flag_cn':
      return (
        <svg viewBox="0 0 900 600" className={`${className} rounded shadow-xs border border-red-900/20`}>
          <rect width="900" height="600" fill="#de2910" />
          <polygon
            points="150,50 180,140 270,140 200,195 225,280 150,230 75,280 100,195 30,140 120,140"
            fill="#ffde00"
          />
          <circle cx="300" cy="60" r="16" fill="#ffde00" />
          <circle cx="360" cy="120" r="16" fill="#ffde00" />
          <circle cx="360" cy="200" r="16" fill="#ffde00" />
          <circle cx="300" cy="260" r="16" fill="#ffde00" />
        </svg>
      );
    case 'flag_gb':
      return (
        <svg viewBox="0 0 60 30" className={`${className} rounded shadow-xs border border-blue-900/20`}>
          <clipPath id="s_flag">
            <path d="M0,0 v30 h60 v-30 z" />
          </clipPath>
          <clipPath id="t_flag">
            <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
          </clipPath>
          <g clipPath="url(#s_flag)">
            <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
            <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t_flag)" stroke="#C8102E" strokeWidth="4" />
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
          </g>
        </svg>
      );
    case 'flag_fr':
      return (
        <svg viewBox="0 0 900 600" className={`${className} rounded shadow-xs border border-slate-300`}>
          <rect width="300" height="600" fill="#002654" />
          <rect x="300" width="300" height="600" fill="#ffffff" />
          <rect x="600" width="300" height="600" fill="#ce1126" />
        </svg>
      );
    case 'flag_jp':
      return (
        <svg viewBox="0 0 900 600" className={`${className} rounded shadow-xs border border-slate-300`}>
          <rect width="900" height="600" fill="#ffffff" />
          <circle cx="450" cy="300" r="180" fill="#bc002d" />
        </svg>
      );
    case 'flag_us':
      return (
        <svg viewBox="0 0 741 390" className={`${className} rounded shadow-xs border border-slate-300`}>
          <rect width="741" height="390" fill="#b22234" />
          <path d="M0,30H741M0,90H741M0,150H741M0,210H741M0,270H741M0,330H741" stroke="#fff" strokeWidth="30" />
          <rect width="296" height="210" fill="#3c3b6e" />
          <circle cx="148" cy="105" r="50" fill="#fff" opacity="0.3" />
        </svg>
      );
    case 'flag_de':
      return (
        <svg viewBox="0 0 5 3" className={`${className} rounded shadow-xs border border-slate-300`}>
          <rect width="5" height="1" y="0" fill="#000000" />
          <rect width="5" height="1" y="1" fill="#dd0000" />
          <rect width="5" height="1" y="2" fill="#ffce00" />
        </svg>
      );
    case 'flag_su':
      return (
        <svg viewBox="0 0 900 600" className={`${className} rounded shadow-xs border border-red-900/30`}>
          <rect width="900" height="600" fill="#cd0000" />
          <circle cx="180" cy="180" r="80" stroke="#ffd700" strokeWidth="12" fill="none" opacity="0.8" />
          <polygon points="180,120 195,165 240,165 205,190 220,235 180,205 140,235 155,190 120,165 165,165" fill="#ffd700" />
        </svg>
      );
    case 'flag_empire':
      return (
        <svg viewBox="0 0 900 600" className={`${className} rounded shadow-xs border border-purple-900/30`}>
          <rect width="900" height="600" fill="#4a044e" />
          <polygon points="450,150 510,250 630,260 540,340 560,450 450,390 340,450 360,340 270,260 390,250" fill="#facc15" />
          <circle cx="450" cy="300" r="45" fill="#4a044e" />
        </svg>
      );
    default:
      return (
        <div
          className={`${className} rounded flex items-center justify-center font-bold text-white text-[11px] shadow-xs border border-slate-300/80`}
          style={{ backgroundColor: flagColor, aspectRatio: aspectCss }}
        >
          {name ? name.slice(0, 2) : '国'}
        </div>
      );
  }
};
