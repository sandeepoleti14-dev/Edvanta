import React, { useCallback, useEffect, useState } from 'react';
import { BrandTransition } from './BrandTransition';
import { DEFAULT_INTRO_TIMING } from '../../utils/brandIntroLogic';

interface BrandIntroProps {
  onComplete: () => void;
  reducedMotion?: boolean;
}

interface FloatingParticle {
  id: number;
  xPct: number;
  yPct: number;
  size: number;
  driftX: number;
  driftY: number;
  delay: number;
  duration: number;
  tone: 'blue' | 'violet' | 'white';
}

const AMBIENT_PARTICLES: FloatingParticle[] = [
  { id: 1, xPct: 14, yPct: 22, size: 2.5, driftX: 10, driftY: -16, delay: 0.05, duration: 5.2, tone: 'blue' },
  { id: 2, xPct: 23, yPct: 72, size: 2, driftX: -8, driftY: -18, delay: 0.2, duration: 4.8, tone: 'white' },
  { id: 3, xPct: 31, yPct: 34, size: 3, driftX: 12, driftY: -14, delay: 0.1, duration: 5.5, tone: 'violet' },
  { id: 4, xPct: 42, yPct: 16, size: 2, driftX: -10, driftY: 12, delay: 0.3, duration: 4.6, tone: 'blue' },
  { id: 5, xPct: 58, yPct: 19, size: 2.5, driftX: 9, driftY: -12, delay: 0.15, duration: 5.0, tone: 'violet' },
  { id: 6, xPct: 68, yPct: 29, size: 2, driftX: -11, driftY: -15, delay: 0.25, duration: 4.9, tone: 'white' },
  { id: 7, xPct: 76, yPct: 64, size: 3, driftX: -12, driftY: -16, delay: 0.08, duration: 5.4, tone: 'blue' },
  { id: 8, xPct: 84, yPct: 39, size: 2, driftX: 8, driftY: -14, delay: 0.32, duration: 4.7, tone: 'violet' },
  { id: 9, xPct: 18, yPct: 52, size: 2.2, driftX: 11, driftY: 10, delay: 0.18, duration: 5.1, tone: 'white' },
  { id: 10, xPct: 87, yPct: 79, size: 2.4, driftX: -9, driftY: -14, delay: 0.12, duration: 5.3, tone: 'blue' },
  { id: 11, xPct: 38, yPct: 81, size: 2.2, driftX: 8, driftY: -12, delay: 0.28, duration: 4.8, tone: 'violet' },
  { id: 12, xPct: 63, yPct: 77, size: 2, driftX: -7, driftY: -16, delay: 0.22, duration: 5.0, tone: 'white' },
];

const CONVERGING_SEEDS = [
  { id: 'left', sx: '-72px', sy: '42px', ex: '-18px', ey: '18px', color: '#477BFF', delay: '0.48s' },
  { id: 'right', sx: '74px', sy: '40px', ex: '18px', ey: '18px', color: '#7055F7', delay: '0.52s' },
  { id: 'center', sx: '-48px', sy: '-36px', ex: '0px', ey: '0px', color: '#FFFFFF', delay: '0.55s' },
  { id: 'apex', sx: '46px', sy: '-54px', ex: '0px', ey: '-22px', color: '#35C9D8', delay: '0.58s' },
];

const WORDMARK_LETTERS = ['E', 'D', 'V', 'A', 'N', 'T', 'A'];

