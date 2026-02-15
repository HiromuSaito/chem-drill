import type {
  QuestionProposalListQueryService,
  QuestionProposalProjectionDto,
} from "../../domain/question-proposal/question-proposal-list-query-service.js";
import type { UnitOfWork } from "../unit-of-work.js";

export class GetQuestionProposalUseCase {
  constructor(
    private uow: UnitOfWork,
    private queryService: QuestionProposalListQueryService,
  ) {}

  async execute(id: string): Promise<QuestionProposalProjectionDto | null> {
    return this.uow.run(async () => {
      return await this.queryService.findById(id);
    });
  }
}
