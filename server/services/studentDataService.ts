import {
  AchievementBadge,
  AchievementsPayload,
  AttemptHistoryItem,
  AuthUser,
  ConceptNode,
  Difficulty,
  LearnerConceptMastery,
  LearningModuleItem,
  MasteryStatus,
  MisconceptionRecord,
  RevisionTask,
  StudentDashboardPayload,
} from '../../shared/types';
import { db, initializeStudentMasteryRows } from '../db/database';
import { computeOverallMastery } from './learnerModel';
import { resolveRevisionStatus } from './revisionScheduler';
import { computeUpdatedStreak, evaluateAchievements } from './achievementsEngine';
import { ELECTRICITY_MODULES } from '../curriculum/modules';

export function getConceptGraphNodes(): ConceptNode[] {
  const concepts = db
    .prepare(
      `SELECT id, slug, name, description, key_formula, order_index, graph_x, graph_y
       FROM concepts ORDER BY order_index ASC`
    )
    .all() as Array<{
    id: number;
    slug: string;
    name: string;
    description: string;
    key_formula: string;
    order_index: number;
    graph_x: number;
    graph_y: number;
  }>;

  const prereqRows = db
    .prepare(`SELECT concept_id, prerequisite_id FROM concept_prerequisites`)
    .all() as Array<{ concept_id: number; prerequisite_id: number }>;

  const prereqMap = new Map<number, number[]>();
  for (const row of prereqRows) {
    const arr = prereqMap.get(row.concept_id) ?? [];
    arr.push(row.prerequisite_id);
    prereqMap.set(row.concept_id, arr);
  }

  return concepts.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    keyFormula: c.key_formula,
    orderIndex: c.order_index,
    graphX: c.graph_x,
    graphY: c.graph_y,
    prerequisites: prereqMap.get(c.id) ?? [],
  }));
}

export function getStudentConceptMasteries(studentId: number): LearnerConceptMastery[] {
  initializeStudentMasteryRows(studentId);
  const nodes = getConceptGraphNodes();

  const rows = db
    .prepare(
      `SELECT concept_id, mastery_score, status, attempt_count, correct_count, last_practiced_at
       FROM learner_mastery WHERE student_id = ?`
    )
    .all(studentId) as Array<{
    concept_id: number;
    mastery_score: number;
    status: MasteryStatus;
    attempt_count: number;
    correct_count: number;
    last_practiced_at: string | null;
  }>;

  const rowMap = new Map(rows.map((r) => [r.concept_id, r]));

  return nodes.map((node) => {
    const m = rowMap.get(node.id);
    return {
      ...node,
      masteryScore: m ? Math.round(m.mastery_score) : 0,
      status: m ? m.status : 'not_started',
      attemptCount: m ? m.attempt_count : 0,
      correctCount: m ? m.correct_count : 0,
      lastPracticedAt: m ? m.last_practiced_at : null,
    };
  });
}

export function getStudentRevisions(studentId: number): RevisionTask[] {
  const rows = db
    .prepare(
      `SELECT r.id, r.student_id, r.concept_id, c.name as concept_name, c.slug as concept_slug,
              COALESCE(lm.mastery_score, 0) as mastery_score,
              r.scheduled_for, r.interval_days, r.repetition_count, r.reason, r.completed_at
       FROM revision_schedules r
       JOIN concepts c ON c.id = r.concept_id
       LEFT JOIN learner_mastery lm ON lm.student_id = r.student_id AND lm.concept_id = r.concept_id
       WHERE r.student_id = ?
       ORDER BY (r.completed_at IS NOT NULL) ASC, r.scheduled_for ASC`
    )
    .all(studentId) as Array<{
    id: number;
    student_id: number;
    concept_id: number;
    concept_name: string;
    concept_slug: string;
    mastery_score: number;
    scheduled_for: string;
    interval_days: number;
    repetition_count: number;
    reason: string;
    completed_at: string | null;
  }>;

  return rows.map((r) => ({
    id: r.id,
    studentId: r.student_id,
    conceptId: r.concept_id,
    conceptName: r.concept_name,
    conceptSlug: r.concept_slug,
    masteryScore: Math.round(r.mastery_score),
    status: resolveRevisionStatus(r.scheduled_for, r.completed_at),
    scheduledFor: r.scheduled_for,
    intervalDays: r.interval_days,
    repetitionCount: r.repetition_count,
    reason: r.reason,
    completedAt: r.completed_at,
  }));
}

