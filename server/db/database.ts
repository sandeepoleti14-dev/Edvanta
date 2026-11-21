import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { ELECTRICITY_CONCEPTS, SEED_QUESTIONS } from '../curriculum/electricity';
import { hashPassword } from '../utils/auth';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'adaptix.db');
export const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      grade_level TEXT NOT NULL,
      teacher_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'teacher')),
      class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
      grade_level TEXT NOT NULL DEFAULT 'Class 10',
      streak_days INTEGER NOT NULL DEFAULT 1,
      last_active_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS concepts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      key_formula TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      graph_x INTEGER NOT NULL,
      graph_y INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS concept_prerequisites (
      concept_id INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
      prerequisite_id INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
      PRIMARY KEY (concept_id, prerequisite_id)
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      concept_id INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
      difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
      question_text TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_index INTEGER NOT NULL CHECK(correct_index >= 0 AND correct_index <= 3),
      explanation TEXT NOT NULL,
      expected_reasoning TEXT NOT NULL,
      misconception_indicators_json TEXT NOT NULL,
      is_diagnostic INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT 'seeded',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS assessment_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      attempt_type TEXT NOT NULL CHECK(attempt_type IN ('diagnostic', 'practice', 'revision')),
      total_questions INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS student_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      concept_id INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
      selected_index INTEGER NOT NULL,
      is_correct INTEGER NOT NULL,
      student_reasoning TEXT NOT NULL DEFAULT '',
      mastery_before REAL NOT NULL,
      mastery_after REAL NOT NULL,
      reasoning_quality TEXT NOT NULL DEFAULT 'insufficient',
      misconception_title TEXT,
      corrective_explanation TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS learner_mastery (
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      concept_id INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
      mastery_score REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'not_started' CHECK(status IN ('not_started', 'weak', 'developing', 'mastered')),
      attempt_count INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      last_practiced_at TEXT,
      PRIMARY KEY (student_id, concept_id)
    );

    CREATE TABLE IF NOT EXISTS misconceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      concept_id INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      student_reasoning TEXT NOT NULL,
      misconception_title TEXT NOT NULL,
      conceptual_error TEXT NOT NULL,
      corrective_explanation TEXT NOT NULL,
      confidence_status TEXT NOT NULL CHECK(confidence_status IN ('identified', 'uncertain', 'none')),
      resolved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS revision_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      concept_id INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
      scheduled_for TEXT NOT NULL,
      interval_days INTEGER NOT NULL DEFAULT 1,
      repetition_count INTEGER NOT NULL DEFAULT 0,
      reason TEXT NOT NULL,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS student_achievements (
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      badge_id TEXT NOT NULL,
      unlocked_at TEXT NOT NULL,
      PRIMARY KEY (student_id, badge_id)
    );

    CREATE TABLE IF NOT EXISTS student_module_progress (
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      concept_id INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
      completed INTEGER NOT NULL DEFAULT 0,
      quick_check_correct INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      PRIMARY KEY (student_id, concept_id)
    );

    CREATE TABLE IF NOT EXISTS student_flashcard_progress (
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      card_id TEXT NOT NULL,
      confidence TEXT NOT NULL CHECK(confidence IN ('new', 'review', 'known')) DEFAULT 'new',
      review_count INTEGER NOT NULL DEFAULT 0,
      last_reviewed_at TEXT,
      PRIMARY KEY (student_id, card_id)
    );

    CREATE TABLE IF NOT EXISTS student_saved_notes (
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      concept_id INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
      saved_at TEXT NOT NULL,
      PRIMARY KEY (student_id, concept_id)
    );

    CREATE TABLE IF NOT EXISTS mock_exam_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      total_questions INTEGER NOT NULL,
      correct_count INTEGER NOT NULL,
      score_percent INTEGER NOT NULL,
      duration_used_seconds INTEGER NOT NULL,
      readiness_tier TEXT NOT NULL,
      result_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Safe migration for existing databases: add last_activity_date & longest_streak_days on users if missing
  const userColumns = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>;
  if (!userColumns.some((col) => col.name === 'last_activity_date')) {
    db.exec('ALTER TABLE users ADD COLUMN last_activity_date TEXT;');
    db.exec(
      "UPDATE users SET last_activity_date = substr(last_active_at, 1, 10) WHERE last_active_at IS NOT NULL AND last_activity_date IS NULL;"
    );
  }
  if (!userColumns.some((col) => col.name === 'longest_streak_days')) {
    db.exec('ALTER TABLE users ADD COLUMN longest_streak_days INTEGER NOT NULL DEFAULT 1;');
    db.exec(
      'UPDATE users SET longest_streak_days = CASE WHEN streak_days > 1 THEN streak_days ELSE 1 END;'
    );
  }

  seedInitialData();
  backfillStudentEngagementData();
}

