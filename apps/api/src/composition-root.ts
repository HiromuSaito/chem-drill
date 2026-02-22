import { db } from "./infrastructure/db/client.ts";
import { DrizzleUnitOfWork } from "./infrastructure/db/drizzle-unit-of-work.ts";
import { DrizzleQuestionQueryService } from "./infrastructure/question/drizzle-question-query-service.ts";
import { DrizzleQuestionRepository } from "./infrastructure/question/drizzle-question-repository.ts";
import { DrizzleCategoryQueryService } from "./infrastructure/category/drizzle-category-query-service.ts";
import { DrizzleCategoryRepository } from "./infrastructure/category/drizzle-category-repository.ts";
import { GeminiQuestionGenerationAdapter } from "./infrastructure/question-generation/gemini-question-generation-adapter.ts";
import { GetRandomQuestions } from "./application/question/get-random-questions.ts";
import { GetTrialQuestions } from "./application/question/get-trial-questions.ts";
import { CreateQuestion } from "./application/question/create-question.ts";
import { ListCategories } from "./application/category/list-categories.ts";
import { CreateCategory } from "./application/category/create-category.ts";
import { UpdateCategory } from "./application/category/update-category.ts";
import { DeleteCategory } from "./application/category/delete-category.ts";
import { CreateQuestionProposal } from "./application/question-proposal/create-question-proposal.ts";
import { UpdateQuestionProposal } from "./application/question-proposal/update-question-proposal.ts";
import { ApproveQuestionProposal } from "./application/question-proposal/approve-question-proposal.ts";
import { RejectQuestionProposal } from "./application/question-proposal/reject-question-proposal.ts";
import { GenerateQuestionProposals } from "./application/question-proposal/generate-question-proposals.ts";
import { ListQuestionProposals } from "./application/question-proposal/list-question-proposals.ts";
import { GetQuestionProposal } from "./application/question-proposal/get-question-proposal.ts";
import { DrizzleQuestionProposalRepository } from "./infrastructure/question-proposal/drizzle-question-proposal-repository.ts";
import { DrizzleQuestionProposalProjectionQueryService } from "./infrastructure/question-proposal/drizzle-question-proposal-projection-query-service.ts";
import { DrizzleUserQueryService } from "./infrastructure/user/drizzle-user-query-service.ts";
import { CheckUsernameAvailability } from "./application/user/check-username-availability.ts";
import { CategoryNameDuplicateChecker } from "./domain/category/service/category-name-duplicate-checker.ts";
import { CategoryDeletionPolicy } from "./domain/category/service/category-deletion-policy.ts";
import { OnQuestionProposalApproved } from "./application/question-proposal/on-question-proposal-approved.ts";
import { InMemoryEventPublisher } from "./infrastructure/event/in-memory-event-publisher.ts";
import { consoleLogger } from "./lib/logger.ts";
import { requireEnv } from "./env.ts";

// UnitOfWork
const unitOfWork = new DrizzleUnitOfWork(db);

// クエリサービス & リポジトリ
const questionQueryService = new DrizzleQuestionQueryService();
const questionRepository = new DrizzleQuestionRepository();
const categoryQueryService = new DrizzleCategoryQueryService();
const categoryRepository = new DrizzleCategoryRepository();
const questionProposalRepository = new DrizzleQuestionProposalRepository();
const questionProposalProjectionQueryService =
  new DrizzleQuestionProposalProjectionQueryService();
const userQueryService = new DrizzleUserQueryService();
// イベントパブリッシャー & ハンドラ
const eventPublisher = new InMemoryEventPublisher(consoleLogger);
const onQuestionProposalApproved = new OnQuestionProposalApproved(
  unitOfWork,
  questionProposalProjectionQueryService,
  questionRepository,
  questionProposalRepository,
);
eventPublisher.register(onQuestionProposalApproved);

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
const getRandomQuestions = new GetRandomQuestions(
  unitOfWork,
  questionQueryService,
);
const getTrialQuestions = new GetTrialQuestions(
  unitOfWork,
  questionQueryService,
);
const createQuestion = new CreateQuestion(unitOfWork, questionRepository);
const createQuestionProposal = new CreateQuestionProposal(
  unitOfWork,
  questionProposalRepository,
);
const updateQuestionProposal = new UpdateQuestionProposal(
  unitOfWork,
  questionProposalRepository,
);
const approveQuestionProposal = new ApproveQuestionProposal(
  unitOfWork,
  questionProposalRepository,
  eventPublisher,
);
const rejectQuestionProposal = new RejectQuestionProposal(
  unitOfWork,
  questionProposalRepository,
);
const listCategories = new ListCategories(unitOfWork, categoryQueryService);
const createCategory = new CreateCategory(
  unitOfWork,
  categoryRepository,
  categoryNameDuplicateChecker,
);
const updateCategory = new UpdateCategory(
  unitOfWork,
  categoryRepository,
  categoryNameDuplicateChecker,
);
const deleteCategory = new DeleteCategory(
  unitOfWork,
  categoryRepository,
  categoryDeletionPolicy,
);
const generateQuestionProposals = new GenerateQuestionProposals(
  unitOfWork,
  questionGenerationAdapter,
  questionProposalRepository,
);

const listQuestionProposals = new ListQuestionProposals(
  unitOfWork,
  questionProposalProjectionQueryService,
);
const getQuestionProposal = new GetQuestionProposal(
  unitOfWork,
  questionProposalProjectionQueryService,
);

const checkUsernameAvailability = new CheckUsernameAvailability(
  unitOfWork,
  userQueryService,
);

export const dependencies = {
  checkUsernameAvailability,
  getRandomQuestions,
  getTrialQuestions,
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
