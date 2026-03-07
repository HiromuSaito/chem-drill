import type { Question, QuestionId } from "../entity/question.ts";

export interface QuestionRepository {
  save(question: Question): Promise<void>;
  delete(id: QuestionId): Promise<number>;
  unpublish(id: QuestionId): Promise<void>;
}
