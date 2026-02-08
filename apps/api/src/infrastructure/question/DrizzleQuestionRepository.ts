import { eq } from "drizzle-orm";
import type { Database } from "../db/client.js";
import { questions } from "../db/schema.js";
import { Question } from "../../domain/question/Question.js";
import { QuestionId } from "../../domain/question/QuestionId.js";
import { QuestionText } from "../../domain/question/QuestionText.js";
import {
  Difficulty,
  type DifficultyLevel,
} from "../../domain/question/Difficulty.js";
import { CorrectIndexes } from "../../domain/question/CorrectIndexes.js";
import { Explanation } from "../../domain/question/Explanation.js";
import { CategoryId } from "../../domain/category/CategoryId.js";
import type { QuestionRepository } from "../../domain/question/QuestionRepository.js";

export class DrizzleQuestionRepository implements QuestionRepository {
  constructor(private readonly db: Database) {}

  async save(question: Question): Promise<Question> {
    const [row] = await this.db
      .insert(questions)
      .values({
        id: question.id.value,
        text: question.text.value,
        difficulty: question.difficulty.value as DifficultyLevel,
        choices: [...question.choices],
        correctIndexes: [...question.correctIndexes.values],
        explanation: question.explanation.value,
        categoryId: question.categoryId.value,
      })
      .onConflictDoUpdate({
        target: questions.id,
        set: {
          text: question.text.value,
          difficulty: question.difficulty.value as DifficultyLevel,
          choices: [...question.choices],
          correctIndexes: [...question.correctIndexes.values],
          explanation: question.explanation.value,
          categoryId: question.categoryId.value,
          updatedAt: new Date(),
        },
      })
      .returning();

    return Question.create({
      id: QuestionId.create(row.id),
      text: QuestionText.create(row.text),
      difficulty: Difficulty.create(row.difficulty),
      choices: row.choices as string[],
      correctIndexes: CorrectIndexes.create(row.correctIndexes),
      explanation: Explanation.create(row.explanation),
      categoryId: CategoryId.create(row.categoryId),
    });
  }

  async delete(id: QuestionId): Promise<number> {
    const deleted = await this.db
      .delete(questions)
      .where(eq(questions.id, id.value))
      .returning({ id: questions.id });
    return deleted.length;
  }
}
