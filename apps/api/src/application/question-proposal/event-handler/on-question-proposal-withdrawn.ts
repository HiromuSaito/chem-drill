import type { EventHandler } from "../../../domain/shared/event-handler.ts";
import type { QuestionProposalWithdrawn } from "../../../domain/question-proposal/event/events.ts";
import type { QuestionProposalProjectionQueryService } from "../../../domain/question-proposal/query-service/question-proposal-projection-query-service.ts";
import type { QuestionRepository } from "../../../domain/question/repository/question-repository.ts";
import type { UnitOfWork } from "../../unit-of-work.ts";
import { Id } from "../../../domain/shared/id.ts";
import type { Question } from "../../../domain/question/entity/question.ts";

export class OnQuestionProposalWithdrawn implements EventHandler<QuestionProposalWithdrawn> {
  readonly eventType = "QuestionProposalWithdrawn" as const;

  constructor(
    private readonly uow: UnitOfWork,
    private readonly queryService: QuestionProposalProjectionQueryService,
    private readonly questionRepository: QuestionRepository,
  ) {}

  async handle(event: QuestionProposalWithdrawn): Promise<void> {
    await this.uow.run(async () => {
      const projection = await this.queryService.findById(
        event.payload.questionProposalId,
      );

      if (!projection) {
        throw new Error(
          `出題案が見つかりません: ${event.payload.questionProposalId}`,
        );
      }

      if (!projection.questionId) {
        return;
      }

      await this.questionRepository.unpublish(
        Id.of<Question>(projection.questionId),
      );
    });
  }
}
