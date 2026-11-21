import React, { useId } from 'react';
import { Link } from 'react-router-dom';

export type BrandSurfaceVariant = 'light' | 'dark' | 'monochrome';

interface SymbolProps {
  size?: number;
  variant?: BrandSurfaceVariant;
  className?: string;
}

/**
 * Original EDVANTA brand symbol:
 * Three interconnected geometric vectors forming an ascending neural apex:
 * - Dual upward structural pillars (continuous learning & upward trajectory)
 * - Interlocking neural pathway bridge (adaptive technology & conceptual linking)
 * - Crown apex node (intelligence & mastery milestone)
 */
export function EdvantaSymbol({ size = 32, variant = 'light', className = '' }: SymbolProps) {
  const uid = useId().replace(/:/g, '');
  const gradId = `edvanta-grad-${uid}`;

  const primaryStroke =
    variant === 'dark' ? '#FFFFFF' : variant === 'monochrome' ? 'currentColor' : '#101827';
  const accentStroke = variant === 'monochrome' ? 'currentColor' : `url(#${gradId})`;
  const leftNodeFill = variant === 'monochrome' ? 'currentColor' : '#526BFF';
  const rightNodeFill = variant === 'monochrome' ? 'currentColor' : '#8B6CFF';
  const centerFill = variant === 'dark' ? '#101827' : '#FFFFFF';
  const centerStroke = variant === 'monochrome' ? 'currentColor' : `url(#${gradId})`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {variant !== 'monochrome' && (
        <defs>
          <linearGradient id={gradId} x1="12" y1="50" x2="52" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#526BFF" />
            <stop offset="100%" stopColor="#8B6CFF" />
          </linearGradient>
        </defs>
      )}

      {/* Left & Right Ascending Geometric Pillars */}
      <path
        d="M14 49L29.6 18.2C30.6 16.3 33.4 16.3 34.4 18.2L50 49"
        stroke={primaryStroke}
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ascending Neural Cross-Link */}
      <path
        d="M21.5 38.5L32 31L46.5 23.5"
        stroke={accentStroke}
        strokeWidth="4.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Foundation & Neural Pathway Nodes */}
      <circle cx="14" cy="49" r="3.4" fill={leftNodeFill} />
      <circle cx="50" cy="49" r="3.4" fill={rightNodeFill} />
      <circle cx="46.5" cy="23.5" r="2.8" fill={rightNodeFill} />

      {/* Central Neural Nexus */}
      <circle
        cx="32"
        cy="31"
        r="4"
        fill={variant === 'monochrome' ? 'none' : centerFill}
        stroke={centerStroke}
        strokeWidth="2.5"
      />

      {/* Precision Apex Crown Diamond */}
      <path
        d="M32 7.5L37 12.5L32 17.5L27 12.5L32 7.5Z"
        fill={variant === 'monochrome' ? 'currentColor' : `url(#${gradId})`}
      />
    </svg>
  );
}

/**
 * Icon-only app mark suitable for browser badges, loading indicators, and square tiles.
 */
export function AppIcon({
  size = 40,
  variant = 'dark',
  className = '',
}: {
  size?: number;
  variant?: 'dark' | 'light';
  className?: string;
}) {
  const bgClass =
    variant === 'dark'
      ? 'bg-[#101827] border border-slate-700/80 shadow-sm'
      : 'bg-white border border-slate-200 shadow-sm';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl shrink-0 ${bgClass} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <EdvantaSymbol size={Math.round(size * 0.68)} variant={variant} />
    </span>
  );
}

interface LogoProps {
  variant?: BrandSurfaceVariant;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { icon: 24, text: 'text-base', tracking: 'tracking-[0.06em]', gap: 'gap-2' },
  md: { icon: 30, text: 'text-xl', tracking: 'tracking-[0.06em]', gap: 'gap-2.5' },
  lg: { icon: 38, text: 'text-2xl', tracking: 'tracking-[0.07em]', gap: 'gap-3' },
};

/**
 * Primary horizontal EDVANTA logo combining the original neural apex symbol and geometric wordmark.
 */
export function EdvantaLogo({
  variant = 'light',
  size = 'md',
  showTagline = false,
  className = '',
}: LogoProps) {
  const cfg = SIZE_MAP[size];
  const textColor =
    variant === 'dark' ? 'text-white' : variant === 'monochrome' ? 'text-current' : 'text-[#101827]';
  const taglineColor =
    variant === 'dark' ? 'text-slate-300' : variant === 'monochrome' ? 'text-current opacity-75' : 'text-slate-500';

  return (
    <span className={`inline-flex items-center ${cfg.gap} whitespace-nowrap shrink-0 ${className}`}>
      <EdvantaSymbol size={cfg.icon} variant={variant} className="shrink-0" />
      <span className="inline-flex flex-col leading-none">
        <span className={`font-display font-extrabold ${cfg.text} ${cfg.tracking} ${textColor}`}>
          EDVANTA
        </span>
        {showTagline && (
          <span className={`text-[11px] font-medium tracking-normal mt-1 ${taglineColor}`}>
            Learn Smarter. Grow Further.
          </span>
        )}
      </span>
    </span>
  );
}

interface BrandHeaderProps {
  rightSlot?: React.ReactNode;
  centerNav?: React.ReactNode;
  variant?: 'light' | 'dark';
  sticky?: boolean;
}

/**
 * Reusable top navigation header carrying the official EDVANTA lockup.
 */
export function BrandHeader({
  rightSlot,
  centerNav,
  variant = 'light',
  sticky = true,
}: BrandHeaderProps) {
  const surface =
    variant === 'dark'
      ? 'bg-[#101827]/95 border-slate-800 text-white'
      : 'bg-white/95 border-slate-200 text-[#101827]';

  return (
    <header className={`${sticky ? 'sticky top-0 z-40' : ''} backdrop-blur border-b ${surface}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        <Link to="/" aria-label="EDVANTA home" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#526BFF] rounded-lg">
          <EdvantaLogo variant={variant} size="md" />
        </Link>
        {centerNav}
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
    </header>
  );
}
