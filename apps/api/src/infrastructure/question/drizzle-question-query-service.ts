import { eq, sql } from "drizzle-orm";
import { questions, categories } from "../db/schema.ts";
import { getCurrentTransaction } from "../db/transaction-context.ts";
import type {
  QuestionQueryService,
  QuestionWithCategory,
} from "../../domain/question/query-service/question-query-service.ts";

export class DrizzleQuestionQueryService implements QuestionQueryService {
  async findRandom(
    limit: number,
    categoryId?: string,
  ): Promise<QuestionWithCategory[]> {
    const tx = getCurrentTransaction();
    const query = tx
      .select({
        id: questions.id,
        text: questions.text,
        difficulty: questions.difficulty,
        choices: questions.choices,
        correctIndexes: questions.correctIndexes,
        explanation: questions.explanation,
        categoryId: categories.id,
        categoryName: categories.name,
      })
      .from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .orderBy(sql`RANDOM()`)
      .limit(limit);

    const rows = categoryId
      ? await query.where(eq(questions.categoryId, categoryId))
      : await query;

    return rows.map((row) => ({
      id: row.id,
      text: row.text,
      difficulty: row.difficulty,
      choices: row.choices as string[],
      correctIndexes: row.correctIndexes,
      explanation: row.explanation,
      category: {
        categoryId: row.categoryId,
        categoryName: row.categoryName,
      },
    }));
  }
}
