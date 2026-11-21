let introCompletedInAppSession = false;

export interface IntroTimingConfig {
  backgroundMs: number;
  logoMs: number;
  wordmarkMs: number;
  taglineMs: number;
  transitionMs: number;
  totalMs: number;
}

export const DEFAULT_INTRO_TIMING: IntroTimingConfig = {
  backgroundMs: 500,
  logoMs: 1200,
  wordmarkMs: 800,
  taglineMs: 500,
  transitionMs: 1000,
  totalMs: 4000,
};

export const REDUCED_MOTION_TIMING: IntroTimingConfig = {
  backgroundMs: 60,
  logoMs: 120,
  wordmarkMs: 100,
  taglineMs: 80,
  transitionMs: 180,
  totalMs: 540,
};

export interface BrandIntroDecisionInput {
  pathname: string;
  search: string;
  hasSeenInSession: boolean;
  prefersReducedMotion: boolean;
  forceReplay?: boolean;
}

export function shouldPlayBrandIntro(input: BrandIntroDecisionInput): boolean {
  if (input.forceReplay) {
    return true;
  }

  const params = new URLSearchParams(input.search || '');
  if (params.get('autostart') === '1' || params.get('skipIntro') === '1') {
    return false;
  }

  if (params.get('intro') === '1') {
    return true;
  }

  if (input.pathname !== '/') {
    return false;
  }

  if (input.prefersReducedMotion) {
    return false;
  }

  return !input.hasSeenInSession;
}

export function getIntroTiming(prefersReducedMotion: boolean): IntroTimingConfig {
  return prefersReducedMotion ? REDUCED_MOTION_TIMING : DEFAULT_INTRO_TIMING;
}

/**
 * Tracks intro completion within the current SPA lifecycle so:
 * - Fresh platform launches / page reloads on `/` always play the signature opening animation.
 * - Internal route navigation back to `/` does not repeat the animation.
 */
export function readIntroSeenFlag(): boolean {
  return introCompletedInAppSession;
}

export function markIntroSeenFlag(): void {
  introCompletedInAppSession = true;
}

export function resetIntroSeenFlagForTest(): void {
  introCompletedInAppSession = false;
}
