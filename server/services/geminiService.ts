import { GoogleGenAI, Type } from '@google/genai';
import { CompanionMood, Difficulty, MockExamCoachAnalysis, MockExamConceptBreakdown } from '../../shared/types';
import {
  analyzeReasoningDeterministic,
  FallbackAnalysisInput,
  hasSufficientReasoning,
  ReasoningAnalysisResult,
} from './misconceptionEngine';
import {
  buildAllowedRouteSet,
  buildInteractiveFallbackResponse,
  CompanionStructuredResponse,
  CompanionStudentSnapshot,
  sanitizeCompanionActions,
} from './companionBrain';

import {
  formatGeminiNotice,
  getGeminiCircuitState,
  recordGeminiFailure,
  runWithGeminiRetry,
} from './geminiErrorHandler';

const MODEL_NAME = 'gemini-4-hydrogen';

interface GeminiClientLookup {
  ai: GoogleGenAI | null;
  apiKey: string;
  notice: string | null;
}

function getGeminiClientState(): GeminiClientLookup {
  const apiKey = process.env.GEMINI_API_KEY?.trim() ?? '';
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return { ai: null, apiKey: '', notice: formatGeminiNotice('missing_key') };
  }

  const circuit = getGeminiCircuitState(apiKey);
  if (circuit) {
    return { ai: null, apiKey, notice: circuit.notice };
  }

  return {
    ai: new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    }),
    apiKey,
    notice: null,
  };
}

export interface GeneratedQuestionPayload {
  questionText: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  expectedReasoning: string;
  misconceptionIndicators: string[];
}

export interface QuestionGenerationResult {
  question: GeneratedQuestionPayload | null;
  aiNotice?: string;
}

export async function generateQuestionWithGeminiResult(params: {
  conceptName: string;
  conceptDescription: string;
  keyFormula: string;
  difficulty: Difficulty;
  recentMisconceptions: string[];
  existingQuestions: string[];
}): Promise<QuestionGenerationResult> {
  const { ai, apiKey, notice } = getGeminiClientState();
  if (!ai) {
    return { question: null, aiNotice: notice ?? undefined };
  }

  const prompt = `You are a Java DSA curriculum specialist creating an adaptive multiple-choice question.
Concept: ${params.conceptName}
Concept summary: ${params.conceptDescription}
Key formula: ${params.keyFormula}
Target difficulty: ${params.difficulty}
Student's recent misconceptions on this topic: ${params.recentMisconceptions.length > 0 ? params.recentMisconceptions.join('; ') : 'None recorded yet'}
Create a meaningfully different question from these existing questions. Do not copy their wording, tested scenario, or reasoning pattern:
${params.existingQuestions.slice(-30).map((q, idx) => `${idx + 1}. ${q}`).join('\n')}

Requirements:
- Write 1 clear, unambiguous Java Data Structures & Algorithms (DSA) conceptual or numerical multiple-choice question.
- Test a distinct concept, edge case, or application rather than paraphrasing an existing question.
- Provide exactly 4 distinct answer options (no "All of the above" or "None of the above").
- Provide the 0-based index (0, 1, 2, or 3) of the single correct option.
- Provide a concise explanation, the expected student reasoning, and 2-3 specific misconception indicators that distractors test.`;

  try {
    const response = await runWithGeminiRetry(() =>
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction:
            'Return strictly valid JSON matching the schema. Keep Java syntax valid and algorithmic reasoning technically accurate.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questionText: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              expectedReasoning: { type: Type.STRING },
              misconceptionIndicators: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'questionText',
              'options',
              'correctIndex',
              'explanation',
              'expectedReasoning',
              'misconceptionIndicators',
            ],
          },
        },
      })
    );

    const raw = (response.text ?? '').trim();
    if (!raw) return { question: null, aiNotice: formatGeminiNotice('unknown') };
    const parsed = JSON.parse(raw) as Partial<GeneratedQuestionPayload>;

    if (
      typeof parsed.questionText !== 'string' ||
      parsed.questionText.trim().length < 15 ||
      !Array.isArray(parsed.options) ||
      parsed.options.length !== 4 ||
      parsed.options.some((opt) => typeof opt !== 'string' || opt.trim().length === 0) ||
      typeof parsed.correctIndex !== 'number' ||
      !Number.isInteger(parsed.correctIndex) ||
      parsed.correctIndex < 0 ||
      parsed.correctIndex > 3 ||
      typeof parsed.explanation !== 'string' ||
      parsed.explanation.trim().length < 10 ||
      typeof parsed.expectedReasoning !== 'string' ||
      parsed.expectedReasoning.trim().length < 10 ||
      !Array.isArray(parsed.misconceptionIndicators) ||
      parsed.misconceptionIndicators.length < 2 ||
      parsed.misconceptionIndicators.length > 3 ||
      parsed.misconceptionIndicators.some((indicator) => typeof indicator !== 'string' || indicator.trim().length === 0)
    ) {
      return { question: null, aiNotice: formatGeminiNotice('unknown') };
    }

    const uniqueOpts = new Set(parsed.options.map((o) => o.trim().toLowerCase()));
    if (uniqueOpts.size < 4) {
      return { question: null, aiNotice: formatGeminiNotice('unknown') };
    }

    return {
      question: {
        questionText: parsed.questionText.trim(),
        options: [
          parsed.options[0].trim(),
          parsed.options[1].trim(),
          parsed.options[2].trim(),
          parsed.options[3].trim(),
        ],
        correctIndex: parsed.correctIndex,
        explanation: parsed.explanation.trim(),
        expectedReasoning: parsed.expectedReasoning.trim(),
        misconceptionIndicators: parsed.misconceptionIndicators.map((indicator) => indicator.trim()),
      },
    };
  } catch (err) {
    const classified = recordGeminiFailure(apiKey, err);
    return { question: null, aiNotice: classified.userNotice };
  }
}

