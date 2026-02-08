import type { CategoryId } from "./CategoryId.js";
import { CategoryName } from "./CategoryName.js";

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
