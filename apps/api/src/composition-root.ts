import { db } from "./infrastructure/db/client.js";
import { DrizzleUnitOfWork } from "./infrastructure/db/drizzle-unit-of-work.js";
import { DrizzleQuestionQueryService } from "./infrastructure/question/drizzle-question-query-service.js";
import { DrizzleQuestionRepository } from "./infrastructure/question/drizzle-question-repository.js";
import { GetRandomQuestionsUseCase } from "./application/question/get-random-questions-use-case.js";
import { CreateQuestionUseCase } from "./application/question/create-question-use-case.js";
import { CreateQuestionProposalUseCase } from "./application/question-proposal/create-question-proposal-use-case.js";
import { UpdateQuestionProposalUseCase } from "./application/question-proposal/update-question-proposal-use-case.js";
import { ApproveQuestionProposalUseCase } from "./application/question-proposal/approve-question-proposal-use-case.js";
import { RejectQuestionProposalUseCase } from "./application/question-proposal/reject-question-proposal-use-case.js";
import { DrizzleQuestionProposalRepository } from "./infrastructure/question-proposal/drizzle-question-proposal-repository.js";

// UnitOfWork
const unitOfWork = new DrizzleUnitOfWork(db);

// クエリサービス & リポジトリ
const questionQueryService = new DrizzleQuestionQueryService();
const questionRepository = new DrizzleQuestionRepository();
const questionProposalRepository = new DrizzleQuestionProposalRepository();

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

export const dependencies = {
  getRandomQuestions,
  createQuestion,
  createQuestionProposal,
  updateQuestionProposal,
  approveQuestionProposal,
  rejectQuestionProposal,
};

export type Dependencies = typeof dependencies;
