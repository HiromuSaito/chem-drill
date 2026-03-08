import type {
  QuestionProposalProjectionQueryService,
  ListQuestionProposalsByUserIdResult,
} from "../../domain/question-proposal/query-service/question-proposal-projection-query-service.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export class ListQuestionsProposalsByUserId {
  constructor(
    private uow: UnitOfWork,
    private queryService: QuestionProposalProjectionQueryService,
  ) {}

  async execute(
    userId: string,
    status: string | undefined,
    limit: number,
    offset: number,
  ): Promise<ListQuestionProposalsByUserIdResult> {
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