export function getStudentMisconceptions(studentId: number, limit = 20): MisconceptionRecord[] {
  const rows = db
    .prepare(
      `SELECT m.id, m.student_id, m.concept_id, c.name as concept_name, m.question_id,
              q.question_text, m.student_reasoning, m.misconception_title,
              m.conceptual_error, m.corrective_explanation, m.confidence_status,
              m.resolved, m.created_at
       FROM misconceptions m
       JOIN concepts c ON c.id = m.concept_id
       LEFT JOIN questions q ON q.id = m.question_id
       WHERE m.student_id = ?
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT ?`
    )
    .all(studentId, limit) as Array<{
    id: number;
    student_id: number;
    concept_id: number;
    concept_name: string;
    question_id: number;
    question_text: string | null;
    student_reasoning: string;
    misconception_title: string;
    conceptual_error: string;
    corrective_explanation: string;
    confidence_status: 'identified' | 'uncertain' | 'none';
    resolved: number;
    created_at: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    studentId: r.student_id,
    conceptId: r.concept_id,
    conceptName: r.concept_name,
    questionId: r.question_id,
    questionText: r.question_text ?? undefined,
    studentReasoning: r.student_reasoning,
    misconceptionTitle: r.misconception_title,
    conceptualError: r.conceptual_error,
    correctiveExplanation: r.corrective_explanation,
    confidenceStatus: r.confidence_status,
    resolved: Boolean(r.resolved),
    createdAt: r.created_at,
  }));
}

export function getStudentRecentAttempts(studentId: number, limit = 25): AttemptHistoryItem[] {
  const rows = db
    .prepare(
      `SELECT sa.id, sa.question_id, q.question_text, sa.concept_id, c.name as concept_name,
              q.difficulty, sa.selected_index, q.correct_index, q.options_json, sa.is_correct,
              sa.student_reasoning, sa.mastery_before, sa.mastery_after,
              sa.misconception_title, sa.corrective_explanation, sa.created_at
       FROM student_answers sa
       JOIN questions q ON q.id = sa.question_id
       JOIN concepts c ON c.id = sa.concept_id
       WHERE sa.student_id = ?
       ORDER BY sa.created_at DESC, sa.id DESC
       LIMIT ?`
    )
    .all(studentId, limit) as Array<{
    id: number;
    question_id: number;
    question_text: string;
    concept_id: number;
    concept_name: string;
    difficulty: Difficulty;
    selected_index: number;
    correct_index: number;
    options_json: string;
    is_correct: number;
    student_reasoning: string;
    mastery_before: number;
    mastery_after: number;
    misconception_title: string | null;
    corrective_explanation: string | null;
    created_at: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    questionId: r.question_id,
    questionText: r.question_text,
    conceptId: r.concept_id,
    conceptName: r.concept_name,
    difficulty: r.difficulty,
    selectedIndex: r.selected_index,
    correctIndex: r.correct_index,
    options: JSON.parse(r.options_json) as string[],
    isCorrect: Boolean(r.is_correct),
    studentReasoning: r.student_reasoning,
    masteryBefore: Math.round(r.mastery_before),
    masteryAfter: Math.round(r.mastery_after),
    misconceptionTitle: r.misconception_title,
    correctiveExplanation: r.corrective_explanation,
    createdAt: r.created_at,
  }));
}

