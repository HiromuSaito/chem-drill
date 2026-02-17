import { ConflictError } from "../errors.js";
import type { CategoryId } from "./category-id.js";
import type { CategoryQueryService } from "./category-query-service.js";

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
