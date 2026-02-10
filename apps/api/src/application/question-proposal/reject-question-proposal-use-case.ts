import { Id } from "../../domain/id.js";
import { QuestionProposal } from "../../domain/question-proposal/question-proposal.js";
import type { QuestionProposalRepository } from "../../domain/question-proposal/question-proposal-repository.js";
import { RejectReason } from "../../domain/question-proposal/reject-reason.js";
import type { UnitOfWork } from "../unit-of-work.js";

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
    return this.uow.run(async () => {
      const proposal = await this.questionProposalRepository.findById(
        Id.of(input.questionProposalId),
      );

      const { proposal: newProposal, event } = proposal.reject(
        RejectReason.create(input.rejectReason),
      );

      await this.questionProposalRepository.save(newProposal, event);

      return newProposal;
    });
  }
}