export function buildStudentDashboard(user: AuthUser): StudentDashboardPayload {
  const conceptMasteries = getStudentConceptMasteries(user.id);
  const overallMastery = computeOverallMastery(conceptMasteries);

  const statsRow = db
    .prepare(
      `SELECT COUNT(*) as total_attempted, COALESCE(SUM(is_correct), 0) as total_correct
       FROM student_answers WHERE student_id = ?`
    )
    .get(user.id) as { total_attempted: number; total_correct: number };

  const totalAttempted = statsRow.total_attempted;
  const accuracyRate = totalAttempted > 0 ? Math.round((statsRow.total_correct / totalAttempted) * 100) : 0;

  const diagRow = db
    .prepare(
      `SELECT COUNT(*) as cnt FROM assessment_attempts
       WHERE student_id = ? AND attempt_type = 'diagnostic' AND completed_at IS NOT NULL`
    )
    .get(user.id) as { cnt: number };
  const hasCompletedDiagnostic = diagRow.cnt > 0;

  const practiced = conceptMasteries.filter((c) => c.attemptCount > 0);
  const strongestConcepts = [...practiced]
    .sort((a, b) => b.masteryScore - a.masteryScore)
    .slice(0, 3);
  const weakestConcepts = [...practiced]
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 3);

  const upcomingRevisions = getStudentRevisions(user.id).filter((r) => r.status !== 'completed');
  const recentMisconceptions = getStudentMisconceptions(user.id, 6);
  const recentAttempts = getStudentRecentAttempts(user.id, 10);

  // Build progress history grouped by calendar day from stored answers
  const historyRows = db
    .prepare(
      `SELECT substr(created_at, 1, 10) as day,
              COUNT(*) as attempts,
              SUM(is_correct) as correct_cnt,
              AVG(mastery_after) as avg_mastery
       FROM student_answers
       WHERE student_id = ?
       GROUP BY substr(created_at, 1, 10)
       ORDER BY day ASC
       LIMIT 14`
    )
    .all(user.id) as Array<{
    day: string;
    attempts: number;
    correct_cnt: number;
    avg_mastery: number;
  }>;

  const progressHistory = historyRows.map((h) => ({
    date: h.day,
    accuracy: h.attempts > 0 ? Math.round((h.correct_cnt / h.attempts) * 100) : 0,
    avgMastery: Math.round(h.avg_mastery),
    attempts: h.attempts,
  }));

  // Determine recommended next activity from real state
  const dueRevision = upcomingRevisions.find((r) => r.status === 'due');
  let recommendedActivity: StudentDashboardPayload['recommendedActivity'];

  if (!hasCompletedDiagnostic) {
    recommendedActivity = {
      type: 'diagnostic',
      title: 'Start Electricity Diagnostic Assessment',
      description: 'Complete 8 baseline questions so ADAPTIX can map your strengths and pinpoint conceptual gaps.',
      targetPath: '/student/diagnostic',
    };
  } else if (dueRevision) {
    recommendedActivity = {
      type: 'revision',
      title: `Due Revision: ${dueRevision.conceptName}`,
      description: dueRevision.reason,
      conceptId: dueRevision.conceptId,
      conceptName: dueRevision.conceptName,
      targetPath: '/student/revisions',
    };
  } else if (weakestConcepts.length > 0 && weakestConcepts[0].masteryScore < 75) {
    const target = weakestConcepts[0];
    recommendedActivity = {
      type: 'practice',
      title: `Targeted Practice: ${target.name}`,
      description: `Current mastery is ${target.masteryScore}%. Adaptive questions will reinforce core principles.`,
      conceptId: target.id,
      conceptName: target.name,
      targetPath: `/student/practice?conceptId=${target.id}`,
    };
  } else {
    recommendedActivity = {
      type: 'practice',
      title: 'Advance to High-Difficulty Mastery Drill',
      description: 'Challenge your conceptual mastery across multi-step Electricity problems.',
      targetPath: '/student/practice',
    };
  }

  return {
    user,
    hasCompletedDiagnostic,
    overallMastery,
    totalAttempted,
    accuracyRate,
    strongestConcepts,
    weakestConcepts,
    conceptMasteries,
    upcomingRevisions,
    recentMisconceptions,
    recentAttempts,
    recommendedActivity,
    progressHistory,
  };
}

function buildAchievementsEvaluation(studentId: number, persistNewUnlocks: boolean): AchievementsPayload & {
  newlyUnlocked: AchievementBadge[];
} {
  const userRow = db
    .prepare(`SELECT streak_days FROM users WHERE id = ?`)
    .get(studentId) as { streak_days: number } | undefined;

  const streakDays = userRow?.streak_days ?? 1;

  const diagCount = (
    db
      .prepare(
        `SELECT COUNT(*) as cnt FROM assessment_attempts WHERE student_id = ? AND attempt_type = 'diagnostic' AND completed_at IS NOT NULL`
      )
      .get(studentId) as { cnt: number }
  ).cnt;

  const resolvedMisconceptionsCount = (
    db
      .prepare(`SELECT COUNT(*) as cnt FROM misconceptions WHERE student_id = ? AND resolved = 1`)
      .get(studentId) as { cnt: number }
  ).cnt;

  const completedModulesCount = (
    db
      .prepare(`SELECT COUNT(*) as cnt FROM student_module_progress WHERE student_id = ? AND completed = 1`)
      .get(studentId) as { cnt: number }
  ).cnt;

  const unlockedRows = db
    .prepare(`SELECT badge_id, unlocked_at FROM student_achievements WHERE student_id = ?`)
    .all(studentId) as Array<{ badge_id: string; unlocked_at: string }>;

  const unlockedMap = new Map(unlockedRows.map((r) => [r.badge_id, r.unlocked_at]));
  const conceptMasteries = getStudentConceptMasteries(studentId);

  const evaluated = evaluateAchievements({
    streakDays,
    diagnosticCount: diagCount,
    conceptMasteries,
    resolvedMisconceptionsCount,
    completedModulesCount,
    unlockedMap,
  });

  const nowIso = new Date().toISOString();
  if (persistNewUnlocks && evaluated.newlyUnlocked.length > 0) {
    const insertBadge = db.prepare(`
      INSERT OR IGNORE INTO student_achievements (student_id, badge_id, unlocked_at)
      VALUES (?, ?, ?)
    `);
    for (const badge of evaluated.newlyUnlocked) {
      insertBadge.run(studentId, badge.id, nowIso);
      badge.unlockedAt = nowIso;
    }
  }

  const badges = evaluated.badges.map((b) =>
    b.unlocked && !b.unlockedAt ? { ...b, unlockedAt: nowIso } : b
  );

  return {
    streakDays,
    totalXp: evaluated.totalXp,
    unlockedCount: badges.filter((b) => b.unlocked).length,
    totalCount: badges.length,
    badges,
    newlyUnlocked: evaluated.newlyUnlocked,
  };
}

