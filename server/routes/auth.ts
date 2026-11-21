import { Router, Request, Response } from 'express';
import { db, initializeStudentMasteryRows } from '../db/database';
import {
  clearSessionCookie,
  extractTokenFromRequest,
  hashPassword,
  setSessionCookie,
  signSessionToken,
  verifyPassword,
  verifySessionToken,
} from '../utils/auth';
import { AuthUser, UserRole } from '../../shared/types';

export const authRouter = Router();

function toAuthUser(row: {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  class_id: number | null;
  class_name?: string | null;
  grade_level: string;
  streak_days: number;
}): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    classId: row.class_id,
    className: row.class_name ?? 'Java DSA — Section A',
    gradeLevel: row.grade_level,
    streakDays: row.streak_days,
  };
}

authRouter.post('/register', (req: Request, res: Response) => {
  const { name, email, password, role, gradeLevel } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    gradeLevel?: string;
  };

  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const cleanPassword = typeof password === 'string' ? password : '';
  const cleanRole: UserRole = role === 'teacher' ? 'teacher' : 'student';
  const cleanGrade = typeof gradeLevel === 'string' && gradeLevel.trim() ? gradeLevel.trim() : 'Java DSA';

  if (cleanName.length < 2 || cleanName.length > 80) {
    res.status(400).json({ error: 'Please enter a valid full name (2–80 characters).' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  if (cleanPassword.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail) as { id: number } | undefined;
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const defaultClass = db.prepare('SELECT id, name FROM classes LIMIT 1').get() as { id: number; name: string } | undefined;
  const classId = defaultClass ? defaultClass.id : null;

  const passwordHash = hashPassword(cleanPassword);
  const nowIso = new Date().toISOString();
  const info = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, role, class_id, grade_level, streak_days, last_active_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`
    )
    .run(cleanName, cleanEmail, passwordHash, cleanRole, classId, cleanGrade, nowIso);

  const userId = Number(info.lastInsertRowid);
  if (cleanRole === 'student') {
    initializeStudentMasteryRows(userId);
  }

  const token = signSessionToken(userId, cleanRole);
  setSessionCookie(res, token);

  res.status(201).json({
    token,
    user: toAuthUser({
      id: userId,
      name: cleanName,
      email: cleanEmail,
      role: cleanRole,
      class_id: classId,
      class_name: defaultClass?.name ?? 'Java DSA — Section A',
      grade_level: cleanGrade,
      streak_days: 1,
    }),
  });
});

authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const cleanPassword = typeof password === 'string' ? password : '';

  if (!cleanEmail || !cleanPassword) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const user = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.password_hash, u.role, u.class_id, c.name as class_name, u.grade_level, u.streak_days
       FROM users u
       LEFT JOIN classes c ON c.id = u.class_id
       WHERE u.email = ?`
    )
    .get(cleanEmail) as
    | {
        id: number;
        name: string;
        email: string;
        password_hash: string;
        role: UserRole;
        class_id: number | null;
        class_name: string | null;
        grade_level: string;
        streak_days: number;
      }
    | undefined;

  if (!user || !verifyPassword(cleanPassword, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  db.prepare(`UPDATE users SET last_active_at = ? WHERE id = ?`).run(new Date().toISOString(), user.id);

  const token = signSessionToken(user.id, user.role);
  setSessionCookie(res, token);

  res.json({
    token,
    user: toAuthUser(user),
  });
});

authRouter.post('/demo-login', (req: Request, res: Response) => {
  const { role } = req.body as { role?: string };
  const targetEmail = role === 'teacher' ? 'teacher@adaptix.edu' : 'student@adaptix.edu';

  const user = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.class_id, c.name as class_name, u.grade_level, u.streak_days
       FROM users u
       LEFT JOIN classes c ON c.id = u.class_id
       WHERE u.email = ?`
    )
    .get(targetEmail) as
    | {
        id: number;
        name: string;
        email: string;
        role: UserRole;
        class_id: number | null;
        class_name: string | null;
        grade_level: string;
        streak_days: number;
      }
    | undefined;

  if (!user) {
    res.status(404).json({ error: 'Demo account is not initialized.' });
    return;
  }

  db.prepare(`UPDATE users SET last_active_at = ? WHERE id = ?`).run(new Date().toISOString(), user.id);

  const token = signSessionToken(user.id, user.role);
  setSessionCookie(res, token);

  res.json({
    token,
    user: toAuthUser(user),
  });
});

authRouter.post('/logout', (_req: Request, res: Response) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

authRouter.get('/me', (req: Request, res: Response) => {
  const { token } = extractTokenFromRequest(req);
  if (!token) {
    res.json({ user: null });
    return;
  }
  const payload = verifySessionToken(token);
  if (!payload) {
    res.json({ user: null });
    return;
  }

  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.class_id, c.name as class_name, u.grade_level, u.streak_days
       FROM users u
       LEFT JOIN classes c ON c.id = u.class_id
       WHERE u.id = ?`
    )
    .get(payload.userId) as
    | {
        id: number;
        name: string;
        email: string;
        role: UserRole;
        class_id: number | null;
        class_name: string | null;
        grade_level: string;
        streak_days: number;
      }
    | undefined;

  if (!row) {
    res.json({ user: null });
    return;
  }

  res.json({ user: toAuthUser(row) });
});
