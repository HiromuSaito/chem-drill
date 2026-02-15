import type {
  QuestionProposalListQueryService,
  ListQuestionProposalsInput,
  ListQuestionProposalsResult,
} from "../../domain/question-proposal/question-proposal-list-query-service.js";
import type { UnitOfWork } from "../unit-of-work.js";

export class ListQuestionProposalsUseCase {
  constructor(
    private uow: UnitOfWork,
    private queryService: QuestionProposalListQueryService,
  ) {}

  async execute(
    input: ListQuestionProposalsInput,
  ): Promise<ListQuestionProposalsResult> {
    return this.uow.run(async () => {
      return await this.queryService.list(input);
    });
  }
}
