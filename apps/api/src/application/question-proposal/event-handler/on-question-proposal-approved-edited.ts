import type { EventHandler } from "../../../domain/shared/event-handler.ts";
import type { QuestionProposalApprovedEdited } from "../../../domain/question-proposal/event/events.ts";
import type { QuestionProposalProjectionQueryService } from "../../../domain/question-proposal/query-service/question-proposal-projection-query-service.ts";
import type { QuestionRepository } from "../../../domain/question/repository/question-repository.ts";
import type { UnitOfWork } from "../../unit-of-work.ts";
import { Question } from "../../../domain/question/entity/question.ts";
import { Id } from "../../../domain/shared/id.ts";
import { QuestionText } from "../../../domain/shared/value-object/question-text.ts";
import { Difficulty } from "../../../domain/shared/value-object/difficulty.ts";
import { CorrectIndexes } from "../../../domain/shared/value-object/correct-indexes.ts";
import { Explanation } from "../../../domain/shared/value-object/explanation.ts";

export class OnQuestionProposalApprovedEdited implements EventHandler<QuestionProposalApprovedEdited> {
  readonly eventType = "QuestionProposalApprovedEdited" as const;

  constructor(
    private readonly uow: UnitOfWork,
    private readonly queryService: QuestionProposalProjectionQueryService,
    private readonly questionRepository: QuestionRepository,
  ) {}

  async handle(event: QuestionProposalApprovedEdited): Promise<void> {
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

      const question = Question.create({
        id: Id.of<Question>(projection.questionId),
        text: QuestionText.create(projection.text),
        difficulty: Difficulty.create(projection.difficulty),
        choices: projection.choices,
        correctIndexes: CorrectIndexes.create([...projection.correctIndexes]),
        explanation: Explanation.create(projection.explanation),
        categoryId: Id.of(projection.categoryId),
        isPublished: true,
      });

      await this.questionRepository.save(question);
    });
  }
}
