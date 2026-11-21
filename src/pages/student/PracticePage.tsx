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

  const loadQuestion = useCallback(
    async (opts?: { conceptId?: string | null; generateAi?: boolean }) => {
      setLoading(true);
      setEvaluation(null);
      setSelectedIndex(null);
      setReasoning('');

      try {
        const params = new URLSearchParams();
        const cid = opts?.conceptId !== undefined ? opts.conceptId : conceptIdParam;
        if (cid) params.set('conceptId', cid);
        if (opts?.generateAi) params.set('generateAi', '1');

        const query = params.toString() ? `?${params.toString()}` : '';
        const res = await apiFetch<{ question: AdaptiveQuestionPayload }>(`/api/student/practice/next${query}`);
        setQuestion(res.question);
        setActiveConceptName(res.question.conceptName);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Unable to load adaptive question.', 'error');
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
        showToast(`Badge unlocked: ${names}!`, 'success');
        triggerReaction('celebrating', `Awesome! You unlocked: ${names}!`, 4800);
      } else if (res.isCorrect) {
        showToast('Answer recorded — mastery updated', 'success');
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
          <div className="h-80 rounded-xl bg-white border border-slate-200 animate-pulse" />
        ) : !question ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-600">No question available right now.</p>
            <button
              type="button"
              onClick={() => loadQuestion()}
              className="mt-4 rounded-lg bg-[#526BFF] px-4 py-2 text-sm font-medium text-white"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Adaptive Rationale Header */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-[#526BFF]">{question.conceptName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize font-mono">Difficulty: {question.difficulty}</span>
                  <span aria-hidden="true">·</span>
                  <MasteryStatusText status={question.conceptStatus} />
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{question.conceptMastery}% mastery</span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5">{question.adaptiveReason}</p>
              </div>

              {!evaluation && (
                <button
                  type="button"
                  onClick={() => loadQuestion({ generateAi: true })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 px-3 py-2 text-xs font-medium text-[#101827] shrink-0 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-[#8B6CFF]" aria-hidden="true" />
                  Generate Fresh Question
                </button>
              )}
            </div>

            {/* Question Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{question.source === 'gemini' ? 'AI-Generated Adaptive Item' : 'Curated Physics Item'}</span>
                {revisionIdParam && <span className="font-medium text-[#526BFF]">Scheduled Revision Review</span>}
              </div>

              <h2 className="font-display text-lg sm:text-xl font-semibold text-[#101827] leading-snug">
                {question.questionText}
              </h2>

              <div className="space-y-2.5" role="radiogroup" aria-label="Answer options">
                {question.options.map((opt, idx) => {
                  const isSelected = selectedIndex === idx;
                  const isCorrectOption = evaluation && evaluation.correctIndex === idx;
                  const isWrongSelected = evaluation && isSelected && !evaluation.isCorrect;

                  let styleClass = 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700';
                  if (evaluation) {
                    if (isCorrectOption) {
                      styleClass = 'border-[#16A34A] bg-emerald-50/70 text-[#101827] font-medium';
                    } else if (isWrongSelected) {
                      styleClass = 'border-[#DC2626] bg-red-50/70 text-[#101827]';
                    } else {
                      styleClass = 'border-slate-200 text-slate-500 opacity-80';
                    }
                  } else if (isSelected) {
                    styleClass = 'border-[#526BFF] bg-[#526BFF]/5 text-[#101827] font-medium';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={Boolean(evaluation)}
                      onClick={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${styleClass}`}
                    >
                      <span
                        className={`h-5 w-5 rounded-full border flex items-center justify-center text-xs font-mono shrink-0 ${
                          isSelected
                            ? 'border-[#526BFF] bg-[#526BFF] text-white'
                            : 'border-slate-300 text-slate-500'
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
                    <label htmlFor="practice-reasoning" className="block text-xs font-medium text-slate-700 mb-1.5">
                      Explain your reasoning (recommended — detects misconceptions even when answers are close)
                    </label>
                    <textarea
                      id="practice-reasoning"
                      rows={3}
                      value={reasoning}
                      onChange={(e) => setReasoning(e.target.value)}
                      placeholder="Example: Because resistance increased while voltage stayed constant, current..."
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#101827] focus:border-[#526BFF] focus:outline-none focus:ring-2 focus:ring-[#526BFF]/20"
                    />
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSubmit}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#526BFF] hover:bg-[#4158E6] px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-60"
                    >
                      {submitting ? 'Evaluating Reasoning...' : 'Submit Answer & Reasoning'}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Evaluation & Misconception Diagnosis Panel */}
            {evaluation && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    {evaluation.isCorrect ? (
                      <CheckCircle2 className="h-6 w-6 text-[#16A34A]" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-[#DC2626]" aria-hidden="true" />
                    )}
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#101827]">
                        {evaluation.isCorrect ? 'Correct Response' : 'Incorrect Response'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Reasoning quality: <span className="capitalize font-medium">{evaluation.analysis.reasoningQuality}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-500">Concept Mastery Updated</p>
                    <p className="font-mono text-lg font-bold tabular-nums text-[#101827]">
                      {evaluation.masteryBefore}% →{' '}
                      <span className={evaluation.masteryAfter >= evaluation.masteryBefore ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                        {evaluation.masteryAfter}%
                      </span>
                    </p>
                  </div>
                </div>

                {/* Misconception Analysis Result */}
                {evaluation.analysis.misconceptionDetected && evaluation.analysis.misconceptionTitle ? (
                  <div className="rounded-xl border border-red-200 bg-red-50/70 p-5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#DC2626]">
                      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Potential Misconception Identified
                    </div>
                    <p className="font-display text-base font-semibold text-[#101827]">
                      {evaluation.analysis.misconceptionTitle}
                    </p>
                    {evaluation.analysis.conceptualError && (
                      <p className="text-sm text-slate-700">{evaluation.analysis.conceptualError}</p>
                    )}
                    <div className="pt-2 border-t border-red-200/70">
                      <p className="text-xs font-semibold text-[#101827]">Corrective Explanation</p>
                      <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                        {evaluation.analysis.correctiveExplanation}
                      </p>
                    </div>
                  </div>
                ) : evaluation.analysis.confidenceStatus === 'uncertain' ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#D97706]">
                      <HelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Misconception Uncertain (Insufficient Reasoning)
                    </div>
                    <p className="text-sm text-slate-700">
                      {evaluation.analysis.conceptualError ||
                        'Write out a sentence explaining your physical reasoning next time so ADAPTIX can diagnose any underlying misconception accurately.'}
                    </p>
                    <p className="text-sm text-slate-700 pt-2 border-t border-amber-200/70">
                      {evaluation.analysis.correctiveExplanation}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#16A34A]">
                      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Conceptual Alignment Verified
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {evaluation.analysis.correctiveExplanation}
                    </p>
                  </div>
                )}

                {/* Scheduled Revision & Next Recommendation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#526BFF]">
                      <CalendarClock className="h-4 w-4" aria-hidden="true" />
                      Spaced Repetition Updated
                    </div>
                    <p className="text-sm font-medium text-[#101827] mt-1.5">
                      Next review: {new Date(evaluation.scheduledRevision.scheduledFor).toLocaleDateString()} (
                      {evaluation.scheduledRevision.intervalDays === 0
                        ? 'Due today'
                        : `in ${evaluation.scheduledRevision.intervalDays}d`}
                      )
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{evaluation.scheduledRevision.reason}</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#8B6CFF]">
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      Recommended Next Step
                    </div>
                    <p className="text-sm font-medium text-[#101827] mt-1.5">
                      {evaluation.recommendedNextConcept.conceptName}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{evaluation.recommendedNextConcept.reason}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <Link
                    to="/student/concept-map"
                    className="text-sm font-medium text-slate-600 hover:text-[#101827]"
                  >
                    View updated Concept Map
                  </Link>
                  <div className="flex flex-wrap items-center gap-3">
                    {!evaluation.isCorrect && (
                      <button
                        type="button"
                        onClick={() => loadQuestion({ conceptId: String(question.conceptId), generateAi: true })}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-medium text-[#101827] transition-colors"
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
                      className="inline-flex items-center gap-2 rounded-lg bg-[#526BFF] hover:bg-[#4158E6] px-5 py-2.5 text-sm font-medium text-white transition-colors"
                    >
                      Next Adaptive Question
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
