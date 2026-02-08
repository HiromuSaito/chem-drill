import { sql } from "drizzle-orm";
import type { Database } from "../db/client.js";
import { questions, categories } from "../db/schema.js";
import { Question } from "../../domain/question/Question.js";
import { QuestionId } from "../../domain/question/QuestionId.js";
import { QuestionText } from "../../domain/question/QuestionText.js";
import { Difficulty } from "../../domain/question/Difficulty.js";
import { CorrectIndexes } from "../../domain/question/CorrectIndexes.js";
import { Explanation } from "../../domain/question/Explanation.js";
import { CategoryId } from "../../domain/category/CategoryId.js";
import type { QuestionRepository } from "../../domain/question/QuestionRepository.js";

export class DrizzleQuestionRepository implements QuestionRepository {
  constructor(private readonly db: Database) {}

  async findRandom(limit: number): Promise<Question[]> {
    const rows = await this.db
      .select({
        id: questions.id,
        text: questions.text,
        difficulty: questions.difficulty,
        choices: questions.choices,
        correctIndexes: questions.correctIndexes,
        explanation: questions.explanation,
        categoryId: categories.id,
        categoryName: categories.name,
      })
      .from(questions)
      .orderBy(sql`RANDOM()`)
      .limit(limit);

    return rows.map((row) =>
      Question.create({
        id: QuestionId.create(row.id),
        text: QuestionText.create(row.text),
        difficulty: Difficulty.create(row.difficulty),
        choices: row.choices as string[],
        correctIndexes: CorrectIndexes.create(row.correctIndexes),
        explanation: Explanation.create(row.explanation),
        categoryId: CategoryId.create(row.categoryId),
      }),
    );
  }
}
