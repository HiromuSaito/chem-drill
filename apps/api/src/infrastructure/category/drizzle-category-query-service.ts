import { eq, count, sql } from "drizzle-orm";
import {
  categories,
  questions,
  questionProposalProjections,
} from "../db/schema.ts";
import { getCurrentTransaction } from "../db/transaction-context.ts";
import type {
  CategoryQueryService,
  CategoryDto,
} from "../../domain/category/query-service/category-query-service.ts";
import type { CategoryId } from "../../domain/category/entity/category.ts";
import type { CategoryName } from "../../domain/category/value-object/category-name.ts";

export class DrizzleCategoryQueryService implements CategoryQueryService {
  async findAll(): Promise<CategoryDto[]> {
    const tx = getCurrentTransaction();

    const qCount = tx
      .select({
        categoryId: questions.categoryId,
        cnt: count(questions.id).as("question_cnt"),
      })
      .from(questions)
      .groupBy(questions.categoryId)
      .as("q_count");

    const pCount = tx
      .select({
        categoryId: questionProposalProjections.categoryId,
        cnt: count(questionProposalProjections.questionProposalId).as(
          "proposal_cnt",
        ),
      })
      .from(questionProposalProjections)
      .groupBy(questionProposalProjections.categoryId)
      .as("p_count");

    const rows = await tx
      .select({
        id: categories.id,
        name: categories.name,
        questionCount: sql<number>`coalesce(${qCount.cnt}, 0)`,
        proposalCount: sql<number>`coalesce(${pCount.cnt}, 0)`,
      })
      .from(categories)
      .leftJoin(qCount, eq(categories.id, qCount.categoryId))
      .leftJoin(pCount, eq(categories.id, pCount.categoryId));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      questionCount: Number(row.questionCount),
      proposalCount: Number(row.proposalCount),
    }));
  }

  async existsByName(name: CategoryName): Promise<boolean> {
    const tx = getCurrentTransaction();
    const rows = await tx
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.name, name.value))
      .limit(1);
    return rows.length > 0;
  }

  async hasRelatedData(id: CategoryId): Promise<boolean> {
    const tx = getCurrentTransaction();

    const questionRows = await tx
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.categoryId, id))
      .limit(1);
    if (questionRows.length > 0) return true;

    const proposalRows = await tx
      .select({
        questionProposalId: questionProposalProjections.questionProposalId,
      })
      .from(questionProposalProjections)
      .where(eq(questionProposalProjections.categoryId, id))
      .limit(1);
    return proposalRows.length > 0;
  }
}
