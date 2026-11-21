import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { ThemePreference, useTheme } from '../../context/ThemeContext';

export function SurfaceCard({
  children,
  className = '',
  muted = false,
}: {
  children: React.ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] transition-colors ${
        muted
          ? 'bg-[#EEF1FA]/70 dark:bg-[#212640]/80'
          : 'bg-white dark:bg-[#181B2E] shadow-[var(--shadow-card)]'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export type ProgressTone = 'primary' | 'secondary' | 'cyan' | 'gold' | 'success' | 'danger';

const TONE_FILL: Record<ProgressTone, string> = {
  primary: 'bg-[#7055F7]',
  secondary: 'bg-[#477BFF]',
  cyan: 'bg-[#35C9D8]',
  gold: 'bg-[#F6B94A]',
  success: 'bg-[#27C991]',
  danger: 'bg-[#E5484D]',
};

export function ProgressBar({
  value,
  max = 100,
  tone = 'primary',
  heightClass = 'h-2.5',
  label,
}: {
  value: number;
  max?: number;
  tone?: ProgressTone;
  heightClass?: string;
  label?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`w-full ${heightClass} rounded-full bg-[#EEF1FA] dark:bg-[#252B46] overflow-hidden`}
    >
      <div
        className={`h-full rounded-full ${TONE_FILL[tone]} transition-[width] duration-500 ease-out`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ThemeSegmentedControl({ compact = false }: { compact?: boolean }) {
  const { preference, setPreference } = useTheme();

  const options: Array<{ id: ThemePreference; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div
      role="group"
      aria-label="Theme appearance"
      className="inline-flex items-center rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA] dark:bg-[#212640] p-1 gap-0.5"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = preference === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setPreference(opt.id)}
            aria-pressed={active}
            title={`${opt.label} theme`}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              compact ? 'px-2 py-1.5 text-[11px]' : 'px-3 py-1.5 text-xs'
            } ${
              active
                ? 'bg-white dark:bg-[#181B2E] text-[#14172B] dark:text-[#F4F6FF] shadow-xs'
                : 'text-[#4E5674] dark:text-[#B4BDD9] hover:text-[#14172B] dark:hover:text-white'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {!compact && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return {
    isDark,
    gridStroke: isDark ? '#2B3150' : '#E2E6F3',
    tickFill: isDark ? '#9BA5C9' : '#64748B',
    tooltipBg: isDark ? '#181B2E' : '#FFFFFF',
    tooltipBorder: isDark ? '#3C456D' : '#E2E6F3',
    tooltipText: isDark ? '#F4F6FF' : '#14172B',
    primary: isDark ? '#8E78FF' : '#7055F7',
    secondary: isDark ? '#5B8BFF' : '#477BFF',
    cyan: '#35C9D8',
    gold: '#F6B94A',
    success: '#27C991',
    danger: isDark ? '#F87171' : '#E5484D',
  };
}
