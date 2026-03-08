import type {
  QuestionProposalProjectionQueryService,
  QuestionProposalProjectionDto,
} from "../../domain/question-proposal/query-service/question-proposal-projection-query-service.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export class GetQuestionProposalByUser {
  constructor(
    private uow: UnitOfWork,
    private queryService: QuestionProposalProjectionQueryService,
  ) {}

  async execute(
    id: string,
    callerId: string,
  ): Promise<QuestionProposalProjectionDto | null> {
    return this.uow.run(async () => {
      const proposal = await this.queryService.findById(id);
      if (!proposal) return null;
      if (proposal.userId !== callerId) {
        throw new Error("この出題案へのアクセス権がありません");
      }
      return proposal;
    });
  }
}
