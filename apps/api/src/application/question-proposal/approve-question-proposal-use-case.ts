import { Id } from "../../domain/id";
import { QuestionProposal } from "../../domain/question-proposal/question-proposal";
import { QuestionProposalRepository } from "../../domain/question-proposal/question-proposal-repository";
import { UnitOfWork } from "../unit-of-work";

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
