import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  CalendarClock,
  RefreshCw,
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { MasteryStatusText } from '../../components/StatusIndicator';
import { SurfaceCard } from '../../components/ui/ThemePrimitives';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCompanion } from '../../context/CompanionContext';
import {
  AnswerEvaluationResult,
  Difficulty,
  MasteryStatus,
} from '../../../shared/types';

interface AdaptiveQuestionPayload {
  id: number;
  conceptId: number;
  conceptSlug: string;
  conceptName: string;
  difficulty: Difficulty;
  questionText: string;
  options: string[];
  source: 'seeded' | 'gemini' | 'fallback';
  adaptiveReason: string;
  conceptMastery: number;
  conceptStatus: MasteryStatus;
}

export function PracticePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, updateLocalUser } = useAuth();
  const { showToast } = useToast();
  const { triggerReaction, setActiveConceptName } = useCompanion();

  const conceptIdParam = searchParams.get('conceptId');
  const revisionIdParam = searchParams.get('revisionId');

  const [question, setQuestion] = useState<AdaptiveQuestionPayload | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<AnswerEvaluationResult | null>(null);
  const [questionError, setQuestionError] = useState<string | null>(null);

  const loadQuestion = useCallback(
    async (opts?: { conceptId?: string | null; generateAi?: boolean }) => {
      setLoading(true);
      setQuestion(null);
      setQuestionError(null);
      setEvaluation(null);
      setSelectedIndex(null);
      setReasoning('');

      try {
        const params = new URLSearchParams();
        const cid = opts?.conceptId !== undefined ? opts.conceptId : conceptIdParam;
        if (cid) params.set('conceptId', cid);
        if (opts?.generateAi) params.set('generateAi', '1');

        const query = params.toString() ? `?${params.toString()}` : '';
        const res = await apiFetch<{ question: AdaptiveQuestionPayload; aiNotice?: string }>(
          `/api/student/practice/next${query}`
        );
        setQuestion(res.question);
        setActiveConceptName(res.question.conceptName);
        if (res.aiNotice) {
          showToast(res.aiNotice, 'info');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load adaptive question.';
        setQuestionError(message);
        showToast(message, 'error');
      } finally {
        setLoading(false);
      }
    },
    [conceptIdParam, setActiveConceptName, showToast]
  );

  useEffect(() => {
    loadQuestion();
    return () => setActiveConceptName(undefined);
  }, [loadQuestion, setActiveConceptName]);

  const handleSubmit = async () => {
    if (!question) return;
    if (selectedIndex === null) {
      showToast('Please select an answer option first.', 'error');
      return;
    }

    setSubmitting(true);
    triggerReaction('thinking');
    try {
      const res = await apiFetch<AnswerEvaluationResult>('/api/student/practice/submit', {
        method: 'POST',
        body: JSON.stringify({
          questionId: question.id,
          selectedIndex,
          reasoning: reasoning.trim(),
          revisionId: revisionIdParam ? Number(revisionIdParam) : undefined,
        }),
      });
      setEvaluation(res);
      if (user && typeof res.streakDays === 'number') {
        updateLocalUser({ ...user, streakDays: res.streakDays });
      }
      if (revisionIdParam) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('revisionId');
        setSearchParams(nextParams, { replace: true });
      }

      if (res.newlyUnlockedBadges && res.newlyUnlockedBadges.length > 0) {
        const names = res.newlyUnlockedBadges.map((b) => b.title).join(', ');
        showToast(`Badge unlocked: ${names}!`, 'xp');
        triggerReaction('achievement', `Awesome! You unlocked: ${names}!`, 4800);
      } else if (res.masteryAfter >= 75 && res.masteryBefore < 75) {
        showToast(`${question.conceptName} mastered (+XP)!`, 'xp');
        triggerReaction(
          'mastered',
          `Concept Mastered! You pushed ${question.conceptName} to ${res.masteryAfter}%!`,
          4800
        );
      } else if (res.isCorrect) {
        showToast('Answer recorded — mastery updated (+15 XP)', 'success');
        triggerReaction(
          'celebrating',
          `Great job on ${question.conceptName}! Mastery rose to ${res.masteryAfter}%.`,
          4200
        );
      } else {
        showToast('Analysis complete — check conceptual feedback', 'info');
        triggerReaction(
          'encouraging',
          `Don't worry—review the feedback on ${question.conceptName} and ask me if anything feels tricky!`,
          4400
        );
      }
    } catch (err) {
      triggerReaction('idle');
      showToast(err instanceof Error ? err.message : 'Unable to submit response.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell title="Adaptive Practice">
      <div className="max-w-3xl mx-auto space-y-6">
        {loading ? (
          <div className="h-80 rounded-2xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150] animate-pulse" />
        ) : !question ? (
          <SurfaceCard className="p-8 text-center">
            <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9]">
              {questionError ?? 'No question available right now.'}
            </p>
            <button
              type="button"
              onClick={() => loadQuestion()}
              className="mt-4 rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          </SurfaceCard>
        ) : (
          <>
            {/* Adaptive Rationale Header */}
            <SurfaceCard className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E7696] dark:text-[#8892B5]">
                  <span className="font-semibold text-[#7055F7] dark:text-[#A493FF]">{question.conceptName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize font-mono">Difficulty: {question.difficulty}</span>
                  <span aria-hidden="true">·</span>
                  <MasteryStatusText status={question.conceptStatus} />
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{question.conceptMastery}% mastery</span>
                </div>
                <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9] mt-1.5">{question.adaptiveReason}</p>
              </div>

              {!evaluation && (
                <button
                  type="button"
                  onClick={() => loadQuestion({ generateAi: true })}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#CBD3E8] dark:border-[#3C456D] bg-white dark:bg-[#212640] hover:bg-[#EEF1FA] dark:hover:bg-[#272D4B] px-3 py-2 text-xs font-medium text-[#14172B] dark:text-[#F4F6FF] shrink-0 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-[#35C9D8]" aria-hidden="true" />
                  Generate Fresh Question
                </button>
              )}
            </SurfaceCard>

            {/* Question Card */}
            <SurfaceCard className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between text-xs text-[#6E7696] dark:text-[#8892B5]">
                <span>{question.source === 'gemini' ? 'AI-Generated Adaptive Item' : 'Curated Java DSA Item'}</span>
                {revisionIdParam && (
                  <span className="font-semibold text-[#7055F7] dark:text-[#A493FF]">Scheduled Revision Review</span>
                )}
              </div>

              <h2 className="font-display text-lg sm:text-xl font-semibold text-[#14172B] dark:text-[#F4F6FF] leading-snug">
                {question.questionText}
              </h2>

              <div className="space-y-2.5" role="radiogroup" aria-label="Answer options">
                {question.options.map((opt, idx) => {
                  const isSelected = selectedIndex === idx;
                  const isCorrectOption = evaluation && evaluation.correctIndex === idx;
                  const isWrongSelected = evaluation && isSelected && !evaluation.isCorrect;

                  let styleClass =
                    'border-[#E2E6F3] dark:border-[#2B3150] hover:border-[#CBD3E8] dark:hover:border-[#3C456D] hover:bg-[#F2F4FB] dark:hover:bg-[#212640] text-[#4E5674] dark:text-[#B4BDD9]';
                  if (evaluation) {
                    if (isCorrectOption) {
                      styleClass =
                        'border-[#27C991] bg-[#27C991]/12 text-[#14172B] dark:text-white font-medium';
                    } else if (isWrongSelected) {
                      styleClass =
                        'border-[#E5484D] bg-[#E5484D]/12 text-[#14172B] dark:text-white';
                    } else {
                      styleClass = 'border-[#E2E6F3] dark:border-[#2B3150] text-[#6E7696] dark:text-[#8892B5] opacity-75';
                    }
                  } else if (isSelected) {
                    styleClass =
                      'border-[#7055F7] bg-[#7055F7]/8 dark:bg-[#7055F7]/15 text-[#14172B] dark:text-white font-medium';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={Boolean(evaluation)}
                      onClick={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${styleClass}`}
                    >
                      <span
                        className={`h-6 w-6 rounded-full border flex items-center justify-center text-xs font-mono shrink-0 ${
                          isSelected
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

              {!evaluation && (
                <>
                  <div>
                    <label
                      htmlFor="practice-reasoning"
                      className="block text-xs font-medium text-[#4E5674] dark:text-[#B4BDD9] mb-1.5"
                    >
                      Explain your reasoning (recommended — detects misconceptions even when answers are close)
                    </label>
                    <textarea
                      id="practice-reasoning"
                      rows={3}
                      value={reasoning}
                      onChange={(e) => setReasoning(e.target.value)}
                      placeholder="Example: Each iteration halves the sorted search range, so..."
                      className="w-full rounded-xl border border-[#CBD3E8] dark:border-[#3C456D] bg-white dark:bg-[#111322] px-3.5 py-2.5 text-sm text-[#14172B] dark:text-[#F4F6FF] placeholder:text-[#6E7696] focus:border-[#7055F7] focus:outline-none focus:ring-2 focus:ring-[#7055F7]/20"
                    />
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSubmit}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60"
                    >
                      {submitting ? 'Evaluating Reasoning...' : 'Submit Answer & Reasoning'}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </>
              )}
            </SurfaceCard>

            {/* Evaluation & Misconception Diagnosis Panel */}
            {evaluation && (
              <SurfaceCard className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#E2E6F3] dark:border-[#2B3150]">
                  <div className="flex items-center gap-2.5">
                    {evaluation.isCorrect ? (
                      <CheckCircle2 className="h-6 w-6 text-[#27C991]" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-[#E5484D] dark:text-[#F87171]" aria-hidden="true" />
                    )}
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#14172B] dark:text-[#F4F6FF]">
                        {evaluation.isCorrect ? 'Correct Response' : 'Incorrect Response'}
                      </h3>
                      <p className="text-xs text-[#6E7696] dark:text-[#8892B5]">
                        Reasoning quality: <span className="capitalize font-medium">{evaluation.analysis.reasoningQuality}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-[#6E7696] dark:text-[#8892B5]">Concept Mastery Updated</p>
                    <p className="font-mono text-lg font-bold tabular-nums text-[#14172B] dark:text-[#F4F6FF]">
                      {evaluation.masteryBefore}% →{' '}
                      <span
                        className={
                          evaluation.masteryAfter >= evaluation.masteryBefore
                            ? 'text-[#15996C] dark:text-[#27C991]'
                            : 'text-[#E5484D] dark:text-[#F87171]'
                        }
                      >
                        {evaluation.masteryAfter}%
                      </span>
                    </p>
                  </div>
                </div>

                {/* Misconception Analysis Result */}
                {evaluation.analysis.misconceptionDetected && evaluation.analysis.misconceptionTitle ? (
                  <div className="rounded-xl border border-[#E5484D]/35 bg-[#E5484D]/8 dark:bg-[#E5484D]/12 p-5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#E5484D] dark:text-[#F87171]">
                      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Potential Misconception Identified
                    </div>
                    <p className="font-display text-base font-semibold text-[#14172B] dark:text-[#F4F6FF]">
                      {evaluation.analysis.misconceptionTitle}
                    </p>
                    {evaluation.analysis.conceptualError && (
                      <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9]">{evaluation.analysis.conceptualError}</p>
                    )}
                    <div className="pt-2 border-t border-[#E5484D]/25">
                      <p className="text-xs font-semibold text-[#14172B] dark:text-[#F4F6FF]">Corrective Explanation</p>
                      <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9] mt-1 leading-relaxed">
                        {evaluation.analysis.correctiveExplanation}
                      </p>
                    </div>
                  </div>
                ) : evaluation.analysis.confidenceStatus === 'uncertain' ? (
                  <div className="rounded-xl border border-[#F6B94A]/45 bg-[#F6B94A]/10 p-5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#B46E00] dark:text-[#F6B94A]">
                      <HelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Misconception Uncertain (Insufficient Reasoning)
                    </div>
                    <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9]">
                      {evaluation.analysis.conceptualError ||
                        'Write out a sentence explaining your physical reasoning next time so EDVANTA can diagnose any underlying misconception accurately.'}
                    </p>
                    <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9] pt-2 border-t border-[#F6B94A]/25">
                      {evaluation.analysis.correctiveExplanation}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#27C991]/40 bg-[#27C991]/10 p-5 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#15996C] dark:text-[#27C991]">
                      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Conceptual Alignment Verified
                    </div>
                    <p className="text-sm text-[#4E5674] dark:text-[#B4BDD9] leading-relaxed">
                      {evaluation.analysis.correctiveExplanation}
                    </p>
                  </div>
                )}

                {/* Scheduled Revision & Next Recommendation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA]/50 dark:bg-[#212640]/60 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#7055F7] dark:text-[#A493FF]">
                      <CalendarClock className="h-4 w-4" aria-hidden="true" />
                      Spaced Repetition Updated
                    </div>
                    <p className="text-sm font-medium text-[#14172B] dark:text-[#F4F6FF] mt-1.5">
                      Next review: {new Date(evaluation.scheduledRevision.scheduledFor).toLocaleDateString()} (
                      {evaluation.scheduledRevision.intervalDays === 0
                        ? 'Due today'
                        : `in ${evaluation.scheduledRevision.intervalDays}d`}
                      )
                    </p>
                    <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-1">{evaluation.scheduledRevision.reason}</p>
                  </div>

                  <div className="rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA]/50 dark:bg-[#212640]/60 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#35C9D8]">
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      Recommended Next Step
                    </div>
                    <p className="text-sm font-medium text-[#14172B] dark:text-[#F4F6FF] mt-1.5">
                      {evaluation.recommendedNextConcept.conceptName}
                    </p>
                    <p className="text-xs text-[#6E7696] dark:text-[#8892B5] mt-1">{evaluation.recommendedNextConcept.reason}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E2E6F3] dark:border-[#2B3150]">
                  <Link
                    to="/student/concept-map"
                    className="text-sm font-medium text-[#4E5674] dark:text-[#B4BDD9] hover:text-[#14172B] dark:hover:text-white"
                  >
                    View updated Concept Map
                  </Link>
                  <div className="flex flex-wrap items-center gap-3">
                    {!evaluation.isCorrect && (
                      <button
                        type="button"
                        onClick={() => loadQuestion({ conceptId: String(question.conceptId), generateAi: true })}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#CBD3E8] dark:border-[#3C456D] bg-white dark:bg-[#181B2E] hover:bg-[#EEF1FA] dark:hover:bg-[#212640] px-4 py-2 text-sm font-medium text-[#14172B] dark:text-[#F4F6FF] transition-colors"
                      >
                        Practice Targeted Follow-Up
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSearchParams({});
                        loadQuestion({ conceptId: null });
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] px-5 py-2.5 text-sm font-semibold text-white transition-colors"
                    >
                      Next Adaptive Question
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </SurfaceCard>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
