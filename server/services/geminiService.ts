import { GoogleGenAI, Type } from '@google/genai';
import { CompanionMood, Difficulty } from '../../shared/types';
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

const MODEL_NAME = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface GeneratedQuestionPayload {
  questionText: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  expectedReasoning: string;
  misconceptionIndicators: string[];
}

export async function generateQuestionWithGemini(params: {
  conceptName: string;
  conceptDescription: string;
  keyFormula: string;
  difficulty: Difficulty;
  recentMisconceptions: string[];
  existingQuestions: string[];
}): Promise<GeneratedQuestionPayload | null> {
  const ai = getGeminiClient();
  if (!ai) {
    return null;
  }

  const prompt = `You are a Class 10 Physics curriculum specialist creating an adaptive multiple-choice question.
Concept: ${params.conceptName}
Concept summary: ${params.conceptDescription}
Key formula: ${params.keyFormula}
Target difficulty: ${params.difficulty}
Student's recent misconceptions on this topic: ${params.recentMisconceptions.length > 0 ? params.recentMisconceptions.join('; ') : 'None recorded yet'}
Avoid repeating or closely paraphrasing these existing questions:
${params.existingQuestions.slice(0, 6).map((q, idx) => `${idx + 1}. ${q}`).join('\n')}

Requirements:
- Write 1 clear, unambiguous Class 10 Physics (Electricity) conceptual or numerical multiple-choice question.
- Provide exactly 4 distinct answer options (no "All of the above" or "None of the above").
- Provide the 0-based index (0, 1, 2, or 3) of the single correct option.
- Provide a concise explanation, the expected student reasoning, and 2-3 specific misconception indicators that distractors test.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction:
          'Return strictly valid JSON matching the schema. Keep numbers clean and physically accurate for Class 10 Physics.',
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
    });

    const raw = (response.text ?? '').trim();
    if (!raw) return null;
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
      parsed.expectedReasoning.trim().length < 10
    ) {
      return null;
    }

    const uniqueOpts = new Set(parsed.options.map((o) => o.trim().toLowerCase()));
    if (uniqueOpts.size < 4) {
      return null;
    }

    return {
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
      misconceptionIndicators: Array.isArray(parsed.misconceptionIndicators)
        ? parsed.misconceptionIndicators.filter((m) => typeof m === 'string' && m.trim().length > 0).slice(0, 4)
        : [],
    };
  } catch (err) {
    console.warn('Gemini question generation unavailable, using curated bank:', err instanceof Error ? err.message : 'Unknown error');
    return null;
  }
}

export async function analyzeStudentReasoning(input: FallbackAnalysisInput): Promise<ReasoningAnalysisResult> {
  // Always guard against empty/insufficient reasoning before calling the LLM
  if (!hasSufficientReasoning(input.studentReasoning)) {
    return analyzeReasoningDeterministic(input);
  }

  const ai = getGeminiClient();
  if (!ai) {
    return analyzeReasoningDeterministic(input);
  }

  const prompt = `Analyze a Class 10 Physics student's answer and written reasoning.

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
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction:
          'You are a diagnostic Physics tutor. Return structured JSON strictly matching the schema. Be concise, accurate, and never invent a misconception if the student reasoning is unclear or off-topic.',
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
    });

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
    console.warn('Gemini reasoning analysis fallback engaged:', err instanceof Error ? err.message : 'Unknown error');
    return analyzeReasoningDeterministic(input);
  }
}

export async function chatWithStudyCompanion(
  params: CompanionStudentSnapshot
): Promise<CompanionStructuredResponse> {
  const ai = getGeminiClient();
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
    .map((h) => `${h.sender === 'user' ? 'Student' : 'Volt'}: ${h.text}`)
    .join('\n');

  const prompt = `Live Student Workspace Context:
- Name: ${params.studentName}
- Current Screen: ${params.currentPage || 'Student Workspace'}
- Active Topic: ${params.activeConceptName || 'Class 10 Physics — Electricity'}
- Overall Mastery: ${params.overallMastery}% | Questions Attempted: ${params.totalAttempted} | Accuracy: ${params.accuracyRate}%
- Active Streak: ${params.streakDays} days | Total XP: ${params.totalXp} | Badges Unlocked: ${params.unlockedBadgesCount}/${params.totalBadgesCount}
- Unlocked Badges: ${params.unlockedBadgeNames.join(', ') || 'None yet'}
- Next Closest Badges: ${params.nextLockedBadges.map((b) => `${b.title} (${b.progress}/${b.target})`).join(', ') || 'All unlocked'}
- Modules Completed: ${params.completedModulesCount}/8 | Remaining Modules: ${remainingModules}
- Due Revisions: ${dueSummary}
- Active Misconceptions: ${miscSummary}

Per-Concept Mastery & Formulas:
${conceptLines}

Valid ADAPTIX App Routes you may return in recommendedActionRoutes:
- /student/dashboard (Dashboard Overview)
- /student/modules (Learning Modules) or /student/modules?conceptSlug=<slug>
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

Respond as Volt, an interactive Class 10 Physics & ADAPTIX app assistant.
Rules:
1. Answer whatever the user asks directly—whether it is a physics question, numerical problem, formula request, progress/streak/badge check, revision question, or navigation command.
2. Keep the reply crisp (2–4 clear sentences) and mathematically accurate with SI units.
3. Choose up to 2 relevant clickable app buttons in recommendedActionRoutes using ONLY valid routes from the list above (e.g. launching a concept's module or adaptive practice, opening achievements, etc.).
4. Provide 2–3 short, natural followUpPrompts (under 40 chars each) tailored to what the student just asked.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction:
          'You are Volt, an interactive AI study companion inside ADAPTIX for Class 10 Physics (Electricity). Return strictly valid JSON matching the schema.',
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
    });

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
    console.warn('Gemini study companion fallback engaged:', err instanceof Error ? err.message : 'Unknown error');
    return buildInteractiveFallbackResponse(params);
  }
}


