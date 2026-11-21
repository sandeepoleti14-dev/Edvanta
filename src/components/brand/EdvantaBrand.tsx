import React, { useId } from 'react';
import { Link } from 'react-router-dom';

export type BrandSurfaceVariant = 'auto' | 'light' | 'dark' | 'monochrome';

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
export function EdvantaSymbol({ size = 32, variant = 'auto', className = '' }: SymbolProps) {
  const uid = useId().replace(/:/g, '');
  const gradId = `edvanta-grad-${uid}`;

  const primaryStroke =
    variant === 'dark'
      ? '#FFFFFF'
      : variant === 'monochrome'
      ? 'currentColor'
      : variant === 'auto'
      ? 'currentColor'
      : '#14172B';
  const accentStroke = variant === 'monochrome' ? 'currentColor' : `url(#${gradId})`;
  const leftNodeFill = variant === 'monochrome' ? 'currentColor' : '#7055F7';
  const rightNodeFill = variant === 'monochrome' ? 'currentColor' : '#35C9D8';
  const centerFill = variant === 'dark' ? '#111322' : variant === 'auto' ? 'var(--bg-surface, #FFFFFF)' : '#FFFFFF';
  const centerStroke = variant === 'monochrome' ? 'currentColor' : `url(#${gradId})`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${variant === 'auto' ? 'text-[#14172B] dark:text-white' : ''} ${className}`}
      aria-hidden="true"
    >
      {variant !== 'monochrome' && (
        <defs>
          <linearGradient id={gradId} x1="12" y1="50" x2="52" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7055F7" />
            <stop offset="55%" stopColor="#477BFF" />
            <stop offset="100%" stopColor="#35C9D8" />
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
  variant?: 'auto' | 'dark' | 'light';
  className?: string;
}) {
  const bgClass =
    variant === 'dark'
      ? 'bg-[#111322] border border-[#2B3150] shadow-sm'
      : variant === 'auto'
      ? 'bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150] shadow-sm'
      : 'bg-white border border-[#E2E6F3] shadow-sm';

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
  variant = 'auto',
  size = 'md',
  showTagline = false,
  className = '',
}: LogoProps) {
  const cfg = SIZE_MAP[size];
  const textColor =
    variant === 'dark'
      ? 'text-white'
      : variant === 'monochrome'
      ? 'text-current'
      : variant === 'auto'
      ? 'text-[#14172B] dark:text-white'
      : 'text-[#14172B]';
  const taglineColor =
    variant === 'dark'
      ? 'text-[#B4BDD9]'
      : variant === 'monochrome'
      ? 'text-current opacity-75'
      : variant === 'auto'
      ? 'text-[#4E5674] dark:text-[#B4BDD9]'
      : 'text-[#4E5674]';

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
  variant?: 'auto' | 'light' | 'dark';
  sticky?: boolean;
}

/**
 * Reusable top navigation header carrying the official EDVANTA lockup.
 */
export function BrandHeader({
  rightSlot,
  centerNav,
  variant = 'auto',
  sticky = true,
}: BrandHeaderProps) {
  const surface =
    variant === 'dark'
      ? 'bg-[#111322]/95 border-[#2B3150] text-white'
      : variant === 'auto'
      ? 'bg-white/90 dark:bg-[#181B2E]/90 border-[#E2E6F3] dark:border-[#2B3150] text-[#14172B] dark:text-[#F4F6FF]'
      : 'bg-white/95 border-[#E2E6F3] text-[#14172B]';

  return (
    <header className={`${sticky ? 'sticky top-0 z-40' : ''} backdrop-blur border-b transition-colors ${surface}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        <Link
          to="/"
          aria-label="EDVANTA home"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7055F7] rounded-lg shrink-0"
        >
          <EdvantaLogo variant={variant} size="md" />
        </Link>
        {centerNav}
        {rightSlot ? <div className="shrink-0 flex items-center gap-2 sm:gap-3">{rightSlot}</div> : null}
      </div>
    </header>
  );
}
