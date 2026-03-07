import { Id } from "../../domain/shared/id.ts";
import type { EventPublisher } from "../../domain/shared/event-publisher.ts";
import { QuestionProposal } from "../../domain/question-proposal/entity/question-proposal.ts";
import type { QuestionProposalRepository } from "../../domain/question-proposal/repository/question-proposal-repository.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export type WithdrawQuestionProposalInput = {
  questionProposalId: string;
};

export class WithdrawQuestionProposal {
  constructor(
    private uow: UnitOfWork,
    private questionProposalRepository: QuestionProposalRepository,
    private eventPublisher: EventPublisher,
  ) {}

  async execute(
    input: WithdrawQuestionProposalInput,
  ): Promise<QuestionProposal> {
    const { newProposal, event } = await this.uow.run(async () => {
      const proposal = await this.questionProposalRepository.findById(
        Id.of(input.questionProposalId),
      );

      const { proposal: newProposal, event } = proposal.withdraw();

      await this.questionProposalRepository.save(newProposal, event);

      return { newProposal, event };
    });

    await this.eventPublisher.publish(event);

    return newProposal;
  }
}
