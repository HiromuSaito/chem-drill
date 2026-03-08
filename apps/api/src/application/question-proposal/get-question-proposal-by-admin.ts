import type {
  QuestionProposalProjectionQueryService,
  QuestionProposalProjectionDto,
} from "../../domain/question-proposal/query-service/question-proposal-projection-query-service.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export class GetQuestionProposalByAdmin {
  constructor(
    private uow: UnitOfWork,
    private queryService: QuestionProposalProjectionQueryService,
  ) {}

  async execute(id: string): Promise<QuestionProposalProjectionDto | null> {
    return this.uow.run(async () => {
      return await this.queryService.findById(id);
    });
  }
}
