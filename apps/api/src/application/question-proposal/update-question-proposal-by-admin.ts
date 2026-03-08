import type { Category } from "../../domain/category/entity/category.ts";
import { Id } from "../../domain/shared/id.ts";
import { CorrectIndexes } from "../../domain/shared/value-object/correct-indexes.ts";
import { Difficulty } from "../../domain/shared/value-object/difficulty.ts";
import { Explanation } from "../../domain/shared/value-object/explanation.ts";
import { QuestionText } from "../../domain/shared/value-object/question-text.ts";
import { QuestionProposal } from "../../domain/question-proposal/entity/question-proposal.ts";
import type { QuestionProposalRepository } from "../../domain/question-proposal/repository/question-proposal-repository.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export type UpdateQuestionProposalInput = {
  questionProposalId: string;
  questionText: string;
  difficulty: string;
  choices: string[];
  correctIndexes: number[];
  explanation: string;
  categoryId: string;
};

export class UpdateQuestionProposalByAdmin {
  constructor(
    private uow: UnitOfWork,
    private questionProposalRepository: QuestionProposalRepository,
  ) {}

  async execute(input: UpdateQuestionProposalInput): Promise<QuestionProposal> {
    return this.uow.run(async () => {
      const proposal = await this.questionProposalRepository.findById(
        Id.of(input.questionProposalId),
      );

      const { proposal: newProposal, event } = proposal.edit({
        questionText: QuestionText.create(input.questionText),
        difficulty: Difficulty.create(input.difficulty),
        choices: input.choices,
        correctIndexes: CorrectIndexes.create(input.correctIndexes),
        explanation: Explanation.create(input.explanation),
        categoryId: Id.of<Category>(input.categoryId),
      });

      await this.questionProposalRepository.save(newProposal, event);

      return newProposal;
    });
  }
}
