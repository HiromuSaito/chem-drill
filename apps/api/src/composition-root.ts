import { db } from "./infrastructure/db/client.js";
import { DrizzleUnitOfWork } from "./infrastructure/db/drizzle-unit-of-work.js";
import { DrizzleQuestionQueryService } from "./infrastructure/question/drizzle-question-query-service.js";
import { DrizzleQuestionRepository } from "./infrastructure/question/drizzle-question-repository.js";
import { DrizzleCategoryQueryService } from "./infrastructure/category/drizzle-category-query-service.js";
import { DrizzleCategoryRepository } from "./infrastructure/category/drizzle-category-repository.js";
import { GeminiQuestionGenerationAdapter } from "./infrastructure/question-generation/gemini-question-generation-adapter.js";
import { GetRandomQuestionsUseCase } from "./application/question/get-random-questions-use-case.js";
import { CreateQuestionUseCase } from "./application/question/create-question-use-case.js";
import { ListCategoriesUseCase } from "./application/category/list-categories-use-case.js";
import { CreateCategoryUseCase } from "./application/category/create-category-use-case.js";
import { CreateQuestionProposalUseCase } from "./application/question-proposal/create-question-proposal-use-case.js";
import { UpdateQuestionProposalUseCase } from "./application/question-proposal/update-question-proposal-use-case.js";
import { ApproveQuestionProposalUseCase } from "./application/question-proposal/approve-question-proposal-use-case.js";
import { RejectQuestionProposalUseCase } from "./application/question-proposal/reject-question-proposal-use-case.js";
import { GenerateQuestionProposalsUseCase } from "./application/question-proposal/generate-question-proposals-use-case.js";
import { ListQuestionProposalsUseCase } from "./application/question-proposal/list-question-proposals-use-case.js";
import { GetQuestionProposalUseCase } from "./application/question-proposal/get-question-proposal-use-case.js";
import { DrizzleQuestionProposalRepository } from "./infrastructure/question-proposal/drizzle-question-proposal-repository.js";
import { DrizzleQuestionProposalListQueryService } from "./infrastructure/question-proposal/drizzle-question-proposal-list-query-service.js";
import { DrizzleUserQueryService } from "./infrastructure/user/drizzle-user-query-service.js";
import { CheckUsernameAvailabilityUseCase } from "./application/user/check-username-availability-use-case.js";
import { CategoryNameDuplicateChecker } from "./domain/category/category-name-duplicate-checker.js";
import { requireEnv } from "./env.js";

// UnitOfWork
const unitOfWork = new DrizzleUnitOfWork(db);

// クエリサービス & リポジトリ
const questionQueryService = new DrizzleQuestionQueryService();
const questionRepository = new DrizzleQuestionRepository();
const categoryQueryService = new DrizzleCategoryQueryService();
const categoryRepository = new DrizzleCategoryRepository();
const questionProposalRepository = new DrizzleQuestionProposalRepository();
const questionProposalListQueryService =
  new DrizzleQuestionProposalListQueryService();
const userQueryService = new DrizzleUserQueryService();

// ドメインサービス
const categoryNameDuplicateChecker = new CategoryNameDuplicateChecker(
  categoryQueryService,
);

// 外部サービスアダプター（API キーは初回呼び出し時に遅延取得）
const questionGenerationAdapter = new GeminiQuestionGenerationAdapter(() =>
  requireEnv("GEMINI_API_KEY"),
);

// ユースケース
const getRandomQuestions = new GetRandomQuestionsUseCase(
  unitOfWork,
  questionQueryService,
);
const createQuestion = new CreateQuestionUseCase(
  unitOfWork,
  questionRepository,
);
const createQuestionProposal = new CreateQuestionProposalUseCase(
  unitOfWork,
  questionProposalRepository,
);
const updateQuestionProposal = new UpdateQuestionProposalUseCase(
  unitOfWork,
  questionProposalRepository,
);
const approveQuestionProposal = new ApproveQuestionProposalUseCase(
  unitOfWork,
  questionProposalRepository,
);
const rejectQuestionProposal = new RejectQuestionProposalUseCase(
  unitOfWork,
  questionProposalRepository,
);
const listCategories = new ListCategoriesUseCase(
  unitOfWork,
  categoryQueryService,
);
const createCategory = new CreateCategoryUseCase(
  unitOfWork,
  categoryRepository,
  categoryNameDuplicateChecker,
);
const generateQuestionProposals = new GenerateQuestionProposalsUseCase(
  unitOfWork,
  questionGenerationAdapter,
  questionProposalRepository,
);

const listQuestionProposals = new ListQuestionProposalsUseCase(
  unitOfWork,
  questionProposalListQueryService,
);
const getQuestionProposal = new GetQuestionProposalUseCase(
  unitOfWork,
  questionProposalListQueryService,
);

const checkUsernameAvailability = new CheckUsernameAvailabilityUseCase(
  unitOfWork,
  userQueryService,
);

export const dependencies = {
  checkUsernameAvailability,
  getRandomQuestions,
  createQuestion,
  createQuestionProposal,
  updateQuestionProposal,
  approveQuestionProposal,
  rejectQuestionProposal,
  listQuestionProposals,
  getQuestionProposal,
  listCategories,
  createCategory,
  generateQuestionProposals,
};

export type Dependencies = typeof dependencies;
