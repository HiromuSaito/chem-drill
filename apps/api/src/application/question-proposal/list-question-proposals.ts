import type {
  QuestionProposalProjectionQueryService,
  ListQuestionProposalsResult,
} from "../../domain/question-proposal/query-service/question-proposal-projection-query-service.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export class ListQuestionProposals {
  constructor(
    private uow: UnitOfWork,
    private queryService: QuestionProposalProjectionQueryService,
  ) {}

  async execute(
    status: string | undefined,
    categoryId: string | undefined,
    limit: number,
    offset: number,
  ): Promise<ListQuestionProposalsResult> {
    return this.uow.run(async () => {
      return await this.queryService.list(status, categoryId, limit, offset);
    });
  }
}
