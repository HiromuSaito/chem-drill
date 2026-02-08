import type { Transaction } from "../../infrastructure/db/client.js";
import type { Question } from "./Question.js";
import type { QuestionId } from "./QuestionId.js";

export interface QuestionRepository {
  save(tx: Transaction, question: Question): Promise<Question>;
  delete(tx: Transaction, id: QuestionId): Promise<number>;
}
