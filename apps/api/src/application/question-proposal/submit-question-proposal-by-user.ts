import type { QuestionProposal } from "../../domain/question-proposal/entity/question-proposal.ts";
import { Id } from "../../domain/shared/id.ts";
import type { QuestionProposalRepository } from "../../domain/question-proposal/repository/question-proposal-repository.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export class SubmitQuestionProposalByUser {
  constructor(
    private uow: UnitOfWork,
    private questionProposalRepository: QuestionProposalRepository,
  ) {}

  async execute(input: {
    questionProposalId: string;
    callerId: string;
  }): Promise<QuestionProposal> {
    return this.uow.run(async () => {
      const proposal = await this.questionProposalRepository.findById(
        Id.of(input.questionProposalId),
      );

      proposal.ensureOwnedBy(input.callerId);

      const { proposal: newProposal, event } = proposal.submit();

      await this.questionProposalRepository.save(newProposal, event);

      return newProposal;
    });
  }
}
