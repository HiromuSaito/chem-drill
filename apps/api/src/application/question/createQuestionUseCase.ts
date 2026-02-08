import { Question } from "../../domain/question/Question.js";
import { QuestionId } from "../../domain/question/QuestionId.js";
import { QuestionText } from "../../domain/question/QuestionText.js";
import { Difficulty } from "../../domain/question/Difficulty.js";
import { CorrectIndexes } from "../../domain/question/CorrectIndexes.js";
import { Explanation } from "../../domain/question/Explanation.js";
import { CategoryId } from "../../domain/category/CategoryId.js";
import type { QuestionRepository } from "../../domain/question/QuestionRepository.js";

export type CreateQuestionInput = {
  text: string;
  difficulty: string;
  choices: string[];
  correctIndexes: number[];
  explanation: string;
  categoryId: string;
};

export async function createQuestionUseCase(
  questionRepository: QuestionRepository,
  input: CreateQuestionInput,
): Promise<Question> {
  const question = Question.create({
    id: QuestionId.generate(),
    text: QuestionText.create(input.text),
    difficulty: Difficulty.create(input.difficulty),
    choices: input.choices,
    correctIndexes: CorrectIndexes.create(input.correctIndexes),
    explanation: Explanation.create(input.explanation),
    categoryId: CategoryId.create(input.categoryId),
  });

  return await questionRepository.save(question);
}