export async function generateQuestionWithGemini(params: {
  conceptName: string;
  conceptDescription: string;
  keyFormula: string;
  difficulty: Difficulty;
  recentMisconceptions: string[];
  existingQuestions: string[];
}): Promise<GeneratedQuestionPayload | null> {
  const result = await generateQuestionWithGeminiResult(params);
  return result.question;
}

export async function analyzeStudentReasoning(input: FallbackAnalysisInput): Promise<ReasoningAnalysisResult> {
  // Always guard against empty/insufficient reasoning before calling the LLM
  if (!hasSufficientReasoning(input.studentReasoning)) {
    return analyzeReasoningDeterministic(input);
  }

  const { ai, apiKey } = getGeminiClientState();
  if (!ai) {
    return analyzeReasoningDeterministic(input);
  }

  const prompt = `Analyze a Java DSA student's answer and written reasoning.

Concept: ${input.conceptName}
Question: ${input.questionText}
Student selected: "${input.selectedOptionText}" (${input.isCorrect ? 'CORRECT' : 'INCORRECT'})
Correct answer: "${input.correctOptionText}"
Reference explanation: ${input.explanation}
Expected reasoning: ${input.expectedReasoning}
Student's written reasoning: "${input.studentReasoning}"

Task:
1. Evaluate whether the student's reasoning reflects a genuine conceptual misconception, partial calculation error, or aligned understanding.
2. Remember: even if the selected option was correct, check if the reasoning itself reveals a flawed rule. Conversely, if the reasoning is too vague to identify a misconception, set confidenceStatus to "uncertain" and misconceptionDetected to false rather than inventing one.
3. Provide a clear, encouraging corrective explanation tailored to the student's exact reasoning.`;

  try {
    const response = await runWithGeminiRetry(() =>
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction:
            'You are a Java DSA tutor. Return structured JSON strictly matching the schema. Be concise, accurate, and never invent a misconception if the student reasoning is unclear or off-topic.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              confidenceStatus: {
                type: Type.STRING,
                description: 'One of: identified, uncertain, none',
              },
              misconceptionDetected: { type: Type.BOOLEAN },
              misconceptionTitle: { type: Type.STRING },
              conceptualError: { type: Type.STRING },
              correctiveExplanation: { type: Type.STRING },
              reasoningQuality: {
                type: Type.STRING,
                description: 'One of: aligned, partial, flawed, insufficient',
              },
              recommendedFocus: { type: Type.STRING },
            },
            required: [
              'confidenceStatus',
              'misconceptionDetected',
              'misconceptionTitle',
              'conceptualError',
              'correctiveExplanation',
              'reasoningQuality',
              'recommendedFocus',
            ],
          },
        },
      })
    );

    const raw = (response.text ?? '').trim();
    if (!raw) {
      return analyzeReasoningDeterministic(input);
    }

    const parsed = JSON.parse(raw) as {
      confidenceStatus?: string;
      misconceptionDetected?: boolean;
      misconceptionTitle?: string;
      conceptualError?: string;
      correctiveExplanation?: string;
      reasoningQuality?: string;
      recommendedFocus?: string;
    };

    const confidence =
      parsed.confidenceStatus === 'identified' || parsed.confidenceStatus === 'uncertain' || parsed.confidenceStatus === 'none'
        ? parsed.confidenceStatus
        : parsed.misconceptionDetected
        ? 'identified'
        : 'none';

    const quality =
      parsed.reasoningQuality === 'aligned' ||
      parsed.reasoningQuality === 'partial' ||
      parsed.reasoningQuality === 'flawed' ||
      parsed.reasoningQuality === 'insufficient'
        ? parsed.reasoningQuality
        : input.isCorrect
        ? 'aligned'
        : 'flawed';

    const detected = Boolean(parsed.misconceptionDetected) && confidence === 'identified';

    return {
      source: 'gemini',
      confidenceStatus: confidence,
      misconceptionDetected: detected,
      misconceptionTitle: detected && parsed.misconceptionTitle ? parsed.misconceptionTitle.trim() : null,
      conceptualError:
        detected && parsed.conceptualError
          ? parsed.conceptualError.trim()
          : confidence === 'uncertain' && parsed.conceptualError
          ? parsed.conceptualError.trim()
          : null,
      correctiveExplanation:
        typeof parsed.correctiveExplanation === 'string' && parsed.correctiveExplanation.trim().length > 8
          ? parsed.correctiveExplanation.trim()
          : input.explanation,
      reasoningQuality: quality,
      recommendedFocus:
        typeof parsed.recommendedFocus === 'string' && parsed.recommendedFocus.trim().length > 5
          ? parsed.recommendedFocus.trim()
          : `Practice ${input.conceptName} with step-by-step reasoning.`,
    };
  } catch (err) {
    recordGeminiFailure(apiKey, err);
    return analyzeReasoningDeterministic(input);
  }
}

