import { Id } from "../../domain/id.js";
import { EntityNotFoundError } from "../../domain/errors.js";
import type { CategoryDeletionPolicy } from "../../domain/category/category-deletion-policy.js";
import type { CategoryRepository } from "../../domain/category/category-repository.js";
import type { Category } from "../../domain/category/category.js";
import type { UnitOfWork } from "../unit-of-work.js";

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
