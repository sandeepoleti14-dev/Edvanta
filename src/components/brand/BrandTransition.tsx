import React from 'react';

interface BrandTransitionProps {
  children: React.ReactNode;
  isExiting: boolean;
  durationMs?: number;
}

/**
 * Coordinates Scene 4: smooth cross-dissolve from the deep-navy EDVANTA stage
 * into the light homepage workspace using GPU-composited CSS transitions.
 */
export function BrandTransition({
  children,
  isExiting,
  durationMs = 920,
}: BrandTransitionProps) {
  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#111322] will-change-[opacity,transform] ${
        isExiting ? 'pointer-events-none' : 'pointer-events-auto'
      }`}
      style={{
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(1.02)' : 'scale(1)',
        transition: `opacity ${durationMs}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${durationMs}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      }}
      role="dialog"
      aria-modal="false"
      aria-label="EDVANTA platform introduction"
      data-testid="edvanta-brand-intro"
    >
      {children}
    </div>
  );
}
