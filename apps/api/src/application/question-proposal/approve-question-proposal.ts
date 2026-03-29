import { Id } from "../../domain/shared/id.ts";
import type { EventPublisher } from "../../domain/shared/event-publisher.ts";
import { QuestionProposal } from "../../domain/question-proposal/entity/question-proposal.ts";
import type { QuestionProposalRepository } from "../../domain/question-proposal/repository/question-proposal-repository.ts";
import type { UnitOfWork } from "../unit-of-work.ts";
import type { AddExperience } from "../user-experience/add-experience.ts";

export type ApproveQuestionProposalInput = {
  questionProposalId: string;
};

export class ApproveQuestionProposal {
  constructor(
    private uow: UnitOfWork,
    private questionProposalRepository: QuestionProposalRepository,
    private eventPublisher: EventPublisher,
    private addExperience: AddExperience,
  ) {}

  async execute(
    input: ApproveQuestionProposalInput,
  ): Promise<QuestionProposal> {
    const { newProposal, event } = await this.uow.run(async () => {
      const proposal = await this.questionProposalRepository.findById(
        Id.of(input.questionProposalId),
      );

      const { proposal: newProposal, event } = proposal.approve();

      await this.questionProposalRepository.save(newProposal, event);

      return { newProposal, event };
    });

    await this.eventPublisher.publish(event);

    if (newProposal.userId) {
      await this.addExperience.execute({
        userId: newProposal.userId,
        action: "proposal_approved",
        referenceId: input.questionProposalId,
        amount: 50,
      });
    }

    return newProposal;
  }
}
