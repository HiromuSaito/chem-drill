import { Id } from "../../domain/id.js";
import { Category } from "../../domain/category/category.js";
import { CategoryName } from "../../domain/category/category-name.js";
import type { CategoryRepository } from "../../domain/category/category-repository.js";
import type { UnitOfWork } from "../unit-of-work.js";

export type CreateCategoryInput = {
  name: string;
};

export class CreateCategoryUseCase {
  constructor(
    private uow: UnitOfWork,
    private categoryRepository: CategoryRepository,
  ) {}

  async execute(input: CreateCategoryInput): Promise<Category> {
    return this.uow.run(async () => {
      const category = Category.create({
        id: Id.random<Category>(),
        name: CategoryName.create(input.name),
      });

      await this.categoryRepository.save(category);
      return category;
    });
  }
}
