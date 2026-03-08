import type {
  QuestionProposalProjectionQueryService,
  QuestionProposalProjectionDto,
} from "../../domain/question-proposal/query-service/question-proposal-projection-query-service.ts";
import {
  EntityNotFoundError,
  ForbiddenError,
} from "../../domain/shared/errors.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export class GetQuestionProposalByUser {
  constructor(
    private uow: UnitOfWork,
    private queryService: QuestionProposalProjectionQueryService,
  ) {}

  async execute(
    id: string,
    callerId: string,
  ): Promise<QuestionProposalProjectionDto> {
    return this.uow.run(async () => {
      const proposal = await this.queryService.findById(id);
      if (!proposal) {
        throw new EntityNotFoundError("出題案が見つかりません。");
      }
      if (proposal.userId !== callerId) {
        throw new ForbiddenError("この出題案へのアクセス権がありません");
      }
      return proposal;
    });
  }
}
