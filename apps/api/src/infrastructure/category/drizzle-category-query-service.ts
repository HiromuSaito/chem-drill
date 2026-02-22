import { eq, count } from "drizzle-orm";
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
    const rows = await tx
      .select({
        id: categories.id,
        name: categories.name,
        questionCount: count(questions.id),
      })
      .from(categories)
      .leftJoin(questions, eq(categories.id, questions.categoryId))
      .groupBy(categories.id, categories.name);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      questionCount: Number(row.questionCount),
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
