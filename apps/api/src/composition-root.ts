import { db } from "./infrastructure/db/client.ts";
import { DrizzleUnitOfWork } from "./infrastructure/db/drizzle-unit-of-work.ts";
import { DrizzleQuestionQueryService } from "./infrastructure/question/drizzle-question-query-service.ts";
import { DrizzleQuestionRepository } from "./infrastructure/question/drizzle-question-repository.ts";
import { DrizzleCategoryQueryService } from "./infrastructure/category/drizzle-category-query-service.ts";
import { DrizzleCategoryRepository } from "./infrastructure/category/drizzle-category-repository.ts";
import { GeminiQuestionGenerationAdapter } from "./infrastructure/question-generation/gemini-question-generation-adapter.ts";
import { GetRandomQuestions } from "./application/question/get-random-questions.ts";
import { ListQuestions } from "./application/question/list-questions.ts";
import { GetQuestion } from "./application/question/get-question.ts";
import { ListCategories } from "./application/category/list-categories.ts";
import { CreateCategory } from "./application/category/create-category.ts";
import { UpdateCategory } from "./application/category/update-category.ts";
import { DeleteCategory } from "./application/category/delete-category.ts";
import { CreateQuestionProposal } from "./application/question-proposal/create-question-proposal.ts";
import { UpdateQuestionProposalByAdmin } from "./application/question-proposal/update-question-proposal-by-admin.ts";
import { ApproveQuestionProposal } from "./application/question-proposal/approve-question-proposal.ts";
import { RejectQuestionProposal } from "./application/question-proposal/reject-question-proposal.ts";
import { SubmitQuestionProposalByAdmin } from "./application/question-proposal/submit-question-proposal-by-admin.ts";
import { WithdrawQuestionProposal } from "./application/question-proposal/withdraw-question-proposal.ts";
import { UpdateApprovedQuestionProposal } from "./application/question-proposal/update-approved-question-proposal.ts";
import { GenerateCandidates } from "./application/question-proposal/generate-candidates.ts";
import { BulkCreateQuestionProposals } from "./application/question-proposal/bulk-create-question-proposals.ts";
import { ListQuestionProposals } from "./application/question-proposal/list-question-proposals.ts";
import { GetQuestionProposalByAdmin } from "./application/question-proposal/get-question-proposal-by-admin.ts";
import { GetQuestionProposalByUser } from "./application/question-proposal/get-question-proposal-by-user.ts";
import { UpdateQuestionProposalByUser } from "./application/question-proposal/update-question-proposal-by-user.ts";
import { SubmitQuestionProposalByUser } from "./application/question-proposal/submit-question-proposal-by-user.ts";
import { ListQuestionProposalsByUserId } from "./application/question-proposal/list-question-proposals-by-user-id.ts";
import { DrizzleQuestionProposalRepository } from "./infrastructure/question-proposal/drizzle-question-proposal-repository.ts";
import { DrizzleQuestionProposalProjectionQueryService } from "./infrastructure/question-proposal/drizzle-question-proposal-projection-query-service.ts";
import { DrizzleUserQueryService } from "./infrastructure/user/drizzle-user-query-service.ts";
import { CheckUsernameAvailability } from "./application/user/check-username-availability.ts";
import { CheckEmailRegistered } from "./application/user/check-email-registered.ts";
import { ListUsers } from "./application/user/list-users.ts";
import { GetUser } from "./application/user/get-user.ts";
import { CategoryNameDuplicateChecker } from "./domain/category/service/category-name-duplicate-checker.ts";
import { CategoryDeletionPolicy } from "./domain/category/service/category-deletion-policy.ts";
import { OnQuestionProposalApproved } from "./application/question-proposal/event-handler/on-question-proposal-approved.ts";
import { OnQuestionProposalApprovedEdited } from "./application/question-proposal/event-handler/on-question-proposal-approved-edited.ts";
import { OnQuestionProposalWithdrawn } from "./application/question-proposal/event-handler/on-question-proposal-withdrawn.ts";
import { InMemoryEventPublisher } from "./infrastructure/event/in-memory-event-publisher.ts";
import { DrizzleDrillSessionRepository } from "./infrastructure/drill-session/drizzle-drill-session-repository.ts";
import { DrizzleDrillStatsQueryService } from "./infrastructure/drill-session/drizzle-drill-stats-query-service.ts";
import { SaveDrillSession } from "./application/drill-session/save-drill-session.ts";
import { GetDrillStats } from "./application/drill-session/get-drill-stats.ts";
import { GetRecentSessions } from "./application/drill-session/get-recent-sessions.ts";
import { GetCategoryScores } from "./application/drill-session/get-category-scores.ts";
import { DrizzleUserExperienceRepository } from "./infrastructure/user-experience/drizzle-user-experience-repository.ts";
import { DrizzleUserExperienceQueryService } from "./infrastructure/user-experience/drizzle-user-experience-query-service.ts";
import { AddExperience } from "./application/user-experience/add-experience.ts";
import { GetUserRankInfo } from "./application/user-experience/get-user-rank-info.ts";
import { GetPendingRankUps } from "./application/user-experience/get-pending-rank-ups.ts";
import { MarkRankUpDisplayed } from "./application/user-experience/mark-rank-up-displayed.ts";
import { S3IconStorage } from "./infrastructure/storage/s3-icon-storage.ts";
import { SharpIconProcessor } from "./infrastructure/storage/sharp-icon-processor.ts";
import { UploadIcon } from "./application/user/upload-icon.ts";
import { DeleteIcon } from "./application/user/delete-icon.ts";
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
const drillSessionRepository = new DrizzleDrillSessionRepository();
const drillStatsQueryService = new DrizzleDrillStatsQueryService();
const userExperienceRepository = new DrizzleUserExperienceRepository();
const userExperienceQueryService = new DrizzleUserExperienceQueryService();
// イベントパブリッシャー & ハンドラ
const eventPublisher = new InMemoryEventPublisher(consoleLogger);
const onQuestionProposalApproved = new OnQuestionProposalApproved(
  unitOfWork,
  questionProposalProjectionQueryService,
  questionRepository,
  questionProposalRepository,
);
const onQuestionProposalApprovedEdited = new OnQuestionProposalApprovedEdited(
  unitOfWork,
  questionProposalProjectionQueryService,
  questionRepository,
);
const onQuestionProposalWithdrawn = new OnQuestionProposalWithdrawn(
  unitOfWork,
  questionProposalProjectionQueryService,
  questionRepository,
);
eventPublisher.register(onQuestionProposalApproved);
eventPublisher.register(onQuestionProposalApprovedEdited);
eventPublisher.register(onQuestionProposalWithdrawn);

