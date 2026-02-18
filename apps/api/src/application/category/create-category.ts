import { Id } from "../../domain/shared/id.ts";
import { Category } from "../../domain/category/entity/category.ts";
import { CategoryName } from "../../domain/category/value-object/category-name.ts";
import type { CategoryNameDuplicateChecker } from "../../domain/category/service/category-name-duplicate-checker.ts";
import type { CategoryRepository } from "../../domain/category/repository/category-repository.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export type CreateCategoryInput = {
  name: string;
};

export class CreateCategory {
  constructor(
    private uow: UnitOfWork,
    private categoryRepository: CategoryRepository,
    private duplicateChecker: CategoryNameDuplicateChecker,
  ) {}

  async execute(input: CreateCategoryInput): Promise<Category> {
    return this.uow.run(async () => {
      const name = CategoryName.create(input.name);
      await this.duplicateChecker.ensure(name);

      const category = Category.create({
        id: Id.random<Category>(),
        name,
      });

      await this.categoryRepository.save(category);
      return category;
    });
  }
}
