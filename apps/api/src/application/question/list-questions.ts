import type {
  QuestionQueryService,
  ListQuestionsResult,
} from "../../domain/question/query-service/question-query-service.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export class ListQuestions {
  constructor(
    private uow: UnitOfWork,
    private queryService: QuestionQueryService,
  ) {}

  async execute(
    categoryId: string | undefined,
    limit: number,
    offset: number,
  ): Promise<ListQuestionsResult> {
    return this.uow.run(async () => {
      return await this.queryService.list(categoryId, limit, offset);
    });
  }
}
