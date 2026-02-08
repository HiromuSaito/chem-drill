import type { Question } from "./Question.js";

export interface QuestionRepository {
  findRandom(limit: number): Promise<Question[]>;
}
