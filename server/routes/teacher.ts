import { Router, Response } from 'express';
import { db } from '../db/database';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { AuthenticatedRequest } from '../utils/auth';
import {
  getStudentConceptMasteries,
  getStudentMisconceptions,
  getStudentRecentAttempts,
  getStudentRevisions,
} from '../services/studentDataService';
import { computeOverallMastery } from '../services/learnerModel';
import { TeacherOverviewPayload, TeacherStudentDetailPayload } from '../../shared/types';

export const teacherRouter = Router();

teacherRouter.use(requireAuth, requireRole('teacher'));

teacherRouter.get('/overview', (req: AuthenticatedRequest, res: Response) => {
  const teacher = req.authUser!;
  const classRow = teacher.classId
    ? (db.prepare('SELECT id, name FROM classes WHERE id = ?').get(teacher.classId) as
        | { id: number; name: string }
        | undefined)
    : (db.prepare('SELECT id, name FROM classes LIMIT 1').get() as { id: number; name: string } | undefined);

  const students = db
    .prepare(
      `SELECT id, name, email, grade_level, streak_days, last_active_at
       FROM users
       WHERE role = 'student'
       ORDER BY name ASC`
    )
    .all() as Array<{
    id: number;
    name: string;
    email: string;
    grade_level: string;
    streak_days: number;
    last_active_at: string | null;
  }>;

  const concepts = db
    .prepare(`SELECT id, name FROM concepts ORDER BY order_index ASC`)
    .all() as Array<{ id: number; name: string }>;

  const studentRows: TeacherOverviewPayload['students'] = [];
  let sumMastery = 0;
  let totalAttemptsAll = 0;
  let totalCorrectAll = 0;

  for (const s of students) {
    const masteries = getStudentConceptMasteries(s.id);
    const overallMastery = computeOverallMastery(masteries);
    const ansStats = db
      .prepare(
        `SELECT COUNT(*) as total_attempted, COALESCE(SUM(is_correct), 0) as total_correct
         FROM student_answers WHERE student_id = ?`
      )
      .get(s.id) as { total_attempted: number; total_correct: number };

    const miscCount = db
      .prepare(`SELECT COUNT(*) as cnt FROM misconceptions WHERE student_id = ? AND resolved = 0`)
      .get(s.id) as { cnt: number };

    const practiced = masteries.filter((m) => m.attemptCount > 0);
    const weakest = [...practiced].sort((a, b) => a.masteryScore - b.masteryScore)[0];

    const accuracyRate =
      ansStats.total_attempted > 0 ? Math.round((ansStats.total_correct / ansStats.total_attempted) * 100) : 0;

    sumMastery += overallMastery;
    totalAttemptsAll += ansStats.total_attempted;
    totalCorrectAll += ansStats.total_correct;

    studentRows.push({
      id: s.id,
      name: s.name,
      email: s.email,
      overallMastery,
      accuracyRate,
      totalAttempted: ansStats.total_attempted,
      misconceptionCount: miscCount.cnt,
      weakestConcept: weakest ? weakest.name : null,
      lastActiveAt: s.last_active_at,
    });
  }

  const conceptPerformance: TeacherOverviewPayload['conceptPerformance'] = [];
  const difficultConcepts: TeacherOverviewPayload['difficultConcepts'] = [];

  for (const c of concepts) {
    const rows = db
      .prepare(
        `SELECT lm.mastery_score, lm.status, lm.attempt_count
         FROM learner_mastery lm
         JOIN users u ON u.id = lm.student_id
         WHERE lm.concept_id = ? AND u.role = 'student'`
      )
      .all(c.id) as Array<{ mastery_score: number; status: string; attempt_count: number }>;

    const practicedRows = rows.filter((r) => r.attempt_count > 0);
    const avgMastery =
      practicedRows.length > 0
        ? Math.round(practicedRows.reduce((acc, r) => acc + r.mastery_score, 0) / practicedRows.length)
        : 0;

    const ansRow = db
      .prepare(
        `SELECT COUNT(*) as cnt, COALESCE(SUM(is_correct), 0) as corr
         FROM student_answers sa
         JOIN users u ON u.id = sa.student_id
         WHERE sa.concept_id = ? AND u.role = 'student'`
      )
      .get(c.id) as { cnt: number; corr: number };

    const accRate = ansRow.cnt > 0 ? Math.round((ansRow.corr / ansRow.cnt) * 100) : 0;
    const masteredCount = rows.filter((r) => r.status === 'mastered').length;
    const developingCount = rows.filter((r) => r.status === 'developing').length;
    const weakCount = rows.filter((r) => r.status === 'weak').length;
    const notStartedCount = Math.max(0, students.length - masteredCount - developingCount - weakCount);

    conceptPerformance.push({
      conceptId: c.id,
      conceptName: c.name,
      averageMastery: avgMastery,
      masteredCount,
      developingCount,
      weakCount,
      notStartedCount,
    });

    difficultConcepts.push({
      conceptId: c.id,
      conceptName: c.name,
      averageMastery: avgMastery,
      accuracyRate: accRate,
      weakStudentCount: weakCount,
    });
  }

  difficultConcepts.sort((a, b) => a.averageMastery - b.averageMastery);

  const commonMiscRows = db
    .prepare(
      `SELECT m.misconception_title, c.name as concept_name, COUNT(*) as occurrences,
              MAX(m.student_reasoning) as example_reasoning,
              MAX(m.corrective_explanation) as corrective_explanation
       FROM misconceptions m
       JOIN concepts c ON c.id = m.concept_id
       WHERE m.confidence_status = 'identified'
       GROUP BY m.misconception_title, c.name
       ORDER BY occurrences DESC
       LIMIT 8`
    )
    .all() as Array<{
    misconception_title: string;
    concept_name: string;
    occurrences: number;
    example_reasoning: string;
    corrective_explanation: string;
  }>;

  const trendRows = db
    .prepare(
      `SELECT substr(sa.created_at, 1, 10) as day,
              AVG(sa.mastery_after) as avg_mastery,
              COUNT(*) as total,
              SUM(sa.is_correct) as corr
       FROM student_answers sa
       JOIN users u ON u.id = sa.student_id
       WHERE u.role = 'student'
       GROUP BY substr(sa.created_at, 1, 10)
       ORDER BY day ASC
       LIMIT 10`
    )
    .all() as Array<{ day: string; avg_mastery: number; total: number; corr: number }>;

  const payload: TeacherOverviewPayload = {
    className: classRow?.name ?? 'Class 10 Physics — Section A',
    totalStudents: students.length,
    averageClassMastery: students.length > 0 ? Math.round(sumMastery / students.length) : 0,
    averageAccuracy: totalAttemptsAll > 0 ? Math.round((totalCorrectAll / totalAttemptsAll) * 100) : 0,
    totalAttemptsLogged: totalAttemptsAll,
    difficultConcepts,
    commonMisconceptions: commonMiscRows.map((m) => ({
      misconceptionTitle: m.misconception_title,
      conceptName: m.concept_name,
      occurrences: m.occurrences,
      exampleReasoning: m.example_reasoning,
      correctiveExplanation: m.corrective_explanation,
    })),
    conceptPerformance,
    students: studentRows,
    recentTrend: trendRows.map((t) => ({
      label: t.day,
      classMastery: Math.round(t.avg_mastery),
      accuracy: t.total > 0 ? Math.round((t.corr / t.total) * 100) : 0,
    })),
  };

  res.json(payload);
});

