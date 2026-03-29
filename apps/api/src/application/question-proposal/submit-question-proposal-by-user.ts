import type { QuestionProposal } from "../../domain/question-proposal/entity/question-proposal.ts";
import { Id } from "../../domain/shared/id.ts";
import type { QuestionProposalRepository } from "../../domain/question-proposal/repository/question-proposal-repository.ts";
import type { UnitOfWork } from "../unit-of-work.ts";
import type { AddExperience } from "../user-experience/add-experience.ts";

export class SubmitQuestionProposalByUser {
  constructor(
    private uow: UnitOfWork,
    private questionProposalRepository: QuestionProposalRepository,
    private addExperience: AddExperience,
  ) {}

  async execute(input: {
    questionProposalId: string;
    callerId: string;
  }): Promise<QuestionProposal> {
    const newProposal = await this.uow.run(async () => {
      const proposal = await this.questionProposalRepository.findById(
        Id.of(input.questionProposalId),
      );

      proposal.ensureOwnedBy(input.callerId);

      const { proposal: newProposal, event } = proposal.submit();

      await this.questionProposalRepository.save(newProposal, event);

      return newProposal;
    });

    await this.addExperience.execute({
      userId: input.callerId,
      action: "proposal_submit",
      referenceId: input.questionProposalId,
      amount: 30,
    });

    return newProposal;
  }
}
