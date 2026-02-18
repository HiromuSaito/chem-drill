import { db } from "./infrastructure/db/client.ts";
import { DrizzleUnitOfWork } from "./infrastructure/db/drizzle-unit-of-work.ts";
import { DrizzleQuestionQueryService } from "./infrastructure/question/drizzle-question-query-service.ts";
import { DrizzleQuestionRepository } from "./infrastructure/question/drizzle-question-repository.ts";
import { DrizzleCategoryQueryService } from "./infrastructure/category/drizzle-category-query-service.ts";
import { DrizzleCategoryRepository } from "./infrastructure/category/drizzle-category-repository.ts";
import { GeminiQuestionGenerationAdapter } from "./infrastructure/question-generation/gemini-question-generation-adapter.ts";
import { GetRandomQuestionsUseCase } from "./application/question/get-random-questions-use-case.ts";
import { CreateQuestionUseCase } from "./application/question/create-question-use-case.ts";
import { ListCategoriesUseCase } from "./application/category/list-categories-use-case.ts";
import { CreateCategoryUseCase } from "./application/category/create-category-use-case.ts";
import { UpdateCategoryUseCase } from "./application/category/update-category-use-case.ts";
import { DeleteCategoryUseCase } from "./application/category/delete-category-use-case.ts";
import { CreateQuestionProposalUseCase } from "./application/question-proposal/create-question-proposal-use-case.ts";
import { UpdateQuestionProposalUseCase } from "./application/question-proposal/update-question-proposal-use-case.ts";
import { ApproveQuestionProposalUseCase } from "./application/question-proposal/approve-question-proposal-use-case.ts";
import { RejectQuestionProposalUseCase } from "./application/question-proposal/reject-question-proposal-use-case.ts";
import { GenerateQuestionProposalsUseCase } from "./application/question-proposal/generate-question-proposals-use-case.ts";
import { ListQuestionProposalsUseCase } from "./application/question-proposal/list-question-proposals-use-case.ts";
import { GetQuestionProposalUseCase } from "./application/question-proposal/get-question-proposal-use-case.ts";
import { DrizzleQuestionProposalRepository } from "./infrastructure/question-proposal/drizzle-question-proposal-repository.ts";
import { DrizzleQuestionProposalListQueryService } from "./infrastructure/question-proposal/drizzle-question-proposal-list-query-service.ts";
import { DrizzleUserQueryService } from "./infrastructure/user/drizzle-user-query-service.ts";
import { CheckUsernameAvailabilityUseCase } from "./application/user/check-username-availability-use-case.ts";
import { CategoryNameDuplicateChecker } from "./domain/category/service/category-name-duplicate-checker.ts";
import { CategoryDeletionPolicy } from "./domain/category/service/category-deletion-policy.ts";
import { requireEnv } from "./env.ts";

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
const categoryDeletionPolicy = new CategoryDeletionPolicy(categoryQueryService);

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
const updateCategory = new UpdateCategoryUseCase(
  unitOfWork,
  categoryRepository,
  categoryNameDuplicateChecker,
);
const deleteCategory = new DeleteCategoryUseCase(
  unitOfWork,
  categoryRepository,
  categoryDeletionPolicy,
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
  updateCategory,
  deleteCategory,
  generateQuestionProposals,
};

export type Dependencies = typeof dependencies;
