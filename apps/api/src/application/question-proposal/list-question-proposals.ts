import type {
  QuestionProposalListQueryService,
  ListQuestionProposalsInput,
  ListQuestionProposalsResult,
} from "../../domain/question-proposal/query-service/question-proposal-list-query-service.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export class ListQuestionProposals {
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
