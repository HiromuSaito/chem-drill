import type { Category } from "../../domain/category/category.js";
import { Id } from "../../domain/id.js";
import { CorrectIndexes } from "../../domain/question/correct-indexes.js";
import { Difficulty } from "../../domain/question/difficulty.js";
import { Explanation } from "../../domain/question/explanation.js";
import { QuestionText } from "../../domain/question/question-text.js";
import { QuestionProposal } from "../../domain/question-proposal/question-proposal.js";
import type { QuestionProposalRepository } from "../../domain/question-proposal/question-proposal-repository.js";
import type { UnitOfWork } from "../unit-of-work.js";

export type UpdateQuestionProposalInput = {
  questionProposalId: string;
  questionText: string;
  difficulty: string;
  choices: string[];
  correctIndexes: number[];
  explanation: string;
  categoryId: string;
};

export class UpdateQuestionProposalUseCase {
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
