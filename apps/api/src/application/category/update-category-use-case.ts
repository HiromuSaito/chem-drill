import { Id } from "../../domain/shared/id.ts";
import { CategoryName } from "../../domain/category/value-object/category-name.ts";
import { EntityNotFoundError } from "../../domain/shared/errors.ts";
import type { CategoryNameDuplicateChecker } from "../../domain/category/service/category-name-duplicate-checker.ts";
import type { CategoryRepository } from "../../domain/category/repository/category-repository.ts";
import type { Category } from "../../domain/category/entity/category.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

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
