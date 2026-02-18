import { Id } from "../../domain/shared/id.ts";
import { QuestionProposal } from "../../domain/question-proposal/entity/question-proposal.ts";
import type { QuestionProposalRepository } from "../../domain/question-proposal/repository/question-proposal-repository.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export type ApproveQuestionProposalInput = {
  questionProposalId: string;
};

export class ApproveQuestionProposal {
  constructor(
    private uow: UnitOfWork,
    private questionProposalRepository: QuestionProposalRepository,
  ) {}

  async execute(
    input: ApproveQuestionProposalInput,
  ): Promise<QuestionProposal> {
    return this.uow.run(async () => {
      const proposal = await this.questionProposalRepository.findById(
        Id.of(input.questionProposalId),
      );

      const { proposal: newProposal, event } = proposal.approve();

      await this.questionProposalRepository.save(newProposal, event);

      return newProposal;
    });
  }
}
