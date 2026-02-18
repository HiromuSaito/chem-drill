import { Id } from "../../domain/shared/id.ts";
import { EntityNotFoundError } from "../../domain/shared/errors.ts";
import type { CategoryDeletionPolicy } from "../../domain/category/service/category-deletion-policy.ts";
import type { CategoryRepository } from "../../domain/category/repository/category-repository.ts";
import type { Category } from "../../domain/category/entity/category.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export class DeleteCategoryUseCase {
  constructor(
    private uow: UnitOfWork,
    private categoryRepository: CategoryRepository,
    private deletionPolicy: CategoryDeletionPolicy,
  ) {}

  async execute(id: string): Promise<void> {
    return this.uow.run(async () => {
      const categoryId = Id.of<Category>(id);
      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        throw new EntityNotFoundError("カテゴリが見つかりません");
      }

      await this.deletionPolicy.ensureDeletable(categoryId);
      await this.categoryRepository.delete(categoryId);
    });
  }
}
