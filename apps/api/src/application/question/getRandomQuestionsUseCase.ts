import type {
  QuestionQueryService,
  QuestionWithCategory,
} from "../../domain/question/QuestionQueryService.js";

const DEFAULT_QUESTION_COUNT = 10;

export async function getRandomQuestionsUseCase(
  questionQueryService: QuestionQueryService,
): Promise<QuestionWithCategory[]> {
  return await questionQueryService.findRandom(DEFAULT_QUESTION_COUNT);
}
