import { eq, sql } from "drizzle-orm";
import type { Transaction } from "../db/client.js";
import { questions, categories } from "../db/schema.js";
import type {
  QuestionQueryService,
  QuestionWithCategory,
} from "../../domain/question/QuestionQueryService.js";

export class DrizzleQuestionQueryService implements QuestionQueryService {
  async findRandom(
    tx: Transaction,
    limit: number,
  ): Promise<QuestionWithCategory[]> {
    const rows = await tx
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
