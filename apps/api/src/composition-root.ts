import { db } from "./infrastructure/db/client.js";
import { DrizzleUnitOfWork } from "./infrastructure/db/DrizzleUnitOfWork.js";
import { DrizzleQuestionQueryService } from "./infrastructure/question/DrizzleQuestionQueryService.js";
import { DrizzleQuestionRepository } from "./infrastructure/question/DrizzleQuestionRepository.js";
import { getRandomQuestionsUseCase } from "./application/question/getRandomQuestionsUseCase.js";
import {
  createQuestionUseCase,
  type CreateQuestionInput,
} from "./application/question/createQuestionUseCase.js";

// UnitOfWork
const unitOfWork = new DrizzleUnitOfWork(db);

// クエリサービス & リポジトリ
const questionQueryService = new DrizzleQuestionQueryService();
const questionRepository = new DrizzleQuestionRepository();

// ユースケース（依存関係を束縛）
const getRandomQuestions = () =>
  getRandomQuestionsUseCase(unitOfWork, questionQueryService);
const createQuestion = (input: CreateQuestionInput) =>
  createQuestionUseCase(unitOfWork, questionRepository, input);

export const dependencies = {
  getRandomQuestions,
  createQuestion,
};

export type Dependencies = typeof dependencies;
