import type {
  CategoryQueryService,
  CategoryDto,
} from "../../domain/category/category-query-service.js";
import type { UnitOfWork } from "../unit-of-work.js";

export class ListCategoriesUseCase {
  constructor(
    private uow: UnitOfWork,
    private categoryQueryService: CategoryQueryService,
  ) {}

  async execute(): Promise<CategoryDto[]> {
    return this.uow.run(async (tx) => {
      return await this.categoryQueryService.findAll(tx);
    });
  }
}
