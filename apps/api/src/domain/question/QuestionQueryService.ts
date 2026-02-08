import type { Transaction } from "../../infrastructure/db/client.js";

export type QuestionWithCategory = {
  id: string;
  text: string;
  difficulty: string;
  choices: string[];
  correctIndexes: number[];
  explanation: string;
  category: {
    categoryId: string;
    categoryName: string;
  };
};

export interface QuestionQueryService {
  findRandom(tx: Transaction, limit: number): Promise<QuestionWithCategory[]>;
}
