import type { Id } from "../../shared/id.ts";
import { CategoryName } from "../value-object/category-name.ts";

export type CategoryId = Id<Category>;

export class Category {
  private constructor(
    readonly id: CategoryId,
    readonly name: CategoryName,
  ) {}

  static create(params: { id: CategoryId; name: CategoryName }): Category {
    return new Category(params.id, params.name);
  }

  changeName(newName: CategoryName): Category {
    return new Category(this.id, newName);
  }

  equals(other: Category): boolean {
    return this.id === other.id;
  }
}
