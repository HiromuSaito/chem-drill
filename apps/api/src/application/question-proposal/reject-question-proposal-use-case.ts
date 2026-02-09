import { Id } from "../../domain/id";
import { QuestionProposal } from "../../domain/question-proposal/question-proposal";
import { QuestionProposalRepository } from "../../domain/question-proposal/question-proposal-repository";
import { RejectReason } from "../../domain/question-proposal/reject-reason";
import { UnitOfWork } from "../unit-of-work";

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
