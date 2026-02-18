import { Id } from "../../domain/shared/id.ts";
import type { Category } from "../../domain/category/entity/category.ts";
import { Question } from "../../domain/question/entity/question.ts";
import { QuestionText } from "../../domain/shared/value-object/question-text.ts";
import { Difficulty } from "../../domain/shared/value-object/difficulty.ts";
import { CorrectIndexes } from "../../domain/shared/value-object/correct-indexes.ts";
import { Explanation } from "../../domain/shared/value-object/explanation.ts";
import type { QuestionRepository } from "../../domain/question/repository/question-repository.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export type CreateQuestionInput = {
  text: string;
  difficulty: string;
  choices: string[];
  correctIndexes: number[];
  explanation: string;
  categoryId: string;
};

export class CreateQuestion {
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

      await this.questionRepository.save(question);
      return question;
    });
  }
}
