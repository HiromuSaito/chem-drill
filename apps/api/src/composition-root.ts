import { db } from "./infrastructure/db/client.js";
import { DrizzleQuestionRepository } from "./infrastructure/question/DrizzleQuestionRepository.js";
import { getRandomQuestionsUseCase } from "./application/question/getRandomQuestionsUseCase.js";

// リポジトリ
const questionRepository = new DrizzleQuestionRepository(db);

// ユースケース（依存関係を束縛）
const getRandomQuestions = () => getRandomQuestionsUseCase(questionRepository);

export const dependencies = {
  getRandomQuestions,
};

export type Dependencies = typeof dependencies;
