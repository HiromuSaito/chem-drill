import { eq } from "drizzle-orm";
import { questions } from "../db/schema.ts";
import { getCurrentTransaction } from "../db/transaction-context.ts";
import { Id } from "../../domain/shared/id.ts";
import type { Category } from "../../domain/category/entity/category.ts";
import { Question } from "../../domain/question/entity/question.ts";
import type { QuestionId } from "../../domain/question/entity/question.ts";
import { QuestionText } from "../../domain/shared/value-object/question-text.ts";
import {
  Difficulty,
  type DifficultyLevel,
} from "../../domain/shared/value-object/difficulty.ts";
import { CorrectIndexes } from "../../domain/shared/value-object/correct-indexes.ts";
import { Explanation } from "../../domain/shared/value-object/explanation.ts";
import type { QuestionRepository } from "../../domain/question/repository/question-repository.ts";

export class DrizzleQuestionRepository implements QuestionRepository {
  async save(question: Question): Promise<Question> {
    const tx = getCurrentTransaction();
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

  async delete(id: QuestionId): Promise<number> {
    const tx = getCurrentTransaction();
    const deleted = await tx
      .delete(questions)
      .where(eq(questions.id, id))
      .returning({ id: questions.id });
    return deleted.length;
  }
}