teacherRouter.get('/students/:id', (req: AuthenticatedRequest, res: Response) => {
  const studentId = Number(req.params.id);
  if (Number.isNaN(studentId)) {
    res.status(400).json({ error: 'Invalid student ID.' });
    return;
  }

  const student = db
    .prepare(
      `SELECT id, name, email, role, class_id, grade_level, streak_days
       FROM users WHERE id = ? AND role = 'student'`
    )
    .get(studentId) as
    | {
        id: number;
        name: string;
        email: string;
        role: 'student';
        class_id: number | null;
        grade_level: string;
        streak_days: number;
      }
    | undefined;

  if (!student) {
    res.status(404).json({ error: 'Student record not found.' });
    return;
  }

  const conceptMasteries = getStudentConceptMasteries(studentId);
  const overallMastery = computeOverallMastery(conceptMasteries);

  const ansStats = db
    .prepare(
      `SELECT COUNT(*) as total_attempted, COALESCE(SUM(is_correct), 0) as total_correct
       FROM student_answers WHERE student_id = ?`
    )
    .get(studentId) as { total_attempted: number; total_correct: number };

  const detail: TeacherStudentDetailPayload = {
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      role: 'student',
      classId: student.class_id,
      gradeLevel: student.grade_level,
      streakDays: student.streak_days,
    },
    overallMastery,
    accuracyRate:
      ansStats.total_attempted > 0 ? Math.round((ansStats.total_correct / ansStats.total_attempted) * 100) : 0,
    totalAttempted: ansStats.total_attempted,
    conceptMasteries,
    misconceptions: getStudentMisconceptions(studentId, 15),
    recentAttempts: getStudentRecentAttempts(studentId, 20),
    revisions: getStudentRevisions(studentId),
  };

  res.json(detail);
});

teacherRouter.get('/reports/csv', (_req: AuthenticatedRequest, res: Response) => {
  const rows = db
    .prepare(
      `SELECT u.name as student_name, u.email, c.name as concept_name,
              lm.mastery_score, lm.status, lm.attempt_count, lm.correct_count
       FROM learner_mastery lm
       JOIN users u ON u.id = lm.student_id
       JOIN concepts c ON c.id = lm.concept_id
       WHERE u.role = 'student'
       ORDER BY u.name ASC, c.order_index ASC`
    )
    .all() as Array<{
    student_name: string;
    email: string;
    concept_name: string;
    mastery_score: number;
    status: string;
    attempt_count: number;
    correct_count: number;
  }>;

  const esc = (val: string | number) => {
    const s = String(val);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [
    'Student Name,Email,Concept,Mastery Score (%),Status,Attempts,Correct',
    ...rows.map((r) =>
      [
        esc(r.student_name),
        esc(r.email),
        esc(r.concept_name),
        Math.round(r.mastery_score),
        esc(r.status),
        r.attempt_count,
        r.correct_count,
      ].join(',')
    ),
  ];

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="adaptix-class10-electricity-report.csv"');
  res.send(lines.join('\n'));
});
