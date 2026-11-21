import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLearningQuests,
  buildWeeklyActivityCalendar,
  computeActivityXp,
  computeCompanionTier,
  computeLearnerLevel,
} from './gamificationLogic';

describe('gamificationLogic', () => {
  it('computes XP strictly from verified learning actions', () => {
    assert.equal(
      computeActivityXp({
        badgeXp: 0,
        totalAttempted: 0,
        correctAttempts: 0,
        completedModulesCount: 0,
        knownFlashcardsCount: 0,
        completedMockExamsCount: 0,
      }),
      0
    );

    const xp = computeActivityXp({
      badgeXp: 250,
      totalAttempted: 10,
      correctAttempts: 8,
      completedModulesCount: 2,
      knownFlashcardsCount: 3,
      completedMockExamsCount: 1,
    });
    // 250 + 100 + 40 + 80 + 24 + 60 = 554
    assert.equal(xp, 554);
  });

  it('computes progressive learner level and XP progress bounds', () => {
    const lv1 = computeLearnerLevel(120);
    assert.equal(lv1.level, 1);
    assert.equal(lv1.xpInLevel, 120);
    assert.equal(lv1.xpForNextLevel, 200);
    assert.equal(lv1.xpRemaining, 80);

    const lv2 = computeLearnerLevel(200);
    assert.equal(lv2.level, 2);
    assert.equal(lv2.xpInLevel, 0);
    assert.equal(lv2.xpForNextLevel, 275);

    const lv3 = computeLearnerLevel(475);
    assert.equal(lv3.level, 3);
    assert.equal(lv3.xpInLevel, 0);
  });

  it('evolves Volt companion tier cleanly with learner level', () => {
    assert.equal(computeCompanionTier(1).tier, 1);
    assert.equal(computeCompanionTier(3).tier, 2);
    assert.equal(computeCompanionTier(5).tier, 3);
    assert.equal(computeCompanionTier(8).tier, 4);
  });

  it('builds a 7-day UTC weekly activity calendar from stored counts', () => {
    const cal = buildWeeklyActivityCalendar({
      referenceDateIso: '2026-11-21T14:30:00.000Z',
      activityCountsByDate: {
        '2026-11-19': 4,
        '2026-11-21': 2,
      },
    });
    assert.equal(cal.length, 7);
    assert.equal(cal[0].date, '2026-11-15');
    assert.equal(cal[0].active, false);
    assert.equal(cal[4].date, '2026-11-19');
    assert.equal(cal[4].count, 4);
    assert.equal(cal[4].active, true);
    assert.equal(cal[6].date, '2026-11-21');
    assert.equal(cal[6].isToday, true);
    assert.equal(cal[6].count, 2);
  });

  it('derives quest completion accurately from persisted progress counts', () => {
    const quests = buildLearningQuests({
      todayActions: 3,
      dailyGoalTarget: 5,
      completedModulesCount: 4,
      knownFlashcardsCount: 2,
      masteredCount: 1,
      resolvedMisconceptionsCount: 0,
    });
    assert.equal(quests.length, 4);
    assert.equal(quests[0].completed, false);
    assert.equal(quests[0].progress, 3);
    assert.equal(quests[1].completed, true);
  });
});