export async function chatWithStudyCompanion(
  params: CompanionStudentSnapshot
): Promise<CompanionStructuredResponse> {
  const { ai, apiKey } = getGeminiClientState();
  if (!ai) {
    return buildInteractiveFallbackResponse(params);
  }

  const allowedRoutes = buildAllowedRouteSet(params.conceptMasteries);

  const conceptLines = params.conceptMasteries
    .map((c) => `- ${c.name} (id=${c.id}, slug=${c.slug}): ${c.masteryScore}% [${c.status}] · Formula: ${c.keyFormula}`)
    .join('\n');

  const dueSummary =
    params.dueRevisions.length > 0
      ? params.dueRevisions.map((r) => `${r.conceptName} (id=${r.conceptId}): ${r.reason}`).join('; ')
      : 'None currently due';

  const miscSummary =
    params.activeMisconceptions.length > 0
      ? params.activeMisconceptions.map((m) => `${m.conceptName}: ${m.misconceptionTitle}`).join('; ')
      : 'None active';

  const remainingModules =
    params.incompleteModules.length > 0
      ? params.incompleteModules.map((m) => `${m.title} (slug=${m.slug})`).join(', ')
      : 'All 8 modules completed';

  const recentTurns = params.history
    .slice(-6)
    .map((h) => `${h.sender === 'user' ? 'Student' : 'Byte'}: ${h.text}`)
    .join('\n');

  const prompt = `Live Student Workspace Context:
- Name: ${params.studentName}
- Current Screen: ${params.currentPage || 'Student Workspace'}
- Active Topic: ${params.activeConceptName || 'Java DSA — Java DSA'}
- Overall Mastery: ${params.overallMastery}% | Questions Attempted: ${params.totalAttempted} | Accuracy: ${params.accuracyRate}%
- Active Streak: ${params.streakDays} days | Total XP: ${params.totalXp} | Badges Unlocked: ${params.unlockedBadgesCount}/${params.totalBadgesCount}
- Unlocked Badges: ${params.unlockedBadgeNames.join(', ') || 'None yet'}
- Next Closest Badges: ${params.nextLockedBadges.map((b) => `${b.title} (${b.progress}/${b.target})`).join(', ') || 'All unlocked'}
- Modules Completed: ${params.completedModulesCount}/8 | Remaining Modules: ${remainingModules}
- Due Revisions: ${dueSummary}
- Active Misconceptions: ${miscSummary}

Per-Concept Mastery & Formulas:
${conceptLines}

Valid EDVANTA App Routes you may return in recommendedActionRoutes:
- /student/dashboard (Dashboard Overview)
- /student/modules (Learning Modules & Journey View) or /student/modules?conceptSlug=<slug>
- /student/flashcards (Interactive Flashcards) or /student/flashcards?conceptSlug=<slug>
- /student/mock-exam (Timed Mock Exam & Coach AI Analysis)
- /student/practice (Adaptive Practice) or /student/practice?conceptId=<id>
- /student/diagnostic (Diagnostic Test)
- /student/concept-map (Concept Knowledge Graph)
- /student/revisions (Revision Planner)
- /student/achievements (Streaks & Achievements)
- /student/analytics (Performance Analytics)
- /student/learning (My Learning & Misconceptions)

Recent conversation:
${recentTurns || '(New conversation)'}

Student's message: "${params.message}"

Respond as Byte, an interactive Java DSA & EDVANTA app assistant.
Rules:
1. Answer whatever the user asks directly—whether it is a Java DSA question, algorithm walkthrough, code-pattern request, progress/streak/badge check, revision question, or navigation command.
2. Keep the reply crisp (2–4 clear sentences) and technically accurate with correct Java syntax and complexity.
3. Choose up to 2 relevant clickable app buttons in recommendedActionRoutes using ONLY valid routes from the list above (e.g. launching a concept's module or adaptive practice, opening achievements, etc.).
4. Provide 2–3 short, natural followUpPrompts (under 40 chars each) tailored to what the student just asked.`;

  try {
    const response = await runWithGeminiRetry(() =>
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction:
            'You are Byte, an interactive AI study companion inside EDVANTA for Java Data Structures & Algorithms (DSA). Return strictly valid JSON matching the schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              mood: {
                type: Type.STRING,
                description: 'One of: idle, celebrating, encouraging',
              },
              recommendedActionRoutes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    targetPath: { type: Type.STRING },
                  },
                  required: ['label', 'targetPath'],
                },
              },
              followUpPrompts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['reply', 'mood', 'recommendedActionRoutes', 'followUpPrompts'],
          },
        },
      })
    );

    const raw = (response.text ?? '').trim();
    if (!raw) {
      return buildInteractiveFallbackResponse(params);
    }

    const parsed = JSON.parse(raw) as {
      reply?: string;
      mood?: string;
      recommendedActionRoutes?: Array<{ label?: string; targetPath?: string }>;
      followUpPrompts?: string[];
    };

    const reply = typeof parsed.reply === 'string' && parsed.reply.trim().length > 0 ? parsed.reply.trim() : '';
    if (!reply) {
      return buildInteractiveFallbackResponse(params);
    }

    const mood: CompanionMood =
      parsed.mood === 'celebrating' || parsed.mood === 'encouraging' || parsed.mood === 'idle'
        ? parsed.mood
        : 'idle';

    const actions = sanitizeCompanionActions(parsed.recommendedActionRoutes, allowedRoutes);
    const suggestedReplies = Array.isArray(parsed.followUpPrompts)
      ? parsed.followUpPrompts
          .filter((s) => typeof s === 'string' && s.trim().length > 0)
          .map((s) => s.trim().slice(0, 48))
          .slice(0, 3)
      : [];

    return {
      reply,
      source: 'gemini',
      mood,
      actions,
      suggestedReplies:
        suggestedReplies.length > 0
          ? suggestedReplies
          : ['What should I study next?', 'Give me a practice question'],
    };
  } catch (err) {
    recordGeminiFailure(apiKey, err);
    return buildInteractiveFallbackResponse(params);
  }
}

