import type { Question, QuestionId } from "../entity/question.ts";

export interface QuestionRepository {
  save(question: Question): Promise<Question>;
  delete(id: QuestionId): Promise<number>;
}
