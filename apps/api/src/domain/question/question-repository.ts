import type { Transaction } from "../../infrastructure/db/client.js";
import type { Question } from "./question.js";
import type { QuestionId } from "./question-id.js";

export interface QuestionRepository {
  save(tx: Transaction, question: Question): Promise<Question>;
  delete(tx: Transaction, id: QuestionId): Promise<number>;
}
