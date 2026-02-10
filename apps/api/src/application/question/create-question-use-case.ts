import { Id } from "../../domain/id.js";
import type { Category } from "../../domain/category/category.js";
import { Question } from "../../domain/question/question.js";
import { QuestionText } from "../../domain/question/question-text.js";
import { Difficulty } from "../../domain/question/difficulty.js";
import { CorrectIndexes } from "../../domain/question/correct-indexes.js";
import { Explanation } from "../../domain/question/explanation.js";
import type { QuestionRepository } from "../../domain/question/question-repository.js";
import type { UnitOfWork } from "../unit-of-work.js";

export type CreateQuestionInput = {
  text: string;
  difficulty: string;
  choices: string[];
  correctIndexes: number[];
  explanation: string;
  categoryId: string;
};

export class CreateQuestionUseCase {
  constructor(
    private uow: UnitOfWork,
    private questionRepository: QuestionRepository,
  ) {}

  async execute(input: CreateQuestionInput): Promise<Question> {
    return this.uow.run(async () => {
      const question = Question.create({
        id: Id.random<Question>(),
        text: QuestionText.create(input.text),
        difficulty: Difficulty.create(input.difficulty),
        choices: input.choices,
        correctIndexes: CorrectIndexes.create(input.correctIndexes),
        explanation: Explanation.create(input.explanation),
        categoryId: Id.of<Category>(input.categoryId),
      });

      return await this.questionRepository.save(question);
    });
  }
}
