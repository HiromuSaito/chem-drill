import { db } from "./infrastructure/db/client.js";
import { DrizzleQuestionQueryService } from "./infrastructure/question/DrizzleQuestionQueryService.js";
import { DrizzleQuestionRepository } from "./infrastructure/question/DrizzleQuestionRepository.js";
import { getRandomQuestionsUseCase } from "./application/question/getRandomQuestionsUseCase.js";
import {
  createQuestionUseCase,
  type CreateQuestionInput,
} from "./application/question/createQuestionUseCase.js";

// クエリサービス & リポジトリ
const questionQueryService = new DrizzleQuestionQueryService(db);
const questionRepository = new DrizzleQuestionRepository(db);

// ユースケース（依存関係を束縛）
const getRandomQuestions = () =>
  getRandomQuestionsUseCase(questionQueryService);
const createQuestion = (input: CreateQuestionInput) =>
  createQuestionUseCase(questionRepository, input);

export const dependencies = {
  getRandomQuestions,
  createQuestion,
};

export type Dependencies = typeof dependencies;
