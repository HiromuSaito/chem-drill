import { Id } from "../../domain/Id";
import { QuestionProposal } from "../../domain/questionProposal/QuestionProposal";
import { QuestionProposalRepository } from "../../domain/questionProposal/QuestionProposalRepository";
import { UnitOfWork } from "../UnitOfWork";

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
    return this.uow.run(async (tx) => {
      const proposal = await this.questionProposalRepository.findById(
        tx,
        Id.of(input.questionProposalId),
      );

      const { proposal: newProposal, event } = proposal.approve();

      await this.questionProposalRepository.save(tx, newProposal, event);

      return newProposal;
    });
  }
}
