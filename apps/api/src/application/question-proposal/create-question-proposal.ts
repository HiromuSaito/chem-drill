import type { Category } from "../../domain/category/entity/category.ts";
import { Id } from "../../domain/shared/id.ts";
import { CorrectIndexes } from "../../domain/shared/value-object/correct-indexes.ts";
import { Difficulty } from "../../domain/shared/value-object/difficulty.ts";
import { Explanation } from "../../domain/shared/value-object/explanation.ts";
import { QuestionText } from "../../domain/shared/value-object/question-text.ts";
import { QuestionProposal } from "../../domain/question-proposal/entity/question-proposal.ts";
import type { QuestionProposalRepository } from "../../domain/question-proposal/repository/question-proposal-repository.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export type CreateQuestionProposalInput = {
  questionText: string;
  difficulty: string;
  choices: string[];
  correctIndexes: number[];
  explanation: string;
  categoryId: string;
};

export class CreateQuestionProposal {
  constructor(
    private uow: UnitOfWork,
    private questionProposalRepository: QuestionProposalRepository,
  ) {}

  async execute(input: CreateQuestionProposalInput): Promise<QuestionProposal> {
    return this.uow.run(async () => {
      const { proposal, event } = QuestionProposal.create({
        questionText: QuestionText.create(input.questionText),
        difficulty: Difficulty.create(input.difficulty),
        choices: input.choices,
        correctIndexes: CorrectIndexes.create(input.correctIndexes),
        explanation: Explanation.create(input.explanation),
        categoryId: Id.of<Category>(input.categoryId),
      });

      await this.questionProposalRepository.save(proposal, event);

      return proposal;
    });
  }
}
