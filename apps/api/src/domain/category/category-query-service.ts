import type { Transaction } from "../../infrastructure/db/client.js";

export type CategoryDto = {
  id: string;
  name: string;
};

export interface CategoryQueryService {
  findAll(tx: Transaction): Promise<CategoryDto[]>;
}
