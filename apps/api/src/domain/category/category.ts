import type { CategoryId } from "./category-id.js";
import { CategoryName } from "./category-name.js";

export class Category {
  private constructor(
    readonly id: CategoryId,
    readonly name: CategoryName,
  ) {}

  static create(params: { id: CategoryId; name: CategoryName }): Category {
    return new Category(params.id, params.name);
  }

  equals(other: Category): boolean {
    return this.id === other.id;
  }
}
