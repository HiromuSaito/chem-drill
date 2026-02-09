import { Category } from "../../domain/category/Category";
import { Id } from "../../domain/Id";
import { CorrectIndexes } from "../../domain/question/CorrectIndexes";
import { Difficulty } from "../../domain/question/Difficulty";
import { Explanation } from "../../domain/question/Explanation";
import { QuestionText } from "../../domain/question/QuestionText";
import { QuestionProposal } from "../../domain/questionProposal/QuestionProposal";
import { QuestionProposalRepository } from "../../domain/questionProposal/QuestionProposalRepository";
import { UnitOfWork } from "../UnitOfWork";

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
