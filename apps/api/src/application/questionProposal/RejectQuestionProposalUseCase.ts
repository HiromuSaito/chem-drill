import { Id } from "../../domain/Id";
import { QuestionProposal } from "../../domain/questionProposal/QuestionProposal";
import { QuestionProposalRepository } from "../../domain/questionProposal/QuestionProposalRepository";
import { RejectReason } from "../../domain/questionProposal/RejectReason";
import { UnitOfWork } from "../UnitOfWork";

export type RejectQuestionProposalInput = {
  questionProposalId: string;
  rejectReason: string;
};

export class RejectQuestionProposalUseCase {
  constructor(
    private uow: UnitOfWork,
    private questionProposalRepository: QuestionProposalRepository,
  ) {}

  async execute(input: RejectQuestionProposalInput): Promise<QuestionProposal> {
    return this.uow.run(async (tx) => {
      const proposal = await this.questionProposalRepository.findById(
        tx,
        Id.of(input.questionProposalId),
      );

      const { proposal: newProposal, event } = proposal.reject(
        RejectReason.create(input.rejectReason),
      );

      await this.questionProposalRepository.save(tx, newProposal, event);

      return newProposal;
    });
  }
}
