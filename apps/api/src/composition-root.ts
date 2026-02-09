import { db } from "./infrastructure/db/client.js";
import { DrizzleUnitOfWork } from "./infrastructure/db/DrizzleUnitOfWork.js";
import { DrizzleQuestionQueryService } from "./infrastructure/question/DrizzleQuestionQueryService.js";
import { DrizzleQuestionRepository } from "./infrastructure/question/DrizzleQuestionRepository.js";
import { GetRandomQuestionsUseCase } from "./application/question/GetRandomQuestionsUseCase.js";
import { CreateQuestionUseCase } from "./application/question/CreateQuestionUseCase.js";
import { CreateQuestionProposalUseCase } from "./application/questionProposal/CreateQuestionProposalUseCase.js";
import { UpdateQuestionProposalUseCase } from "./application/questionProposal/UpdateQuestionProposalUseCase.js";
import { ApproveQuestionProposalUseCase } from "./application/questionProposal/ApproveQuestionProposalUseCase.js";
import { RejectQuestionProposalUseCase } from "./application/questionProposal/RejectQuestionProposalUseCase.js";
import { DrizzleQuestionProposalRepository } from "./infrastructure/questionProposal/DrizzleQuestionProposalRepository.js";

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
