import { Id } from "../../domain/id.js";
import { QuestionProposal } from "../../domain/question-proposal/question-proposal.js";
import type { QuestionProposalRepository } from "../../domain/question-proposal/question-proposal-repository.js";
import type { UnitOfWork } from "../unit-of-work.js";

export type ApproveQuestionProposalInput = {
  questionProposalId: string;
};

export class ApproveQuestionProposalUseCase {
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
