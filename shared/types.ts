export type UserRole = 'student' | 'teacher';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type MasteryStatus = 'not_started' | 'weak' | 'developing' | 'mastered';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  classId: number | null;
  className?: string;
  gradeLevel?: string;
  streakDays: number;
}

export interface ConceptNode {
  id: number;
  slug: string;
  name: string;
  description: string;
  keyFormula: string;
  orderIndex: number;
  graphX: number;
  graphY: number;
  prerequisites: number[];
}

export interface LearnerConceptMastery extends ConceptNode {
  masteryScore: number;
  status: MasteryStatus;
  attemptCount: number;
  correctCount: number;
  lastPracticedAt: string | null;
}

export interface QuestionItem {
  id: number;
  conceptId: number;
  conceptSlug: string;
  conceptName: string;
  difficulty: Difficulty;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  expectedReasoning: string;
  misconceptionIndicators: string[];
  isDiagnostic: boolean;
  source: 'seeded' | 'gemini' | 'fallback';
}

export interface MisconceptionRecord {
  id: number;
  studentId: number;
  studentName?: string;
  conceptId: number;
  conceptName: string;
  questionId: number;
  questionText?: string;
  studentReasoning: string;
  misconceptionTitle: string;
  conceptualError: string;
  correctiveExplanation: string;
  confidenceStatus: 'identified' | 'uncertain' | 'none';
  resolved: boolean;
  createdAt: string;
}

export interface RevisionTask {
  id: number;
  studentId: number;
  conceptId: number;
  conceptName: string;
  conceptSlug: string;
  masteryScore: number;
  status: 'due' | 'upcoming' | 'completed';
  scheduledFor: string;
  intervalDays: number;
  repetitionCount: number;
  reason: string;
  completedAt: string | null;
}

export interface AttemptHistoryItem {
  id: number;
  questionId: number;
  questionText: string;
  conceptId: number;
  conceptName: string;
  difficulty: Difficulty;
  selectedIndex: number;
  correctIndex: number;
  options: string[];
  isCorrect: boolean;
  studentReasoning: string;
  masteryBefore: number;
  masteryAfter: number;
  misconceptionTitle: string | null;
  correctiveExplanation: string | null;
  createdAt: string;
}

export interface StudentDashboardPayload {
  user: AuthUser;
  hasCompletedDiagnostic: boolean;
  overallMastery: number;
  totalAttempted: number;
  accuracyRate: number;
  strongestConcepts: LearnerConceptMastery[];
  weakestConcepts: LearnerConceptMastery[];
  conceptMasteries: LearnerConceptMastery[];
  upcomingRevisions: RevisionTask[];
  recentMisconceptions: MisconceptionRecord[];
  recentAttempts: AttemptHistoryItem[];
  recommendedActivity: {
    type: 'diagnostic' | 'revision' | 'practice';
    title: string;
    description: string;
    conceptId?: number;
    conceptName?: string;
    targetPath: string;
  };
  progressHistory: Array<{
    date: string;
    accuracy: number;
    avgMastery: number;
    attempts: number;
  }>;
}

export interface AnswerEvaluationResult {
  attemptId: number;
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
  expectedReasoning: string;
  masteryBefore: number;
  masteryAfter: number;
  newStatus: MasteryStatus;
  analysis: {
    source: 'gemini' | 'fallback' | 'rule';
    confidenceStatus: 'identified' | 'uncertain' | 'none';
    misconceptionDetected: boolean;
    misconceptionTitle: string | null;
    conceptualError: string | null;
    correctiveExplanation: string;
    reasoningQuality: 'aligned' | 'partial' | 'flawed' | 'insufficient';
    recommendedFocus: string;
  };
  scheduledRevision: RevisionTask;
  recommendedNextConcept: {
    conceptId: number;
    conceptName: string;
    reason: string;
  };
  newlyUnlockedBadges?: AchievementBadge[];
  streakDays?: number;
}

export interface DiagnosticSubmitResult {
  attemptId: number;
  totalQuestions: number;
  correctCount: number;
  accuracyRate: number;
  overallMastery: number;
  conceptResults: Array<{
    conceptId: number;
    conceptName: string;
    isCorrect: boolean;
    masteryScore: number;
    status: MasteryStatus;
    misconceptionTitle: string | null;
  }>;
  weakestConcepts: LearnerConceptMastery[];
  strongestConcepts: LearnerConceptMastery[];
  newlyUnlockedBadges?: AchievementBadge[];
  streakDays?: number;
}

export interface TeacherOverviewPayload {
  className: string;
  totalStudents: number;
  averageClassMastery: number;
  averageAccuracy: number;
  totalAttemptsLogged: number;
  difficultConcepts: Array<{
    conceptId: number;
    conceptName: string;
    averageMastery: number;
    accuracyRate: number;
    weakStudentCount: number;
  }>;
  commonMisconceptions: Array<{
    misconceptionTitle: string;
    conceptName: string;
    occurrences: number;
    exampleReasoning: string;
    correctiveExplanation: string;
  }>;
  conceptPerformance: Array<{
    conceptId: number;
    conceptName: string;
    averageMastery: number;
    masteredCount: number;
    developingCount: number;
    weakCount: number;
    notStartedCount: number;
  }>;
  students: Array<{
    id: number;
    name: string;
    email: string;
    overallMastery: number;
    accuracyRate: number;
    totalAttempted: number;
    misconceptionCount: number;
    weakestConcept: string | null;
    lastActiveAt: string | null;
  }>;
  recentTrend: Array<{
    label: string;
    classMastery: number;
    accuracy: number;
  }>;
}

export interface TeacherStudentDetailPayload {
  student: AuthUser;
  overallMastery: number;
  accuracyRate: number;
  totalAttempted: number;
  conceptMasteries: LearnerConceptMastery[];
  misconceptions: MisconceptionRecord[];
  recentAttempts: AttemptHistoryItem[];
  revisions: RevisionTask[];
}

export type AchievementCategory = 'streak' | 'mastery' | 'consistency' | 'curriculum';

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  xpReward: number;
  target: number;
  progress: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface AchievementsPayload {
  streakDays: number;
  totalXp: number;
  unlockedCount: number;
  totalCount: number;
  badges: AchievementBadge[];
}

export interface LearningModuleItem {
  conceptId: number;
  conceptSlug: string;
  orderIndex: number;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  keyFormula: string;
  unitsNote: string;
  objectives: string[];
  coreExplanation: string;
  workedExample: {
    problem: string;
    steps: string[];
    answer: string;
  };
  misconceptionWatch: string;
  simulatorType: 'current' | 'voltage' | 'ohms' | 'resistance' | 'series' | 'parallel' | 'power' | 'energy';
  quickCheck: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  completed: boolean;
  completedAt: string | null;
  masteryScore: number;
  masteryStatus: MasteryStatus;
}

export type CompanionMood = 'idle' | 'thinking' | 'celebrating' | 'encouraging';

export interface CompanionAction {
  label: string;
  type: 'navigate' | 'prompt';
  targetPath?: string;
  promptText?: string;
}

export interface CompanionChatMessage {
  id: string;
  sender: 'user' | 'companion';
  text: string;
  timestamp: string;
  source?: 'gemini' | 'fallback';
  mood?: CompanionMood;
  actions?: CompanionAction[];
  suggestedReplies?: string[];
}