export async function enrichMockExamCoachWithGemini(params: {
  studentName: string;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  durationUsedSeconds: number;
  conceptBreakdown: MockExamConceptBreakdown[];
  misconceptionsDetected: string[];
  deterministicCoach: MockExamCoachAnalysis;
}): Promise<MockExamCoachAnalysis> {
  const { ai, apiKey } = getGeminiClientState();
  if (!ai) {
    return params.deterministicCoach;
  }

  const breakdownLines = params.conceptBreakdown
    .map((c) => `- ${c.conceptName}: ${c.correctCount}/${c.totalQuestions} (${c.accuracy}%), mastery ${c.masteryBefore}% -> ${c.masteryAfter}%`)
    .join('\n');

  const prompt = `You are EDVANTA Coach AI analyzing a Java Data Structures & Algorithms (DSA) timed mock exam.
Student: ${params.studentName}
Score: ${params.scorePercent}% (${params.correctCount}/${params.totalQuestions})
Time used: ${Math.floor(params.durationUsedSeconds / 60)}m ${params.durationUsedSeconds % 60}s
Concept performance:
${breakdownLines}
Misconceptions detected: ${params.misconceptionsDetected.join('; ') || 'None explicitly flagged'}

Write concise, high-impact coaching feedback:
- headline: crisp 6-10 word diagnostic headline
- summary: 2 sentences summarizing performance and highest-leverage gap
- timeManagementNote: 1-2 sentences on pacing (${Math.round(params.durationUsedSeconds / Math.max(1, params.totalQuestions))}s/question)
- roadmapSteps: exactly 3 concrete study actions for the next session.`;

  try {
    const response = await runWithGeminiRetry(() =>
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction: 'Return strictly valid JSON matching the schema. Be encouraging, specific to Java DSA, and concise.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              summary: { type: Type.STRING },
              timeManagementNote: { type: Type.STRING },
              roadmapSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['headline', 'summary', 'timeManagementNote', 'roadmapSteps'],
          },
        },
      })
    );

    const raw = (response.text ?? '').trim();
    if (!raw) return params.deterministicCoach;
    const parsed = JSON.parse(raw) as {
      headline?: string;
      summary?: string;
      timeManagementNote?: string;
      roadmapSteps?: string[];
    };

    const headline = typeof parsed.headline === 'string' && parsed.headline.trim().length > 8
      ? parsed.headline.trim()
      : params.deterministicCoach.headline;
    const summary = typeof parsed.summary === 'string' && parsed.summary.trim().length > 15
      ? parsed.summary.trim()
      : params.deterministicCoach.summary;
    const timeManagementNote = typeof parsed.timeManagementNote === 'string' && parsed.timeManagementNote.trim().length > 12
      ? parsed.timeManagementNote.trim()
      : params.deterministicCoach.timeManagementNote;
    const roadmapSteps = Array.isArray(parsed.roadmapSteps)
      ? parsed.roadmapSteps.filter((s) => typeof s === 'string' && s.trim().length > 8).map((s) => s.trim()).slice(0, 3)
      : [];

    return {
      ...params.deterministicCoach,
      headline,
      summary,
      timeManagementNote,
      roadmapSteps: roadmapSteps.length >= 2 ? roadmapSteps : params.deterministicCoach.roadmapSteps,
      source: 'gemini',
    };
  } catch (err) {
    recordGeminiFailure(apiKey, err);
    return params.deterministicCoach;
  }
}



