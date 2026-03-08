import { and, count, desc, eq, sql } from "drizzle-orm";
import { questions, categories } from "../db/schema.ts";
import { getCurrentTransaction } from "../db/transaction-context.ts";
import type {
  QuestionQueryService,
  QuestionWithCategory,
  QuestionWithCategoryAndDates,
  ListQuestionsResult,
} from "../../domain/question/query-service/question-query-service.ts";

export class DrizzleQuestionQueryService implements QuestionQueryService {
  private get baseSelect() {
    return {
      id: questions.id,
      text: questions.text,
      difficulty: questions.difficulty,
      choices: questions.choices,
      correctIndexes: questions.correctIndexes,
      explanation: questions.explanation,
      categoryId: categories.id,
      categoryName: categories.name,
    };
  }

  private get selectWithDates() {
    return {
      ...this.baseSelect,
      isPublished: questions.isPublished,
      createdAt: questions.createdAt,
      updatedAt: questions.updatedAt,
    };
  }

  private toQuestionWithCategory(row: {
    id: string;
    text: string;
    difficulty: string;
    choices: unknown;
    correctIndexes: number[];
    explanation: string;
    categoryId: string;
    categoryName: string;
  }): QuestionWithCategory {
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
    };
  }

  private toQuestionWithDates(
    row: Parameters<typeof this.toQuestionWithCategory>[0] & {
      isPublished: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
  ): QuestionWithCategoryAndDates {
    return {
      ...this.toQuestionWithCategory(row),
      isPublished: row.isPublished,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findRandom(
    limit: number,
    categoryId?: string,
  ): Promise<QuestionWithCategory[]> {
    const tx = getCurrentTransaction();
    const query = tx
      .select(this.baseSelect)
      .from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .orderBy(sql`RANDOM()`)
      .limit(limit);

    const publishedCondition = eq(questions.isPublished, true);
    const rows = categoryId
      ? await query.where(
          and(publishedCondition, eq(questions.categoryId, categoryId)),
        )
      : await query.where(publishedCondition);

    return rows.map((row) => this.toQuestionWithCategory(row));
  }

  async list(
    categoryId: string | undefined,
    isPublished: boolean | undefined,
    limit: number,
    offset: number,
  ): Promise<ListQuestionsResult> {
    const tx = getCurrentTransaction();

    const categoryCondition = categoryId
      ? eq(questions.categoryId, categoryId)
      : undefined;
    const publishedCondition =
      isPublished !== undefined
        ? eq(questions.isPublished, isPublished)
        : undefined;
    const conditions = and(categoryCondition, publishedCondition);

    const baseQuery = tx
      .select(this.selectWithDates)
      .from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .orderBy(desc(questions.createdAt))
      .limit(limit)
      .offset(offset);

    const countQuery = tx.select({ value: count() }).from(questions);

    const [rows, [{ value: total }]] = await Promise.all([
      conditions ? baseQuery.where(conditions) : baseQuery,
      conditions ? countQuery.where(conditions) : countQuery,
    ]);

    return {
      items: rows.map((row) => this.toQuestionWithDates(row)),
      total,
    };
  }

  async findById(id: string): Promise<QuestionWithCategoryAndDates | null> {
    const tx = getCurrentTransaction();
    const rows = await tx
      .select(this.selectWithDates)
      .from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .where(eq(questions.id, id))
      .limit(1);

    if (rows.length === 0) return null;

    return this.toQuestionWithDates(rows[0]);
  }
}
