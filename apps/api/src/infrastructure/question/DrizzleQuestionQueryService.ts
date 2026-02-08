import { eq, sql } from "drizzle-orm";
import { questions, categories } from "../db/schema.js";
import {
  QuestionQueryService,
  QuestionWithCategory,
} from "../../domain/question/QuestionQueryService.js";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

export class DrizzleQuestionQueryService implements QuestionQueryService {
  constructor(private readonly db: NodePgDatabase) {}

  async findRandom(limit: number): Promise<QuestionWithCategory[]> {
    const rows = await this.db
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
      categoryId: row.categoryId,
      categoryName: row.categoryName,
    }));
  }
}
