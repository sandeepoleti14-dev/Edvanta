import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Clock,
  Play,
  Sparkles,
  Target,
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { MasteryStatusText } from '../../components/StatusIndicator';
import { SurfaceCard, useChartTheme } from '../../components/ui/ThemePrimitives';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCompanion } from '../../context/CompanionContext';
import {
  MockExamHistoryItem,
  MockExamResultPayload,
  MockExamStartPayload,
} from '../../../shared/types';

type ExamPhase = 'lobby' | 'active' | 'result';

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function MockExamPage() {
  const chartTheme = useChartTheme();
  const { user, updateLocalUser } = useAuth();
  const { showToast } = useToast();
  const { triggerReaction, setActiveConceptName } = useCompanion();

  const [phase, setPhase] = useState<ExamPhase>('lobby');
  const [history, setHistory] = useState<MockExamHistoryItem[]>([]);
  const [exam, setExam] = useState<MockExamStartPayload | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [reasonings, setReasonings] = useState<Record<number, string>>({});
  const [markedReview, setMarkedReview] = useState<Record<number, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(900);
  const [result, setResult] = useState<MockExamResultPayload | null>(null);

  const [loadingLobby, setLoadingLobby] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoSubmittedRef = useRef(false);

  const loadHistory = useCallback(async () => {
    try {
      const res = await apiFetch<{
        history: MockExamHistoryItem[];
        latestResult: MockExamResultPayload | null;
      }>('/api/student/mock-exam/history');
      setHistory(res.history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load mock exam hub.');
    } finally {
      setLoadingLobby(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
    return () => setActiveConceptName(undefined);
  }, [loadHistory, setActiveConceptName]);

  const handleStartExam = async () => {
    setStarting(true);
    setError(null);
    autoSubmittedRef.current = false;
    try {
      const payload = await apiFetch<MockExamStartPayload>('/api/student/mock-exam/start');
      setExam(payload);
      setCurrentIdx(0);
      setAnswers({});
      setReasonings({});
      setMarkedReview({});
      setSecondsLeft(payload.durationSeconds);
      setResult(null);
      setPhase('active');
      triggerReaction('thinking', 'Mock Exam timer started! Stay calm and watch SI units.', 3200);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to start mock exam.', 'error');
    } finally {
      setStarting(false);
    }
  };

  const handleSubmitExam = useCallback(async () => {
    if (!exam || submitting) return;
    setSubmitting(true);
    triggerReaction('thinking');
    const durationUsedSeconds = Math.max(1, exam.durationSeconds - secondsLeft);

    try {
      const payload = await apiFetch<MockExamResultPayload>('/api/student/mock-exam/submit', {
        method: 'POST',
        body: JSON.stringify({
          durationUsedSeconds,
          answers: exam.questions.map((q) => ({
            questionId: q.id,
            selectedIndex: answers[q.id] ?? null,
            reasoning: reasonings[q.id] ?? '',
          })),
        }),
      });

      setResult(payload);
      setPhase('result');
      if (user && typeof payload.streakDays === 'number') {
        updateLocalUser({ ...user, streakDays: payload.streakDays });
      }
      await loadHistory();

      if (payload.newlyUnlockedBadges && payload.newlyUnlockedBadges.length > 0) {
        const names = payload.newlyUnlockedBadges.map((b) => b.title).join(', ');
        showToast(`Badge unlocked: ${names}!`, 'xp');
        triggerReaction('achievement', `Mock score ${payload.scorePercent}% & badge unlocked: ${names}!`, 4800);
      } else if (payload.scorePercent >= 80) {
        triggerReaction(
          'celebrating',
          `Strong ${payload.scorePercent}% mock score! Check your Coach AI roadmap below.`,
          4500
        );
        showToast('Mock exam graded — Coach AI analysis ready', 'success');
      } else {
        triggerReaction(
          'encouraging',
          `Scored ${payload.scorePercent}% — Coach AI pinned your exact focus topics to boost next attempt.`,
          4500
        );
        showToast('Mock exam graded — Coach AI analysis ready', 'success');
      }
    } catch (err) {
      triggerReaction('idle');
      showToast(err instanceof Error ? err.message : 'Unable to submit mock exam.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [exam, submitting, secondsLeft, answers, reasonings, user, updateLocalUser, loadHistory, triggerReaction, showToast]);

  // Live countdown timer during active exam
  useEffect(() => {
    if (phase !== 'active' || !exam) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          if (!autoSubmittedRef.current) {
            autoSubmittedRef.current = true;
            void handleSubmitExam();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, exam, handleSubmitExam]);

  const openPastAttempt = async (attemptId: number) => {
    try {
      const res = await apiFetch<{ result: MockExamResultPayload }>(`/api/student/mock-exam/${attemptId}`);
      setResult(res.result);
      setPhase('result');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to open attempt report.', 'error');
    }
  };

  if (loadingLobby) {
    return (
      <AppShell title="Timed Mock Exams">
        <div className="h-96 rounded-2xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150] animate-pulse" />
      </AppShell>
    );
  }

  if (error && phase === 'lobby') {
    return (
      <AppShell title="Timed Mock Exams">
        <SurfaceCard className="p-6 flex items-center gap-3 text-sm text-[#E5484D] dark:text-[#F87171]">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </SurfaceCard>
      </AppShell>
    );
  }

  // PHASE 1: LOBBY
  if (phase === 'lobby') {
    return (
      <AppShell title="Timed Mock Exams">
        <div className="max-w-5xl mx-auto space-y-6">
          <SurfaceCard className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-semibold text-[#7055F7] dark:text-[#A493FF]">
                Excel Phase · Full-Syllabus Simulation + Coach AI Analysis
              </p>
              <h2 className="font-display text-2xl font-bold text-[#14172B] dark:text-[#F4F6FF]">
                Class 10 Physics — Electricity Mock Exam
              </h2>
              <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9] leading-relaxed">
                Practice under real exam pacing across all 8 Electricity concepts. Includes a live countdown clock,
                question navigation palette, mark-for-review flags, and an instant EDVANTA Coach AI Result Analysis
                that updates your Learner Model.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-[#6E7696] dark:text-[#8892B5]">
                <span>10 Mixed-Difficulty Questions</span>
                <span aria-hidden="true">·</span>
                <span>15:00 Countdown Timer</span>
                <span aria-hidden="true">·</span>
                <span>All 8 Syllabus Topics</span>
              </div>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                disabled={starting}
                onClick={handleStartExam}
                className="inline-flex items-center gap-2 rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-6 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-60 whitespace-nowrap shadow-xs"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                {starting ? 'Preparing Paper...' : 'Start Timed Mock Exam'}
              </button>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                  Past Mock Exam Attempts
                </h3>
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">
                  Reopen any completed attempt to review your Coach AI analysis and solution keys
                </p>
              </div>
              <Link
                to="/student/flashcards"
                className="text-xs font-semibold text-[#7055F7] dark:text-[#A493FF] hover:underline whitespace-nowrap"
              >
                Warm Up with Flashcards
              </Link>
            </div>

            {history.length === 0 ? (
              <div className="rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA]/60 dark:bg-[#212640]/60 p-6 text-center space-y-2">
                <Target className="h-7 w-7 text-[#6E7696] dark:text-[#8892B5] mx-auto" aria-hidden="true" />
                <p className="text-sm font-medium text-[#14172B] dark:text-[#F4F6FF]">
                  No timed mock exams completed yet
                </p>
                <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9]">
                  Start your first 15-minute simulation above to benchmark exam readiness.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#E2E6F3] dark:divide-[#2B3150]">
                {history.map((item) => (
                  <div
                    key={item.attemptId}
                    className="py-3.5 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                        Mock Exam #{item.attemptId} ·{' '}
                        <span className="font-mono tabular-nums">{item.scorePercent}%</span> (
                        {item.correctCount}/{item.totalQuestions})
                      </p>
                      <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">
                        {item.readinessTier} · Time used {formatClock(item.durationUsedSeconds)} ·{' '}
                        {new Date(item.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openPastAttempt(item.attemptId)}
                      className="rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#212640] hover:bg-[#EEF1FA] dark:hover:bg-[#272D4B] px-3.5 py-1.5 text-xs font-medium text-[#14172B] dark:text-[#F4F6FF] transition-colors shrink-0"
                    >
                      View Coach Analysis
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>
        </div>
      </AppShell>
    );
  }

  // PHASE 2: ACTIVE TIMED EXAM
  if (phase === 'active' && exam) {
    const activeQ = exam.questions[currentIdx];
    const answeredCount = exam.questions.filter(
      (q) => typeof answers[q.id] === 'number'
    ).length;
    const markedCount = exam.questions.filter((q) => markedReview[q.id]).length;
    const selectedOpt = answers[activeQ.id] ?? null;
    const isMarked = Boolean(markedReview[activeQ.id]);
    const isLowTime = secondsLeft <= 120;

    return (
      <AppShell title="Timed Mock Exam">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Exam Header Strip */}
          <SurfaceCard className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-[#6E7696] dark:text-[#8892B5]">
                Question <strong className="font-mono tabular-nums text-[#14172B] dark:text-[#F4F6FF]">{currentIdx + 1}</strong> of{' '}
                <strong className="font-mono tabular-nums text-[#14172B] dark:text-[#F4F6FF]">{exam.totalQuestions}</strong> ·{' '}
                {answeredCount} answered · {markedCount} marked
              </p>
              <h2 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF] truncate mt-0.5">
                {exam.examTitle}
              </h2>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-mono font-bold tabular-nums ${
                  isLowTime
                    ? 'border-[#E5484D]/50 bg-[#E5484D]/10 text-[#E5484D] dark:text-[#F87171]'
                    : 'border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA]/70 dark:bg-[#212640] text-[#14172B] dark:text-[#F4F6FF]'
                }`}
                aria-label={`Time remaining ${formatClock(secondsLeft)}`}
              >
                <Clock className="h-4 w-4" aria-hidden="true" />
                {formatClock(secondsLeft)}
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitExam}
                className="rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {submitting ? 'Grading...' : 'Submit Mock Exam'}
              </button>
            </div>
          </SurfaceCard>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Active Question Card */}
            <SurfaceCard className="lg:col-span-8 p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E7696] dark:text-[#8892B5] pb-4 border-b border-[#E2E6F3] dark:border-[#2B3150]">
                <span>
                  Topic: <strong className="text-[#14172B] dark:text-[#F4F6FF]">{activeQ.conceptName}</strong> ·{' '}
                  <span className="capitalize">{activeQ.difficulty}</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setMarkedReview((prev) => ({ ...prev, [activeQ.id]: !prev[activeQ.id] }))
                  }
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                    isMarked
                      ? 'border-[#F6B94A]/50 bg-[#F6B94A]/15 text-[#B46E00] dark:text-[#F6B94A]'
                      : 'border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#212640] text-[#4E5674] dark:text-[#B4BDD9] hover:bg-[#EEF1FA] dark:hover:bg-[#272D4B]'
                  }`}
                >
                  <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                  {isMarked ? 'Marked for Review' : 'Mark for Review'}
                </button>
              </div>

              <h3 className="font-display text-lg font-semibold text-[#14172B] dark:text-[#F4F6FF] leading-snug">
                {activeQ.questionText}
              </h3>

              <div className="space-y-2.5" role="radiogroup" aria-label={`Question ${currentIdx + 1} options`}>
                {activeQ.options.map((opt, idx) => {
                  const isPicked = selectedOpt === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      role="radio"
                      aria-checked={isPicked}
                      onClick={() => setAnswers((prev) => ({ ...prev, [activeQ.id]: idx }))}
                      className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                        isPicked
                          ? 'border-[#7055F7] bg-[#7055F7]/10 text-[#14172B] dark:text-[#F4F6FF] font-medium'
                          : 'border-[#E2E6F3] dark:border-[#2B3150] hover:border-[#7055F7]/40 hover:bg-[#EEF1FA]/60 dark:hover:bg-[#212640] text-[#4E5674] dark:text-[#B4BDD9]'
                      }`}
                    >
                      <span
                        className={`h-5 w-5 rounded-full border flex items-center justify-center text-xs font-mono shrink-0 ${
                          isPicked
                            ? 'border-[#7055F7] bg-[#7055F7] text-white'
                            : 'border-[#CBD3E8] dark:border-[#3C456D] text-[#6E7696] dark:text-[#8892B5]'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              <div>
                <label
                  htmlFor="mock-reasoning"
                  className="block text-xs font-medium text-[#4E5674] dark:text-[#B4BDD9] mb-1.5"
                >
                  Optional quick reasoning note (helps Coach AI detect conceptual traps)
                </label>
                <input
                  id="mock-reasoning"
                  type="text"
                  value={reasonings[activeQ.id] ?? ''}
                  onChange={(e) =>
                    setReasonings((prev) => ({ ...prev, [activeQ.id]: e.target.value }))
                  }
                  placeholder="Optional: e.g. Used V = I × R at constant voltage..."
                  className="w-full rounded-xl border border-[#CBD3E8] dark:border-[#3C456D] bg-white dark:bg-[#111322] px-3.5 py-2 text-sm text-[#14172B] dark:text-[#F4F6FF] placeholder:text-[#6E7696] focus:border-[#7055F7] focus:outline-none focus:ring-2 focus:ring-[#7055F7]/20"
                />
              </div>

              <div className="pt-3 border-t border-[#E2E6F3] dark:border-[#2B3150] flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#212640] hover:bg-[#EEF1FA] dark:hover:bg-[#272D4B] px-4 py-2 text-xs font-medium text-[#14172B] dark:text-[#F4F6FF] disabled:opacity-40 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Previous
                </button>

                {currentIdx < exam.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIdx((i) => Math.min(exam.questions.length - 1, i + 1))}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-4 py-2 text-xs font-semibold text-white transition-colors"
                  >
                    Next Question
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSubmitExam}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#27C991] hover:bg-[#1FB681] px-5 py-2 text-xs font-semibold text-[#0D1A15] transition-colors disabled:opacity-60"
                  >
                    {submitting ? 'Grading Paper...' : 'Finish & View Coach AI Analysis'}
                  </button>
                )}
              </div>
            </SurfaceCard>

            {/* Question Palette */}
            <SurfaceCard className="lg:col-span-4 p-5 space-y-4">
              <div>
                <h4 className="font-display text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                  Question Palette
                </h4>
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">
                  Jump directly to any question
                </p>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {exam.questions.map((q, idx) => {
                  const isCurrent = idx === currentIdx;
                  const isAnswered = typeof answers[q.id] === 'number';
                  const isFlagged = Boolean(markedReview[q.id]);

                  let btnClass =
                    'border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#212640] text-[#4E5674] dark:text-[#B4BDD9] hover:bg-[#EEF1FA] dark:hover:bg-[#272D4B]';
                  if (isFlagged) {
                    btnClass =
                      'border-[#F6B94A]/60 bg-[#F6B94A]/15 text-[#B46E00] dark:text-[#F6B94A] font-semibold';
                  } else if (isAnswered) {
                    btnClass =
                      'border-[#27C991]/60 bg-[#27C991]/15 text-[#15996C] dark:text-[#27C991] font-semibold';
                  }
                  if (isCurrent) {
                    btnClass += ' ring-2 ring-[#7055F7]';
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIdx(idx)}
                      aria-label={`Jump to question ${idx + 1}${isFlagged ? ', marked for review' : isAnswered ? ', answered' : ''}`}
                      className={`h-10 rounded-xl border font-mono text-xs tabular-nums transition-colors ${btnClass}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-[#E2E6F3] dark:border-[#2B3150] space-y-1.5 text-xs text-[#4E5674] dark:text-[#B4BDD9]">
                <p>Green border = Answered ({answeredCount})</p>
                <p>Gold tint = Marked for Review ({markedCount})</p>
                <p>Default = Unanswered ({exam.totalQuestions - answeredCount})</p>
              </div>
            </SurfaceCard>
          </div>
        </div>
      </AppShell>
    );
  }

  // PHASE 3: EDVANTA COACH AI RESULT ANALYSIS
  if (phase === 'result' && result) {
    const chartData = result.conceptBreakdown.map((c) => ({
      name: c.conceptName.replace(' & Resistivity', '').replace(' & Heating', ''),
      accuracy: c.accuracy,
      masteryAfter: c.masteryAfter,
    }));

    return (
      <AppShell title="Mock Exam Coach Analysis">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Score & Coach AI Banner */}
          <SurfaceCard className="p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2E6F3] dark:border-[#2B3150]">
              <div>
                <p className="text-xs font-semibold text-[#7055F7] dark:text-[#A493FF]">
                  EDVANTA Coach AI Result Analysis · {result.coachAnalysis.readinessTier}
                </p>
                <h2 className="font-display text-2xl font-bold text-[#14172B] dark:text-[#F4F6FF] mt-1">
                  {result.coachAnalysis.headline}
                </h2>
                <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9] mt-1.5 max-w-2xl leading-relaxed">
                  {result.coachAnalysis.summary}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setPhase('lobby')}
                  className="rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#212640] hover:bg-[#EEF1FA] dark:hover:bg-[#272D4B] px-4 py-2 text-xs font-medium text-[#14172B] dark:text-[#F4F6FF] transition-colors whitespace-nowrap"
                >
                  All Mock Exams
                </button>
                <button
                  type="button"
                  onClick={handleStartExam}
                  className="rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-4 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap"
                >
                  Retake New Mock
                </button>
              </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA]/60 dark:bg-[#212640]/80 p-4">
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5]">Mock Score</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-[#14172B] dark:text-[#F4F6FF] mt-1">
                  {result.scorePercent}%
                </p>
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">
                  {result.correctCount}/{result.totalQuestions} correct
                </p>
              </div>

              <div className="rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA]/60 dark:bg-[#212640]/80 p-4">
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5]">Time Management</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-[#14172B] dark:text-[#F4F6FF] mt-1">
                  {formatClock(result.durationUsedSeconds)}
                </p>
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">
                  {result.averageSecondsPerQuestion}s avg / question
                </p>
              </div>

              <div className="rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA]/60 dark:bg-[#212640]/80 p-4">
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5]">Updated Overall Mastery</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-[#7055F7] dark:text-[#A493FF] mt-1">
                  {result.overallMasteryAfter}%
                </p>
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">Synced to Learner Model</p>
              </div>

              <div className="rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA]/60 dark:bg-[#212640]/80 p-4">
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5]">Unanswered / Errors</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-[#14172B] dark:text-[#F4F6FF] mt-1">
                  {result.unansweredCount} / {result.incorrectCount}
                </p>
                <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">Blanks / incorrect items</p>
              </div>
            </div>
          </SurfaceCard>

          {/* Coach AI Insights & Roadmap */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <SurfaceCard className="lg:col-span-7 p-6 space-y-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#7055F7] dark:text-[#A493FF]">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>Personalized Coach Roadmap</span>
              </div>

              <div className="space-y-2">
                <h3 className="font-display text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                  3-Step Next Action Plan
                </h3>
                <ol className="space-y-2 text-sm text-[#4E5674] dark:text-[#B4BDD9] list-decimal pl-5">
                  {result.coachAnalysis.roadmapSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="pt-3 border-t border-[#E2E6F3] dark:border-[#2B3150] space-y-2">
                <h4 className="font-display text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                  Strengths &amp; Pacing Note
                </h4>
                <ul className="space-y-1 text-xs sm:text-sm text-[#4E5674] dark:text-[#B4BDD9] list-disc pl-5">
                  {result.coachAnalysis.strengths.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
                <p className="text-xs sm:text-sm text-[#4E5674] dark:text-[#B4BDD9] pt-1">
                  {result.coachAnalysis.timeManagementNote}
                </p>
              </div>
            </SurfaceCard>

            <SurfaceCard className="lg:col-span-5 p-6 space-y-4">
              <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                Priority Focus Topics
              </h3>
              {result.coachAnalysis.priorityFocusConcepts.length === 0 ? (
                <div className="rounded-xl border border-[#27C991]/40 bg-[#27C991]/10 p-4 text-sm text-[#14172B] dark:text-[#F4F6FF] flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#27C991] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Every tested concept scored cleanly. Keep periodic spaced revisions active!</span>
                </div>
              ) : (
                <div className="divide-y divide-[#E2E6F3] dark:divide-[#2B3150]">
                  {result.coachAnalysis.priorityFocusConcepts.map((item) => (
                    <div key={item.conceptId} className="py-3 first:pt-0 last:pb-0 space-y-2">
                      <p className="text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                        {item.conceptName}
                      </p>
                      <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] leading-relaxed">
                        {item.reason}
                      </p>
                      <Link
                        to={item.targetPath}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7055F7] dark:text-[#A493FF] hover:underline"
                      >
                        {item.actionLabel}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </SurfaceCard>
          </section>

          {/* Concept Breakdown Chart + Table */}
          <SurfaceCard className="p-6 space-y-5">
            <div>
              <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                Topic-by-Topic Accuracy &amp; Mastery Shift
              </h3>
              <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-0.5">
                Mock test performance mapped directly onto your persistent Learner Model
              </p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: chartTheme.tickFill }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={46}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: chartTheme.tickFill }} />
                  <Tooltip
                    cursor={{ fill: chartTheme.isDark ? 'rgba(112, 85, 247, 0.14)' : 'rgba(112, 85, 247, 0.08)' }}
                    formatter={(val: unknown) => [`${val}%`, 'Accuracy']}
                    contentStyle={{
                      borderRadius: 12,
                      backgroundColor: chartTheme.tooltipBg,
                      borderColor: chartTheme.tooltipBorder,
                      color: chartTheme.tooltipText,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="accuracy" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.accuracy >= 75
                            ? chartTheme.success
                            : entry.accuracy >= 50
                            ? chartTheme.gold
                            : chartTheme.danger
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#E2E6F3] dark:border-[#2B3150] text-[#6E7696] dark:text-[#8892B5]">
                    <th className="py-2 pr-4 font-medium">Concept</th>
                    <th className="py-2 px-3 font-medium">Mock Score</th>
                    <th className="py-2 px-3 font-medium">Mastery Shift</th>
                    <th className="py-2 pl-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E6F3] dark:divide-[#2B3150]">
                  {result.conceptBreakdown.map((row) => (
                    <tr key={row.conceptId}>
                      <td className="py-2.5 pr-4 font-medium text-[#14172B] dark:text-[#F4F6FF]">
                        {row.conceptName}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-[#4E5674] dark:text-[#B4BDD9]">
                        {row.correctCount}/{row.totalQuestions} ({row.accuracy}%)
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-[#4E5674] dark:text-[#B4BDD9]">
                        {row.masteryBefore}% →{' '}
                        <span
                          className={
                            row.masteryAfter >= row.masteryBefore
                              ? 'text-[#15996C] dark:text-[#27C991]'
                              : 'text-[#E5484D] dark:text-[#F87171]'
                          }
                        >
                          {row.masteryAfter}%
                        </span>
                      </td>
                      <td className="py-2.5 pl-3">
                        <MasteryStatusText status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SurfaceCard>

          {/* Question-by-Question Solution Review */}
          <SurfaceCard className="p-6 space-y-4">
            <h3 className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
              Question-by-Question Solution Review
            </h3>
            <div className="divide-y divide-[#E2E6F3] dark:divide-[#2B3150]">
              {result.questionReviews.map((q, idx) => (
                <div key={q.questionId} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[#6E7696] dark:text-[#8892B5]">
                      Q{idx + 1} · {q.conceptName} · <span className="capitalize">{q.difficulty}</span>
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        q.isCorrect
                          ? 'text-[#15996C] dark:text-[#27C991]'
                          : 'text-[#E5484D] dark:text-[#F87171]'
                      }`}
                    >
                      {q.isCorrect ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Correct
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                          {q.selectedIndex === null ? 'Unanswered' : 'Incorrect'}
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#14172B] dark:text-[#F4F6FF]">{q.questionText}</p>
                  <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9]">
                    Your choice:{' '}
                    <strong className="text-[#14172B] dark:text-[#F4F6FF]">
                      {q.selectedIndex !== null ? q.options[q.selectedIndex] : 'None'}
                    </strong>{' '}
                    · Correct answer:{' '}
                    <strong className="text-[#15996C] dark:text-[#27C991]">{q.options[q.correctIndex]}</strong>
                  </p>
                  <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] leading-relaxed">{q.explanation}</p>
                  {q.misconceptionTitle && (
                    <p className="text-xs text-[#E5484D] dark:text-[#F87171] font-medium">
                      Misconception flagged: {q.misconceptionTitle}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </AppShell>
    );
  }

  return null;
}
