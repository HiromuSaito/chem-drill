import type {
  QuestionQueryService,
  QuestionWithCategory,
} from "../../domain/question/QuestionQueryService.js";
import type { UnitOfWork } from "../UnitOfWork.js";

const DEFAULT_QUESTION_COUNT = 10;

export async function getRandomQuestionsUseCase(
  uow: UnitOfWork,
  questionQueryService: QuestionQueryService,
): Promise<QuestionWithCategory[]> {
  return uow.run(async (tx) => {
    return await questionQueryService.findRandom(tx, DEFAULT_QUESTION_COUNT);
  });
}
