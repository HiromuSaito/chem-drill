import { count, desc, eq, sql } from "drizzle-orm";
import { questions, categories } from "../db/schema.ts";
import { getCurrentTransaction } from "../db/transaction-context.ts";
import type {
  QuestionQueryService,
  QuestionWithCategory,
  QuestionWithCategoryAndDates,
  ListQuestionsResult,
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

  async list(
    categoryId: string | undefined,
    limit: number,
    offset: number,
  ): Promise<ListQuestionsResult> {
    const tx = getCurrentTransaction();

    const baseQuery = tx
      .select({
        id: questions.id,
        text: questions.text,
        difficulty: questions.difficulty,
        choices: questions.choices,
        correctIndexes: questions.correctIndexes,
        explanation: questions.explanation,
        categoryId: categories.id,
        categoryName: categories.name,
        createdAt: questions.createdAt,
        updatedAt: questions.updatedAt,
      })
      .from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .orderBy(desc(questions.createdAt))
      .limit(limit)
      .offset(offset);

    const countQuery = tx.select({ value: count() }).from(questions);

    const [rows, [{ value: total }]] = categoryId
      ? await Promise.all([
          baseQuery.where(eq(questions.categoryId, categoryId)),
          countQuery.where(eq(questions.categoryId, categoryId)),
        ])
      : await Promise.all([baseQuery, countQuery]);

    return {
      items: rows.map((row) => ({
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
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      total,
    };
  }

  async findById(id: string): Promise<QuestionWithCategoryAndDates | null> {
    const tx = getCurrentTransaction();
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
        createdAt: questions.createdAt,
        updatedAt: questions.updatedAt,
      })
      .from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .where(eq(questions.id, id))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
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
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
