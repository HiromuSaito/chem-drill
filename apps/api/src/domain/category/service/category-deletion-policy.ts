import { ConflictError } from "../../shared/errors.ts";
import type { CategoryId } from "../entity/category.ts";
import type { CategoryQueryService } from "../query-service/category-query-service.ts";

export class CategoryDeletionPolicy {
  constructor(private queryService: CategoryQueryService) {}

  async ensureDeletable(id: CategoryId): Promise<void> {
    const hasRelated = await this.queryService.hasRelatedData(id);
    if (hasRelated) {
      throw new ConflictError(
        "関連する問題または出題案が存在するため、カテゴリを削除できません",
      );
    }
  }
}
