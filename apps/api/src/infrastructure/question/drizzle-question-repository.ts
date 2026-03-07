import { eq } from "drizzle-orm";
import { questions } from "../db/schema.ts";
import { getCurrentTransaction } from "../db/transaction-context.ts";
import type { DifficultyLevel } from "../../domain/shared/value-object/difficulty.ts";
import type {
  Question,
  QuestionId,
} from "../../domain/question/entity/question.ts";
import type { QuestionRepository } from "../../domain/question/repository/question-repository.ts";

export class DrizzleQuestionRepository implements QuestionRepository {
  async save(question: Question): Promise<void> {
    const tx = getCurrentTransaction();
    await tx
      .insert(questions)
      .values({
        id: question.id,
        text: question.text.value,
        difficulty: question.difficulty.value as DifficultyLevel,
        choices: [...question.choices],
        correctIndexes: [...question.correctIndexes.values],
        explanation: question.explanation.value,
        categoryId: question.categoryId,
        userId: question.userId ?? null,
        isPublished: question.isPublished,
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
          userId: question.userId ?? null,
          isPublished: question.isPublished,
          updatedAt: new Date(),
        },
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

  async unpublish(id: QuestionId): Promise<void> {
    const tx = getCurrentTransaction();
    await tx
      .update(questions)
      .set({ isPublished: false, updatedAt: new Date() })
      .where(eq(questions.id, id));
  }
}
