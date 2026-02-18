import type {
  QuestionProposalListQueryService,
  QuestionProposalProjectionDto,
} from "../../domain/question-proposal/query-service/question-proposal-list-query-service.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

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
