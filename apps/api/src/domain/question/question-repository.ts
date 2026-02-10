import type { Question } from "./question.js";
import type { QuestionId } from "./question-id.js";

export interface QuestionRepository {
  save(question: Question): Promise<Question>;
  delete(id: QuestionId): Promise<number>;
}
