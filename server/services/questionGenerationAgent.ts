import {
  generateQuestionWithGeminiResult,
  QuestionGenerationResult,
} from './geminiService';

type QuestionGeneratorInput = Parameters<typeof generateQuestionWithGeminiResult>[0];

export interface FreshQuestionRequest extends Omit<QuestionGeneratorInput, 'existingQuestions'> {
  getExistingQuestions: () => string[];
}

type QuestionGenerator = (input: QuestionGeneratorInput) => Promise<QuestionGenerationResult>;

const MAX_GENERATION_ATTEMPTS = 3;
const DUPLICATE_STOP_WORDS = new Set([
  'about',
  'after',
  'again',
  'does',
  'each',
  'from',
  'have',
  'into',
  'that',
  'the',
  'their',
  'then',
  'there',
  'these',
  'this',
  'those',
  'what',
  'when',
  'which',
  'with',
]);

function normalizedQuestion(question: string): string {
  return question.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function meaningfulTokens(question: string): Set<string> {
  return new Set(
    normalizedQuestion(question)
      .split(' ')
      .filter((token) => token.length > 2 && !DUPLICATE_STOP_WORDS.has(token))
      .map((token) => {
        if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`;
        if (token.endsWith('s') && token.length > 4) return token.slice(0, -1);
        return token;
      })
  );
}

export function areQuestionsNearDuplicates(first: string, second: string): boolean {
  const normalizedFirst = normalizedQuestion(first);
  const normalizedSecond = normalizedQuestion(second);
  if (normalizedFirst === normalizedSecond) return true;

  const firstTokens = meaningfulTokens(first);
  const secondTokens = meaningfulTokens(second);
  const smallerTokens = firstTokens.size <= secondTokens.size ? firstTokens : secondTokens;
  const largerTokens = firstTokens.size <= secondTokens.size ? secondTokens : firstTokens;
  if (smallerTokens.size < 5) return false;

  let sharedCount = 0;
  for (const token of smallerTokens) {
    if (largerTokens.has(token)) sharedCount += 1;
  }

  const smallerCoverage = sharedCount / smallerTokens.size;
  const jaccardSimilarity = sharedCount / (firstTokens.size + secondTokens.size - sharedCount);
  return smallerCoverage >= 0.88 && jaccardSimilarity >= 0.68;
}

export async function generateFreshQuestion(
  request: FreshQuestionRequest,
  generate: QuestionGenerator = generateQuestionWithGeminiResult
): Promise<QuestionGenerationResult> {
  const rejectedQuestions: string[] = [];

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const existingQuestions = [...request.getExistingQuestions(), ...rejectedQuestions];
    const result = await generate({
      conceptName: request.conceptName,
      conceptDescription: request.conceptDescription,
      keyFormula: request.keyFormula,
      difficulty: request.difficulty,
      recentMisconceptions: request.recentMisconceptions,
      existingQuestions,
    });

    const generatedQuestion = result.question;
    if (!generatedQuestion) return result;

    const latestQuestions = [...request.getExistingQuestions(), ...rejectedQuestions];
    if (latestQuestions.some((question) => areQuestionsNearDuplicates(generatedQuestion.questionText, question))) {
      rejectedQuestions.push(generatedQuestion.questionText);
      continue;
    }

    return result;
  }

  return {
    question: null,
    aiNotice: 'Could not generate a sufficiently new question after several attempts. Please try again.',
  };
}
