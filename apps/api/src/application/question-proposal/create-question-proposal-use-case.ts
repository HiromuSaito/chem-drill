import { Category } from "../../domain/category/category";
import { Id } from "../../domain/id";
import { CorrectIndexes } from "../../domain/question/correct-indexes";
import { Difficulty } from "../../domain/question/difficulty";
import { Explanation } from "../../domain/question/explanation";
import { QuestionText } from "../../domain/question/question-text";
import { QuestionProposal } from "../../domain/question-proposal/question-proposal";
import { QuestionProposalRepository } from "../../domain/question-proposal/question-proposal-repository";
import { UnitOfWork } from "../unit-of-work";

export type CreateQuestionProposalInput = {
  questionText: string;
  difficulty: string;
  choices: string[];
  correctIndexes: number[];
  explanation: string;
  categoryId: string;
};

export class CreateQuestionProposalUseCase {
  constructor(
    private uow: UnitOfWork,
    private questionProposalRepository: QuestionProposalRepository,
  ) {}

  async execute(input: CreateQuestionProposalInput): Promise<QuestionProposal> {
    return this.uow.run(async (tx) => {
      const { proposal, event } = QuestionProposal.create({
        questionText: QuestionText.create(input.questionText),
        difficulty: Difficulty.create(input.difficulty),
        choices: input.choices,
        correctIndexes: CorrectIndexes.create(input.correctIndexes),
        explanation: Explanation.create(input.explanation),
        categoryId: Id.of<Category>(input.categoryId),
      });

      await this.questionProposalRepository.save(tx, proposal, event);

      return proposal;
    });
  }
}