export function getStudentAchievements(studentId: number): AchievementsPayload {
  const { streakDays, totalXp, unlockedCount, totalCount, badges } = buildAchievementsEvaluation(
    studentId,
    true
  );
  return { streakDays, totalXp, unlockedCount, totalCount, badges };
}

export function syncStudentStreakAndAchievements(studentId: number): {
  streakDays: number;
  newlyUnlocked: AchievementBadge[];
  achievements: AchievementsPayload;
} {
  const userRow = db
    .prepare(`SELECT streak_days, last_activity_date FROM users WHERE id = ?`)
    .get(studentId) as { streak_days: number; last_activity_date: string | null } | undefined;

  const { newStreak, activityDateKey } = computeUpdatedStreak({
    currentStreak: userRow?.streak_days ?? 0,
    lastActivityDate: userRow?.last_activity_date ?? null,
  });

  const nowIso = new Date().toISOString();
  db.prepare(`UPDATE users SET streak_days = ?, last_activity_date = ?, last_active_at = ? WHERE id = ?`).run(
    newStreak,
    activityDateKey,
    nowIso,
    studentId
  );

  const evaluated = buildAchievementsEvaluation(studentId, true);
  return {
    streakDays: newStreak,
    newlyUnlocked: evaluated.newlyUnlocked,
    achievements: {
      streakDays: newStreak,
      totalXp: evaluated.totalXp,
      unlockedCount: evaluated.unlockedCount,
      totalCount: evaluated.totalCount,
      badges: evaluated.badges,
    },
  };
}

export function getStudentModules(studentId: number): LearningModuleItem[] {
  const masteries = getStudentConceptMasteries(studentId);
  const masteryBySlug = new Map(masteries.map((m) => [m.slug, m]));

  const progressRows = db
    .prepare(`SELECT concept_id, completed, completed_at FROM student_module_progress WHERE student_id = ?`)
    .all(studentId) as Array<{ concept_id: number; completed: number; completed_at: string | null }>;
  const progressMap = new Map(progressRows.map((p) => [p.concept_id, p]));

  return ELECTRICITY_MODULES.map((mod) => {
    const concept = masteryBySlug.get(mod.conceptSlug);
    const conceptId = concept?.id ?? mod.orderIndex;
    const prog = progressMap.get(conceptId);

    return {
      conceptId,
      conceptSlug: mod.conceptSlug,
      orderIndex: mod.orderIndex,
      title: mod.title,
      subtitle: mod.subtitle,
      estimatedMinutes: mod.estimatedMinutes,
      keyFormula: concept?.keyFormula ?? '',
      unitsNote: mod.unitsNote,
      objectives: mod.objectives,
      coreExplanation: mod.coreExplanation,
      workedExample: mod.workedExample,
      misconceptionWatch: mod.misconceptionWatch,
      simulatorType: mod.simulatorType,
      quickCheck: mod.quickCheck,
      completed: Boolean(prog?.completed),
      completedAt: prog?.completed_at ?? null,
      masteryScore: concept?.masteryScore ?? 0,
      masteryStatus: concept?.status ?? 'not_started',
    };
  });
}

export function completeStudentModule(
  studentId: number,
  conceptId: number,
  quickCheckCorrect: boolean
): {
  modules: LearningModuleItem[];
  achievements: AchievementsPayload;
  newlyUnlockedBadges: AchievementBadge[];
  streakDays: number;
} {
  const nowIso = new Date().toISOString();
  db.prepare(
    `INSERT INTO student_module_progress (student_id, concept_id, completed, quick_check_correct, completed_at)
     VALUES (?, ?, 1, ?, ?)
     ON CONFLICT(student_id, concept_id) DO UPDATE SET
       completed = 1,
       quick_check_correct = MAX(student_module_progress.quick_check_correct, excluded.quick_check_correct),
       completed_at = COALESCE(student_module_progress.completed_at, excluded.completed_at)`
  ).run(studentId, conceptId, quickCheckCorrect ? 1 : 0, nowIso);

  const synced = syncStudentStreakAndAchievements(studentId);
  const modules = getStudentModules(studentId);

  return {
    modules,
    achievements: synced.achievements,
    newlyUnlockedBadges: synced.newlyUnlocked,
    streakDays: synced.streakDays,
  };
}

