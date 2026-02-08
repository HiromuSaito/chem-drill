import type { Question } from "./Question.js";
import type { QuestionId } from "./QuestionId.js";

export interface QuestionRepository {
  save(question: Question): Promise<Question>;
  delete(id: QuestionId): Promise<number>;
}