export function BrandIntro({ onComplete, reducedMotion = false }: BrandIntroProps) {
  const [phase, setPhase] = useState<'playing' | 'exiting'>('playing');

  const timing = DEFAULT_INTRO_TIMING;
  const exitStartMs =
    timing.backgroundMs + timing.logoMs + timing.wordmarkMs + timing.taglineMs; // 3000ms

  const handleSkip = useCallback(() => {
    if (phase === 'exiting') return;
    setPhase('exiting');
  }, [phase]);

  useEffect(() => {
    if (reducedMotion) {
      const fastTimer = window.setTimeout(() => setPhase('exiting'), 120);
      const endTimer = window.setTimeout(() => onComplete(), 380);
      return () => {
        window.clearTimeout(fastTimer);
        window.clearTimeout(endTimer);
      };
    }

    const exitTimer = window.setTimeout(() => {
      setPhase('exiting');
    }, exitStartMs);

    const completeTimer = window.setTimeout(() => {
      onComplete();
    }, timing.totalMs);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(completeTimer);
    };
  }, [exitStartMs, onComplete, reducedMotion, timing.totalMs]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSkip]);

  useEffect(() => {
    if (phase !== 'exiting') return;
    const unmountTimer = window.setTimeout(() => {
      onComplete();
    }, reducedMotion ? 220 : timing.transitionMs);
    return () => window.clearTimeout(unmountTimer);
  }, [onComplete, phase, reducedMotion, timing.transitionMs]);

  const isExiting = phase === 'exiting';

  return (
    <BrandTransition isExiting={isExiting} durationMs={reducedMotion ? 200 : 920}>
      {/* Scene 1: Deep Navy Ambient Lighting & Floating Particles */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ animation: 'edvanta-ambient-in 500ms ease-out forwards' }}
      >
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[780px] h-[480px] rounded-full opacity-35 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(112,85,247,0.45) 0%, rgba(53,201,216,0.18) 45%, rgba(17,19,34,0) 75%)',
          }}
        />
        <div
          className="absolute -bottom-40 right-1/4 w-[620px] h-[420px] rounded-full opacity-25 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(71,123,255,0.4) 0%, rgba(112,85,247,0.14) 50%, rgba(17,19,34,0) 75%)',
          }}
        />

        {AMBIENT_PARTICLES.map((p) => {
          const bg =
            p.tone === 'blue'
              ? 'bg-[#477BFF]'
              : p.tone === 'violet'
              ? 'bg-[#7055F7]'
              : 'bg-slate-200';
          return (
            <span
              key={p.id}
              className={`absolute rounded-full ${bg}`}
              style={
                {
                  left: `${p.xPct}%`,
                  top: `${p.yPct}%`,
                  width: p.size,
                  height: p.size,
                  '--dx': `${p.driftX}px`,
                  '--dy': `${p.driftY}px`,
                  animation: `edvanta-particle-float ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
                } as React.CSSProperties
              }
            />
          );
        })}
      </div>

      {/* Center Stage: Scene 2 (Logo Formation) + Scene 3 (Wordmark & Tagline) -> Scene 4 Glide */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-6 select-none will-change-[transform,opacity]"
        style={{
          opacity: isExiting ? 0 : 1,
          transform: isExiting ? 'translate3d(0, -108px, 0) scale(0.78)' : 'translate3d(0, 0, 0) scale(1)',
          transition:
            'opacity 850ms cubic-bezier(0.16, 1, 0.3, 1), transform 850ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Symbol Assembly Stage */}
        <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32">
          {/* Converging Seed Particles */}
          {CONVERGING_SEEDS.map((seed) => (
            <span
              key={seed.id}
              aria-hidden="true"
              className="absolute w-2.5 h-2.5 rounded-full pointer-events-none opacity-0"
              style={
                {
                  backgroundColor: seed.color,
                  boxShadow: `0 0 14px ${seed.color}`,
                  '--sx': seed.sx,
                  '--sy': seed.sy,
                  '--ex': seed.ex,
                  '--ey': seed.ey,
                  animation: `edvanta-seed-converge 0.78s cubic-bezier(0.16, 1, 0.3, 1) ${seed.delay} forwards`,
                } as React.CSSProperties
              }
            />
          ))}

          {/* Precision Glow Behind Assembled Symbol */}
          <div
            aria-hidden="true"
            className="absolute inset-2 rounded-full blur-2xl pointer-events-none opacity-0"
            style={{
              background: 'linear-gradient(135deg, rgba(112,85,247,0.45), rgba(53,201,216,0.35))',
              animation: 'edvanta-glow-pulse 0.95s ease-out 1.02s forwards',
            }}
          />

          {/* Original EDVANTA Symbol Assembling */}
          <svg
            viewBox="0 0 64 64"
            className="relative w-24 h-24 sm:w-28 sm:h-28 overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="edvanta-intro-grad" x1="12" y1="50" x2="52" y2="10" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#7055F7" />
                <stop offset="55%" stopColor="#477BFF" />
                <stop offset="100%" stopColor="#35C9D8" />
              </linearGradient>
              <linearGradient id="edvanta-intro-sweep" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7055F7" stopOpacity="0" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#35C9D8" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Left Ascending Pillar */}
            <path
              pathLength={1}
              d="M14 49L29.6 18.2C30.1 17.2 31 16.8 32 16.8"
              stroke="#FFFFFF"
              strokeWidth="4.8"
              strokeLinecap="round"
              strokeDasharray="1"
              strokeDashoffset="1"
              style={{
                opacity: 0,
                animation: 'edvanta-draw-left 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.62s forwards',
              }}
            />

            {/* Right Ascending Pillar */}
            <path
              pathLength={1}
              d="M50 49L34.4 18.2C33.9 17.2 33 16.8 32 16.8"
              stroke="#FFFFFF"
              strokeWidth="4.8"
              strokeLinecap="round"
              strokeDasharray="1"
              strokeDashoffset="1"
              style={{
                opacity: 0,
                animation: 'edvanta-draw-right 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.68s forwards',
              }}
            />

            {/* Interlocking Neural Pathway Bridge */}
            <path
              pathLength={1}
              d="M21.5 38.5L32 31L46.5 23.5"
              stroke="url(#edvanta-intro-grad)"
              strokeWidth="4.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="1"
              strokeDashoffset="1"
              style={{
                opacity: 0,
                animation: 'edvanta-draw-line 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.92s forwards',
              }}
            />

            {/* Traveling Blue-Violet Light Pulse Across Symbol */}
            <path
              pathLength={1}
              d="M14 49L32 16.8L50 49"
              stroke="url(#edvanta-intro-sweep)"
              strokeWidth="5.4"
              strokeLinecap="round"
              strokeDasharray="0.28 1"
              strokeDashoffset="1.2"
              style={{
                opacity: 0,
                animation: 'edvanta-symbol-sweep 0.72s ease-in-out 1.24s forwards',
              }}
            />

            {/* Neural Base & Nexus Nodes */}
            <circle
              cx="14"
              cy="49"
              r="3.4"
              fill="#7055F7"
              style={{
                opacity: 0,
                transformOrigin: '14px 49px',
                animation: 'edvanta-node-pop 0.36s cubic-bezier(0.16, 1, 0.3, 1) 0.92s forwards',
              }}
            />
            <circle
              cx="50"
              cy="49"
              r="3.4"
              fill="#477BFF"
              style={{
                opacity: 0,
                transformOrigin: '50px 49px',
                animation: 'edvanta-node-pop 0.36s cubic-bezier(0.16, 1, 0.3, 1) 0.98s forwards',
              }}
            />
            <circle
              cx="46.5"
              cy="23.5"
              r="2.8"
              fill="#35C9D8"
              style={{
                opacity: 0,
                transformOrigin: '46.5px 23.5px',
                animation: 'edvanta-node-pop 0.36s cubic-bezier(0.16, 1, 0.3, 1) 1.12s forwards',
              }}
            />
            <circle
              cx="32"
              cy="31"
              r="4"
              fill="#111322"
              stroke="url(#edvanta-intro-grad)"
              strokeWidth="2.5"
              style={{
                opacity: 0,
                transformOrigin: '32px 31px',
                animation: 'edvanta-node-pop 0.36s cubic-bezier(0.16, 1, 0.3, 1) 1.08s forwards',
              }}
            />

            {/* Ascending Crown Apex Diamond */}
            <path
              d="M32 7.5L37 12.5L32 17.5L27 12.5L32 7.5Z"
              fill="url(#edvanta-intro-grad)"
              style={{
                opacity: 0,
                transformOrigin: '32px 12.5px',
                animation: 'edvanta-apex-drop 0.45s cubic-bezier(0.16, 1, 0.3, 1) 1.22s forwards',
              }}
            />
          </svg>
        </div>

        {/* Scene 3: EDVANTA Wordmark Reveal + Light Sweep */}
        <div className="relative mt-5 overflow-hidden px-3 py-1">
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl tracking-[0.14em] text-white flex items-center justify-center">
            {WORDMARK_LETTERS.map((char, idx) => (
              <span
                key={`${char}-${idx}`}
                className="inline-block opacity-0"
                style={{
                  animation: `edvanta-letter-in 0.42s cubic-bezier(0.16, 1, 0.3, 1) ${
                    1.68 + idx * 0.065
                  }s forwards`,
                }}
              >
                {char}
              </span>
            ))}
          </h1>

          {/* Brief horizontal light sweep across wordmark */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-24 opacity-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(112,85,247,0.45) 50%, rgba(255,255,255,0) 100%)',
              animation: 'edvanta-wordmark-sweep 0.7s ease-in-out 2.08s forwards',
            }}
          />
        </div>

        {/* Tagline Fade-In */}
        <p
          className="mt-2.5 text-sm sm:text-base font-medium tracking-[0.04em] text-[#B4BDD9] opacity-0"
          style={{
            animation: 'edvanta-tagline-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) 2.46s forwards',
          }}
        >
          Learn Smarter. Grow Further.
        </p>
      </div>

      {/* Accessible Skip Control */}
      <button
        type="button"
        onClick={handleSkip}
        className="fixed bottom-6 right-6 z-20 inline-flex items-center justify-center rounded-xl border border-[#2B3150] bg-[#181B2E]/85 hover:bg-[#212640] px-4 py-2.5 min-h-[44px] text-xs font-medium text-[#B4BDD9] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7055F7] whitespace-nowrap"
      >
        Skip intro
      </button>
    </BrandTransition>
  );
}