// ドメインサービス
const categoryNameDuplicateChecker = new CategoryNameDuplicateChecker(
  categoryQueryService,
);
const categoryDeletionPolicy = new CategoryDeletionPolicy(categoryQueryService);

// 外部サービスアダプター（API キーは初回呼び出し時に遅延取得）
const questionGenerationAdapter = new GeminiQuestionGenerationAdapter(() =>
  requireEnv("GEMINI_API_KEY"),
);

// アイコンストレージ & プロセッサー
const iconStorage = new S3IconStorage(
  () => requireEnv("ICON_BUCKET_NAME"),
  () => process.env.S3_ENDPOINT,
);
const iconProcessor = new SharpIconProcessor();

// ユースケース
const addExperience = new AddExperience(unitOfWork, userExperienceRepository);

const getRandomQuestions = new GetRandomQuestions(
  unitOfWork,
  questionQueryService,
);
const listQuestions = new ListQuestions(unitOfWork, questionQueryService);
const getQuestion = new GetQuestion(unitOfWork, questionQueryService);
const createQuestionProposal = new CreateQuestionProposal(
  unitOfWork,
  questionProposalRepository,
);
const updateQuestionProposalByAdmin = new UpdateQuestionProposalByAdmin(
  unitOfWork,
  questionProposalRepository,
);
const approveQuestionProposal = new ApproveQuestionProposal(
  unitOfWork,
  questionProposalRepository,
  eventPublisher,
  addExperience,
);
const rejectQuestionProposal = new RejectQuestionProposal(
  unitOfWork,
  questionProposalRepository,
);
const submitQuestionProposalByAdmin = new SubmitQuestionProposalByAdmin(
  unitOfWork,
  questionProposalRepository,
  addExperience,
);
const withdrawQuestionProposal = new WithdrawQuestionProposal(
  unitOfWork,
  questionProposalRepository,
  eventPublisher,
);
const updateApprovedQuestionProposal = new UpdateApprovedQuestionProposal(
  unitOfWork,
  questionProposalRepository,
  eventPublisher,
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
const generateCandidates = new GenerateCandidates(questionGenerationAdapter);
const bulkCreateQuestionProposals = new BulkCreateQuestionProposals(
  unitOfWork,
  questionProposalRepository,
);

const listQuestionProposals = new ListQuestionProposals(
  unitOfWork,
  questionProposalProjectionQueryService,
);
const getQuestionProposalByAdmin = new GetQuestionProposalByAdmin(
  unitOfWork,
  questionProposalProjectionQueryService,
);
const getQuestionProposalByUser = new GetQuestionProposalByUser(
  unitOfWork,
  questionProposalProjectionQueryService,
);
const updateQuestionProposalByUser = new UpdateQuestionProposalByUser(
  unitOfWork,
  questionProposalRepository,
);
const submitQuestionProposalByUser = new SubmitQuestionProposalByUser(
  unitOfWork,
  questionProposalRepository,
  addExperience,
);
const listQuestionProposalsByUserId = new ListQuestionProposalsByUserId(
  unitOfWork,
  questionProposalProjectionQueryService,
);

const checkUsernameAvailability = new CheckUsernameAvailability(
  unitOfWork,
  userQueryService,
);
const checkEmailRegistered = new CheckEmailRegistered(
  unitOfWork,
  userQueryService,
);

const listUsers = new ListUsers(unitOfWork, userQueryService);
const getUser = new GetUser(unitOfWork, userQueryService);

const uploadIcon = new UploadIcon(iconStorage, iconProcessor);
const deleteIcon = new DeleteIcon(iconStorage);

const getUserRankInfo = new GetUserRankInfo(
  unitOfWork,
  userExperienceRepository,
);
const getPendingRankUps = new GetPendingRankUps(
  unitOfWork,
  userExperienceQueryService,
);
const markRankUpDisplayed = new MarkRankUpDisplayed(
  unitOfWork,
  userExperienceQueryService,
);

const saveDrillSession = new SaveDrillSession(
  unitOfWork,
  drillSessionRepository,
  addExperience,
);
const getDrillStats = new GetDrillStats(unitOfWork, drillStatsQueryService);
const getRecentSessions = new GetRecentSessions(
  unitOfWork,
  drillStatsQueryService,
);
const getCategoryScores = new GetCategoryScores(
  unitOfWork,
  drillStatsQueryService,
);

export const dependencies = {
  checkUsernameAvailability,
  checkEmailRegistered,
  listUsers,
  getUser,
  uploadIcon,
  deleteIcon,
  getRandomQuestions,
  listQuestions,
  getQuestion,
  createQuestionProposal,
  updateQuestionProposalByAdmin,
  approveQuestionProposal,
  rejectQuestionProposal,
  submitQuestionProposalByAdmin,
  withdrawQuestionProposal,
  updateApprovedQuestionProposal,
  listQuestionProposals,
  getQuestionProposalByAdmin,
  getQuestionProposalByUser,
  updateQuestionProposalByUser,
  submitQuestionProposalByUser,
  listQuestionProposalsByUserId,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  generateCandidates,
  bulkCreateQuestionProposals,
  saveDrillSession,
  getDrillStats,
  getRecentSessions,
  getCategoryScores,
  getUserRankInfo,
  getPendingRankUps,
  markRankUpDisplayed,
};

export type Dependencies = typeof dependencies;
