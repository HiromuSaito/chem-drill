import { Id } from "../../domain/id.js";
import { CategoryName } from "../../domain/category/category-name.js";
import { EntityNotFoundError } from "../../domain/errors.js";
import type { CategoryNameDuplicateChecker } from "../../domain/category/category-name-duplicate-checker.js";
import type { CategoryRepository } from "../../domain/category/category-repository.js";
import type { Category } from "../../domain/category/category.js";
import type { UnitOfWork } from "../unit-of-work.js";

export type UpdateCategoryInput = {
  id: string;
  name: string;
};

export class UpdateCategoryUseCase {
  constructor(
    private uow: UnitOfWork,
    private categoryRepository: CategoryRepository,
    private duplicateChecker: CategoryNameDuplicateChecker,
  ) {}

  async execute(input: UpdateCategoryInput): Promise<Category> {
    return this.uow.run(async () => {
      const categoryId = Id.of<Category>(input.id);
      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        throw new EntityNotFoundError("カテゴリが見つかりません");
      }

      const newName = CategoryName.create(input.name);

      if (!category.name.equals(newName)) {
        await this.duplicateChecker.ensure(newName);
      }

      const updated = category.changeName(newName);
      await this.categoryRepository.save(updated);
      return updated;
    });
  }
}
