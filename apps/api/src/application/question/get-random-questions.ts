import type {
  QuestionQueryService,
  QuestionWithCategory,
} from "../../domain/question/query-service/question-query-service.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

const DEFAULT_QUESTION_COUNT = 10;
const ALLOWED_LIMITS = [5, 10, 20] as const;

export class GetRandomQuestions {
  constructor(
    private uow: UnitOfWork,
    private questionQueryService: QuestionQueryService,
  ) {}

  async execute(params?: {
    categoryId?: string;
    limit?: number;
  }): Promise<QuestionWithCategory[]> {
    const limit =
      params?.limit &&
      ALLOWED_LIMITS.includes(params.limit as (typeof ALLOWED_LIMITS)[number])
        ? params.limit
        : DEFAULT_QUESTION_COUNT;
    const categoryId = params?.categoryId;

    return this.uow.run(async () => {
      return await this.questionQueryService.findRandom(limit, categoryId);
    });
  }
}
