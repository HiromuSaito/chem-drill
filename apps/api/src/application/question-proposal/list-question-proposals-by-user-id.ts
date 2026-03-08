import type {
  QuestionProposalProjectionQueryService,
  ListQuestionProposalsResult,
} from "../../domain/question-proposal/query-service/question-proposal-projection-query-service.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export class ListQuestionProposalsByUserId {
  constructor(
    private uow: UnitOfWork,
    private queryService: QuestionProposalProjectionQueryService,
  ) {}

  async execute(
    userId: string,
    status: string | undefined,
    limit: number,
    offset: number,
  ): Promise<ListQuestionProposalsResult> {
    return this.uow.run(async () => {
      return await this.queryService.listByUserId(
        userId,
        status,
        limit,
        offset,
      );
    });
  }
}
