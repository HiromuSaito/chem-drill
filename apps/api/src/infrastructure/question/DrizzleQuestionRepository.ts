import { eq } from "drizzle-orm";
import type { Transaction } from "../db/client.js";
import { questions } from "../db/schema.js";
import { Id } from "../../domain/Id.js";
import type { Category } from "../../domain/category/Category.js";
import { Question } from "../../domain/question/Question.js";
import type { QuestionId } from "../../domain/question/QuestionId.js";
import { QuestionText } from "../../domain/question/QuestionText.js";
import {
  Difficulty,
  type DifficultyLevel,
} from "../../domain/question/Difficulty.js";
import { CorrectIndexes } from "../../domain/question/CorrectIndexes.js";
import { Explanation } from "../../domain/question/Explanation.js";
import type { QuestionRepository } from "../../domain/question/QuestionRepository.js";

export class DrizzleQuestionRepository implements QuestionRepository {
  async save(tx: Transaction, question: Question): Promise<Question> {
    const [row] = await tx
      .insert(questions)
      .values({
        id: question.id,
        text: question.text.value,
        difficulty: question.difficulty.value as DifficultyLevel,
        choices: [...question.choices],
        correctIndexes: [...question.correctIndexes.values],
        explanation: question.explanation.value,
        categoryId: question.categoryId,
      })
      .onConflictDoUpdate({
        target: questions.id,
        set: {
          text: question.text.value,
          difficulty: question.difficulty.value as DifficultyLevel,
          choices: [...question.choices],
          correctIndexes: [...question.correctIndexes.values],
          explanation: question.explanation.value,
          categoryId: question.categoryId,
          updatedAt: new Date(),
        },
      })
      .returning();

    return Question.create({
      id: Id.of<Question>(row.id),
      text: QuestionText.create(row.text),
      difficulty: Difficulty.create(row.difficulty),
      choices: row.choices as string[],
      correctIndexes: CorrectIndexes.create(row.correctIndexes),
      explanation: Explanation.create(row.explanation),
      categoryId: Id.of<Category>(row.categoryId),
    });
  }

  async delete(tx: Transaction, id: QuestionId): Promise<number> {
    const deleted = await tx
      .delete(questions)
      .where(eq(questions.id, id))
      .returning({ id: questions.id });
    return deleted.length;
  }
}
