import { NextFunction, Response } from 'express';
import { db } from '../db/database';
import {
  AuthenticatedRequest,
  extractTokenFromRequest,
  verifySessionToken,
} from '../utils/auth';
import { UserRole } from '../../shared/types';

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const { token } = extractTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }

  const user = db
    .prepare(
      `SELECT id, name, email, role, class_id, grade_level, streak_days
       FROM users WHERE id = ?`
    )
    .get(payload.userId) as
    | {
        id: number;
        name: string;
        email: string;
        role: UserRole;
        class_id: number | null;
        grade_level: string;
        streak_days: number;
      }
    | undefined;

  if (!user) {
    res.status(401).json({ error: 'Account not found.' });
    return;
  }

  req.authUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    classId: user.class_id,
    gradeLevel: user.grade_level,
    streakDays: user.streak_days,
  };

  next();
}

export function requireRole(role: UserRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (req.authUser.role !== role) {
      res.status(403).json({ error: `Access denied. ${role} privileges are required.` });
      return;
    }
    next();
  };
}
