import { Id } from "../../domain/Id.js";
import type { Category } from "../../domain/category/Category.js";
import { Question } from "../../domain/question/Question.js";
import { QuestionText } from "../../domain/question/QuestionText.js";
import { Difficulty } from "../../domain/question/Difficulty.js";
import { CorrectIndexes } from "../../domain/question/CorrectIndexes.js";
import { Explanation } from "../../domain/question/Explanation.js";
import type { QuestionRepository } from "../../domain/question/QuestionRepository.js";
import type { UnitOfWork } from "../UnitOfWork.js";

export type CreateQuestionInput = {
  text: string;
  difficulty: string;
  choices: string[];
  correctIndexes: number[];
  explanation: string;
  categoryId: string;
};

export async function createQuestionUseCase(
  uow: UnitOfWork,
  questionRepository: QuestionRepository,
  input: CreateQuestionInput,
): Promise<Question> {
  return uow.run(async (tx) => {
    const question = Question.create({
      id: Id.random<Question>(),
      text: QuestionText.create(input.text),
      difficulty: Difficulty.create(input.difficulty),
      choices: input.choices,
      correctIndexes: CorrectIndexes.create(input.correctIndexes),
      explanation: Explanation.create(input.explanation),
      categoryId: Id.of<Category>(input.categoryId),
    });

    return await questionRepository.save(tx, question);
  });
}
