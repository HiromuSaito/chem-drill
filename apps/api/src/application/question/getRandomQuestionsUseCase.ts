import type { Question } from "../../domain/question/Question.js";
import type { QuestionRepository } from "../../domain/question/QuestionRepository.js";

const DEFAULT_QUESTION_COUNT = 10;

export async function getRandomQuestionsUseCase(
  questionRepository: QuestionRepository,
): Promise<Question[]> {
  return await questionRepository.findRandom(DEFAULT_QUESTION_COUNT);
}