function seedInitialData(): void {
  const existingConcepts = db.prepare('SELECT COUNT(*) as cnt FROM concepts').get() as { cnt: number };
  if (existingConcepts.cnt === 0) {
    const insertConcept = db.prepare(`
      INSERT INTO concepts (slug, name, description, key_formula, order_index, graph_x, graph_y)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const slugToId = new Map<string, number>();

    for (const c of ELECTRICITY_CONCEPTS) {
      const info = insertConcept.run(c.slug, c.name, c.description, c.keyFormula, c.orderIndex, c.graphX, c.graphY);
      slugToId.set(c.slug, Number(info.lastInsertRowid));
    }

    const insertPrereq = db.prepare(`
      INSERT OR IGNORE INTO concept_prerequisites (concept_id, prerequisite_id) VALUES (?, ?)
    `);
    for (const c of ELECTRICITY_CONCEPTS) {
      const cid = slugToId.get(c.slug)!;
      for (const pSlug of c.prerequisiteSlugs) {
        const pid = slugToId.get(pSlug);
        if (pid) insertPrereq.run(cid, pid);
      }
    }

    const insertQuestion = db.prepare(`
      INSERT INTO questions (
        concept_id, difficulty, question_text, options_json, correct_index,
        explanation, expected_reasoning, misconception_indicators_json, is_diagnostic, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'seeded')
    `);

    for (const q of SEED_QUESTIONS) {
      const cid = slugToId.get(q.conceptSlug);
      if (!cid) continue;
      insertQuestion.run(
        cid,
        q.difficulty,
        q.questionText,
        JSON.stringify(q.options),
        q.correctIndex,
        q.explanation,
        q.expectedReasoning,
        JSON.stringify(q.misconceptionIndicators),
        q.isDiagnostic ? 1 : 0
      );
    }
  }

  const existingUsers = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  if (existingUsers.cnt > 0) {
    return;
  }

  // Create Class 10 Physics Cohort
  const classInfo = db
    .prepare(`INSERT INTO classes (name, subject, grade_level) VALUES (?, ?, ?)`)
    .run('Class 10 Physics — Section A', 'Physics: Electricity', 'Class 10');
  const classId = Number(classInfo.lastInsertRowid);

  // Seed Teacher Account
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, class_id, grade_level, streak_days, last_active_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const nowIso = new Date().toISOString();
  const teacherInfo = insertUser.run(
    'Dr. Elena Vance',
    'teacher@adaptix.edu',
    hashPassword('AdaptixTeach2026!'),
    'teacher',
    classId,
    'Faculty',
    12,
    nowIso
  );
  const teacherId = Number(teacherInfo.lastInsertRowid);
  db.prepare(`UPDATE classes SET teacher_id = ? WHERE id = ?`).run(teacherId, classId);

  // Seed Demo Student + 4 Classmates for realistic classroom analytics
  const demoStudents = [
    {
      name: 'Aarav Sharma',
      email: 'student@adaptix.edu',
      streak: 5,
      masteries: {
        'electric-current': { score: 84, attempts: 3, correct: 3, status: 'mastered' },
        'potential-difference': { score: 74, attempts: 2, correct: 2, status: 'developing' },
        'ohms-law': { score: 38, attempts: 2, correct: 0, status: 'weak' },
        resistance: { score: 62, attempts: 2, correct: 1, status: 'developing' },
        'series-circuits': { score: 34, attempts: 2, correct: 0, status: 'weak' },
        'parallel-circuits': { score: 46, attempts: 2, correct: 1, status: 'weak' },
        'electric-power': { score: 78, attempts: 2, correct: 2, status: 'mastered' },
        'electrical-energy': { score: 56, attempts: 1, correct: 1, status: 'developing' },
      },
    },
    {
      name: 'Maya Patel',
      email: 'maya.patel@adaptix.edu',
      streak: 8,
      masteries: {
        'electric-current': { score: 91, attempts: 4, correct: 4, status: 'mastered' },
        'potential-difference': { score: 86, attempts: 3, correct: 3, status: 'mastered' },
        'ohms-law': { score: 76, attempts: 3, correct: 2, status: 'mastered' },
        resistance: { score: 68, attempts: 2, correct: 1, status: 'developing' },
        'series-circuits': { score: 42, attempts: 3, correct: 1, status: 'weak' },
        'parallel-circuits': { score: 39, attempts: 2, correct: 0, status: 'weak' },
        'electric-power': { score: 72, attempts: 2, correct: 2, status: 'developing' },
        'electrical-energy': { score: 80, attempts: 2, correct: 2, status: 'mastered' },
      },
    },
    {
      name: 'Liam Chen',
      email: 'liam.chen@adaptix.edu',
      streak: 3,
      masteries: {
        'electric-current': { score: 78, attempts: 2, correct: 2, status: 'mastered' },
        'potential-difference': { score: 66, attempts: 2, correct: 1, status: 'developing' },
        'ohms-law': { score: 32, attempts: 3, correct: 0, status: 'weak' },
        resistance: { score: 44, attempts: 2, correct: 1, status: 'weak' },
        'series-circuits': { score: 36, attempts: 2, correct: 0, status: 'weak' },
        'parallel-circuits': { score: 28, attempts: 2, correct: 0, status: 'weak' },
        'electric-power': { score: 52, attempts: 2, correct: 1, status: 'developing' },
        'electrical-energy': { score: 48, attempts: 1, correct: 0, status: 'weak' },
      },
    },
    {
      name: 'Sofia Rodriguez',
      email: 'sofia.r@adaptix.edu',
      streak: 6,
      masteries: {
        'electric-current': { score: 88, attempts: 3, correct: 3, status: 'mastered' },
        'potential-difference': { score: 82, attempts: 2, correct: 2, status: 'mastered' },
        'ohms-law': { score: 54, attempts: 3, correct: 2, status: 'developing' },
        resistance: { score: 77, attempts: 3, correct: 2, status: 'mastered' },
        'series-circuits': { score: 65, attempts: 2, correct: 1, status: 'developing' },
        'parallel-circuits': { score: 44, attempts: 3, correct: 1, status: 'weak' },
        'electric-power': { score: 81, attempts: 2, correct: 2, status: 'mastered' },
        'electrical-energy': { score: 74, attempts: 2, correct: 2, status: 'developing' },
      },
    },
    {
      name: 'Neha Kapoor',
      email: 'neha.k@adaptix.edu',
      streak: 4,
      masteries: {
        'electric-current': { score: 72, attempts: 2, correct: 2, status: 'developing' },
        'potential-difference': { score: 64, attempts: 2, correct: 1, status: 'developing' },
        'ohms-law': { score: 41, attempts: 2, correct: 1, status: 'weak' },
        resistance: { score: 58, attempts: 2, correct: 1, status: 'developing' },
        'series-circuits': { score: 45, attempts: 2, correct: 1, status: 'weak' },
        'parallel-circuits': { score: 35, attempts: 2, correct: 0, status: 'weak' },
        'electric-power': { score: 63, attempts: 2, correct: 1, status: 'developing' },
        'electrical-energy': { score: 59, attempts: 2, correct: 1, status: 'developing' },
      },
    },
  ];

  const concepts = db.prepare('SELECT id, slug FROM concepts').all() as Array<{ id: number; slug: string }>;
  const slugToConceptId = new Map(concepts.map((c) => [c.slug, c.id]));

  const questionsByConcept = new Map<number, { id: number; correctIndex: number; text: string }>();
  const allQs = db.prepare('SELECT id, concept_id, correct_index, question_text FROM questions WHERE is_diagnostic = 1').all() as Array<{
    id: number;
    concept_id: number;
    correct_index: number;
    question_text: string;
  }>;
  for (const q of allQs) {
    questionsByConcept.set(q.concept_id, { id: q.id, correctIndex: q.correct_index, text: q.question_text });
  }

  const insertMastery = db.prepare(`
    INSERT INTO learner_mastery (student_id, concept_id, mastery_score, status, attempt_count, correct_count, last_practiced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertAttempt = db.prepare(`
    INSERT INTO assessment_attempts (student_id, attempt_type, total_questions, correct_count, started_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertAnswer = db.prepare(`
    INSERT INTO student_answers (
      attempt_id, student_id, question_id, concept_id, selected_index, is_correct,
      student_reasoning, mastery_before, mastery_after, reasoning_quality,
      misconception_title, corrective_explanation, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMisconception = db.prepare(`
    INSERT INTO misconceptions (
      student_id, concept_id, question_id, student_reasoning, misconception_title,
      conceptual_error, corrective_explanation, confidence_status, resolved, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'identified', 0, ?)
  `);
  const insertRevision = db.prepare(`
    INSERT INTO revision_schedules (
      student_id, concept_id, scheduled_for, interval_days, repetition_count, reason, completed_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  demoStudents.forEach((student, idx) => {
    const daysAgoIso = new Date(now - (idx % 3) * 12 * 60 * 60 * 1000).toISOString();
    const uInfo = insertUser.run(
      student.name,
      student.email,
      hashPassword('AdaptixLearn2026!'),
      'student',
      classId,
      'Class 10',
      student.streak,
      daysAgoIso
    );
    const studentId = Number(uInfo.lastInsertRowid);

    const diagAttempt = insertAttempt.run(
      studentId,
      'diagnostic',
      8,
      Object.values(student.masteries).filter((m) => m.correct > 0).length,
      new Date(now - 3 * oneDay).toISOString(),
      new Date(now - 3 * oneDay + 8 * 60 * 1000).toISOString()
    );
    const diagAttemptId = Number(diagAttempt.lastInsertRowid);

    for (const [slug, m] of Object.entries(student.masteries)) {
      const cid = slugToConceptId.get(slug)!;
      insertMastery.run(studentId, cid, m.score, m.status, m.attempts, m.correct, daysAgoIso);

      const q = questionsByConcept.get(cid);
      if (q) {
        const isCorrect = m.score >= 55 ? 1 : 0;
        const selectedIdx = isCorrect ? q.correctIndex : (q.correctIndex + 1) % 4;
        const reasoning =
          slug === 'ohms-law' && !isCorrect
            ? 'Current increases because resistance increases when connected to the battery.'
            : slug === 'series-circuits' && !isCorrect
            ? 'Voltage splits equally and current gets used up across the first resistor.'
            : slug === 'parallel-circuits' && !isCorrect
            ? 'Added 6 and 3 directly or forgot to flip the fraction after 1/R.'
            : isCorrect
            ? 'Applied the fundamental relationship and checked units carefully.'
            : 'Estimated from the numbers given in the prompt.';

        const misconceptionTitle =
          slug === 'ohms-law' && !isCorrect
            ? 'Misunderstands inverse relationship between current and resistance'
            : slug === 'series-circuits' && !isCorrect
            ? 'Confuses current sharing and voltage division in series circuits'
            : slug === 'parallel-circuits' && !isCorrect
            ? 'Applies series addition or omits reciprocal in parallel resistance'
            : null;

        const corrective =
          slug === 'ohms-law' && !isCorrect
            ? "According to Ohm's law (I = V / R), current decreases when resistance increases at constant voltage."
            : slug === 'series-circuits' && !isCorrect
            ? 'In a series loop, identical current flows through all resistors while voltage divides proportionally to resistance.'
            : slug === 'parallel-circuits' && !isCorrect
            ? 'For parallel resistors, sum reciprocals (1/R_eq = 1/R₁ + 1/R₂) and invert the result.'
            : null;

        insertAnswer.run(
          diagAttemptId,
          studentId,
          q.id,
          cid,
          selectedIdx,
          isCorrect,
          reasoning,
          0,
          m.score,
          isCorrect ? 'aligned' : 'flawed',
          misconceptionTitle,
          corrective,
          new Date(now - (2 - (idx % 2)) * oneDay).toISOString()
        );

        if (misconceptionTitle && corrective) {
          insertMisconception.run(
            studentId,
            cid,
            q.id,
            reasoning,
            misconceptionTitle,
            'Student reasoning contradicts circuit conservation or proportionality laws.',
            corrective,
            new Date(now - 2 * oneDay).toISOString()
          );
        }
      }

      // Seed spaced repetition schedule per concept
      if (m.status === 'weak') {
        insertRevision.run(
          studentId,
          cid,
          new Date(now - 2 * 60 * 60 * 1000).toISOString(),
          1,
          0,
          'Priority revision due: concept mastery is below 50%.',
          null,
          new Date(now - oneDay).toISOString()
        );
      } else if (m.status === 'developing') {
        insertRevision.run(
          studentId,
          cid,
          new Date(now + 2 * oneDay).toISOString(),
          3,
          1,
          'Scheduled reinforcement check for developing concept.',
          null,
          new Date(now - oneDay).toISOString()
        );
      } else if (m.status === 'mastered') {
        insertRevision.run(
          studentId,
          cid,
          new Date(now + 7 * oneDay).toISOString(),
          7,
          2,
          'Long-term retention check for mastered concept.',
          null,
          new Date(now - 2 * oneDay).toISOString()
        );
      }
    }
  });
}

export function initializeStudentMasteryRows(studentId: number): void {
  const concepts = db.prepare('SELECT id FROM concepts').all() as Array<{ id: number }>;
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO learner_mastery (student_id, concept_id, mastery_score, status, attempt_count, correct_count)
    VALUES (?, ?, 0, 'not_started', 0, 0)
  `);
  for (const c of concepts) {
    stmt.run(studentId, c.id);
  }
}

function backfillStudentEngagementData(): void {
  const students = db
    .prepare(`SELECT id, email, streak_days, last_active_at, last_activity_date FROM users WHERE role = 'student'`)
    .all() as Array<{
    id: number;
    email: string;
    streak_days: number;
    last_active_at: string | null;
    last_activity_date: string | null;
  }>;

  const insertAch = db.prepare(`
    INSERT OR IGNORE INTO student_achievements (student_id, badge_id, unlocked_at)
    VALUES (?, ?, ?)
  `);
  const insertMod = db.prepare(`
    INSERT OR IGNORE INTO student_module_progress (student_id, concept_id, completed, quick_check_correct, completed_at)
    VALUES (?, ?, 1, 1, ?)
  `);

  const nowIso = new Date().toISOString();
  const todayKey = nowIso.slice(0, 10);

  for (const s of students) {
    // Ensure demo students retain their seeded streak cleanly on first engagement
    if (!s.last_activity_date && s.last_active_at) {
      db.prepare(`UPDATE users SET last_activity_date = ? WHERE id = ?`).run(todayKey, s.id);
    }

    const existingAch = db
      .prepare(`SELECT COUNT(*) as cnt FROM student_achievements WHERE student_id = ?`)
      .get(s.id) as { cnt: number };

    if (existingAch.cnt === 0) {
      const diagRow = db
        .prepare(
          `SELECT COUNT(*) as cnt FROM assessment_attempts WHERE student_id = ? AND attempt_type = 'diagnostic' AND completed_at IS NOT NULL`
        )
        .get(s.id) as { cnt: number };
      const masteredCount = (
        db
          .prepare(`SELECT COUNT(*) as cnt FROM learner_mastery WHERE student_id = ? AND status = 'mastered'`)
          .get(s.id) as { cnt: number }
      ).cnt;

      const stamp = s.last_active_at ?? nowIso;
      if (diagRow.cnt > 0) insertAch.run(s.id, 'first_diagnostic', stamp);
      if (s.streak_days >= 3) insertAch.run(s.id, 'streak_3', stamp);
      if (s.streak_days >= 5) insertAch.run(s.id, 'streak_5', stamp);
      if (s.streak_days >= 7) insertAch.run(s.id, 'streak_7', stamp);
      if (masteredCount >= 1) insertAch.run(s.id, 'first_mastery', stamp);
    }

    // Seed 2 completed starter modules for the demo student Aarav Sharma so his modules progress isn't empty on first visit
    if (s.email === 'student@adaptix.edu') {
      const existingMods = db
        .prepare(`SELECT COUNT(*) as cnt FROM student_module_progress WHERE student_id = ?`)
        .get(s.id) as { cnt: number };
      if (existingMods.cnt === 0) {
        const starterConcepts = db
          .prepare(`SELECT id FROM concepts WHERE slug IN ('electric-current', 'potential-difference')`)
          .all() as Array<{ id: number }>;
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
        for (const c of starterConcepts) {
          insertMod.run(s.id, c.id, twoDaysAgo);
        }
      }

      const existingFlashcards = db
        .prepare(`SELECT COUNT(*) as cnt FROM student_flashcard_progress WHERE student_id = ?`)
        .get(s.id) as { cnt: number };
      if (existingFlashcards.cnt === 0) {
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
        const insertFc = db.prepare(`
          INSERT OR IGNORE INTO student_flashcard_progress (student_id, card_id, confidence, review_count, last_reviewed_at)
          VALUES (?, ?, ?, 1, ?)
        `);
        insertFc.run(s.id, 'fc-current-1', 'known', twoDaysAgo);
        insertFc.run(s.id, 'fc-current-2', 'known', twoDaysAgo);
        insertFc.run(s.id, 'fc-ohms-2', 'review', twoDaysAgo);
      }

      const existingNotes = db
        .prepare(`SELECT COUNT(*) as cnt FROM student_saved_notes WHERE student_id = ?`)
        .get(s.id) as { cnt: number };
      if (existingNotes.cnt === 0) {
        const starterConcept = db
          .prepare(`SELECT id FROM concepts WHERE slug = 'electric-current' LIMIT 1`)
          .get() as { id: number } | undefined;
        if (starterConcept) {
          db.prepare(`INSERT OR IGNORE INTO student_saved_notes (student_id, concept_id, saved_at) VALUES (?, ?, ?)`)
            .run(s.id, starterConcept.id, nowIso);
        }
      }
    }
  }
}

