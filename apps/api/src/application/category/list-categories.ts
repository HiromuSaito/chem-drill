import type {
  CategoryQueryService,
  CategoryDto,
} from "../../domain/category/query-service/category-query-service.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export class ListCategories {
  constructor(
    private uow: UnitOfWork,
    private categoryQueryService: CategoryQueryService,
  ) {}

  async execute(): Promise<CategoryDto[]> {
    return this.uow.run(async () => {
      return await this.categoryQueryService.findAll();
    });
  }
}
