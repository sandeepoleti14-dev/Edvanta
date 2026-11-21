import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_INTRO_TIMING,
  getIntroTiming,
  REDUCED_MOTION_TIMING,
  shouldPlayBrandIntro,
} from './brandIntroLogic';

test('plays brand intro on fresh launch at root path', () => {
  assert.equal(
    shouldPlayBrandIntro({
      pathname: '/',
      search: '',
      hasSeenInSession: false,
      prefersReducedMotion: false,
    }),
    true
  );
});

test('skips brand intro when autostart=1 or skipIntro=1 is passed', () => {
  assert.equal(
    shouldPlayBrandIntro({
      pathname: '/',
      search: '?autostart=1',
      hasSeenInSession: false,
      prefersReducedMotion: false,
    }),
    false
  );
  assert.equal(
    shouldPlayBrandIntro({
      pathname: '/',
      search: '?skipIntro=1',
      hasSeenInSession: false,
      prefersReducedMotion: false,
    }),
    false
  );
});

test('avoids repeating brand intro after seen in session or on sub-routes', () => {
  assert.equal(
    shouldPlayBrandIntro({
      pathname: '/',
      search: '',
      hasSeenInSession: true,
      prefersReducedMotion: false,
    }),
    false
  );
  assert.equal(
    shouldPlayBrandIntro({
      pathname: '/auth',
      search: '',
      hasSeenInSession: false,
      prefersReducedMotion: false,
    }),
    false
  );
});

test('respects reduced motion by skipping auto-play unless forced replay is requested', () => {
  assert.equal(
    shouldPlayBrandIntro({
      pathname: '/',
      search: '',
      hasSeenInSession: false,
      prefersReducedMotion: true,
    }),
    false
  );
  assert.equal(
    shouldPlayBrandIntro({
      pathname: '/',
      search: '',
      hasSeenInSession: true,
      prefersReducedMotion: true,
      forceReplay: true,
    }),
    true
  );
  assert.equal(
    shouldPlayBrandIntro({
      pathname: '/',
      search: '?intro=1',
      hasSeenInSession: true,
      prefersReducedMotion: true,
    }),
    true
  );
});

test('intro timing totals stay within 3-5 seconds on standard motion and fast on reduced motion', () => {
  const normal = getIntroTiming(false);
  assert.equal(normal.totalMs, DEFAULT_INTRO_TIMING.totalMs);
  assert.ok(normal.totalMs >= 3000 && normal.totalMs <= 5000);
  assert.equal(
    normal.backgroundMs +
      normal.logoMs +
      normal.wordmarkMs +
      normal.taglineMs +
      normal.transitionMs,
    normal.totalMs
  );

  const reduced = getIntroTiming(true);
  assert.equal(reduced.totalMs, REDUCED_MOTION_TIMING.totalMs);
  assert.ok(reduced.totalMs < 1000);
});
