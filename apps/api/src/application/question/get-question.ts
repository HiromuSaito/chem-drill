import type {
  QuestionQueryService,
  QuestionWithCategoryAndDates,
} from "../../domain/question/query-service/question-query-service.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export class GetQuestion {
  constructor(
    private uow: UnitOfWork,
    private queryService: QuestionQueryService,
  ) {}

  async execute(id: string): Promise<QuestionWithCategoryAndDates | null> {
    return this.uow.run(async () => {
      return await this.queryService.findById(id);
    });
  }
}
