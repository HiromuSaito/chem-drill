import { db } from "./infrastructure/db/client.js";
import { DrizzleUnitOfWork } from "./infrastructure/db/DrizzleUnitOfWork.js";
import { DrizzleQuestionQueryService } from "./infrastructure/question/DrizzleQuestionQueryService.js";
import { DrizzleQuestionRepository } from "./infrastructure/question/DrizzleQuestionRepository.js";
import { GetRandomQuestionsUseCase } from "./application/question/getRandomQuestionsUseCase.js";
import { CreateQuestionUseCase } from "./application/question/createQuestionUseCase.js";

// UnitOfWork
const unitOfWork = new DrizzleUnitOfWork(db);

// クエリサービス & リポジトリ
const questionQueryService = new DrizzleQuestionQueryService();
const questionRepository = new DrizzleQuestionRepository();

// ユースケース
const getRandomQuestions = new GetRandomQuestionsUseCase(
  unitOfWork,
  questionQueryService,
);
const createQuestion = new CreateQuestionUseCase(
  unitOfWork,
  questionRepository,
);

export const dependencies = {
  getRandomQuestions,
  createQuestion,
};

export type Dependencies = typeof dependencies;
