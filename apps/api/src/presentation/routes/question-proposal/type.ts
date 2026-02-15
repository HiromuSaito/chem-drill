import type { QuestionProposal } from "../../../domain/question-proposal/question-proposal";
import type { QuestionProposalProjectionDto } from "../../../domain/question-proposal/question-proposal-list-query-service";

export type QuestionProposalResponse = {
  id: string;
  status: string;
  text: string;
  difficulty: string;
  choices: string[];
  correctIndexes: number[];
  explanation: string;
  categoryId: string;
  rejectReason?: string;
};

export function toQuestionProposalResponse(
  proposal: QuestionProposal,
): QuestionProposalResponse {
  return {
    id: proposal.id,
    status: proposal.status.value,
    text: proposal.text.value,
    difficulty: proposal.difficulty.value,
    choices: [...proposal.choices],
    correctIndexes: [...proposal.correctIndexes.values],
    explanation: proposal.explanation.value,
    categoryId: proposal.categoryId,
    rejectReason: proposal.rejectReason?.value,
  };
}

export type QuestionProposalProjectionResponse = {
  questionProposalId: string;
  status: string;
  text: string;
  difficulty: string;
  choices: string[];
  correctIndexes: number[];
  explanation: string;
  categoryId: string;
  rejectReason: string | null;
  questionCreated: boolean;
  createdAt: string;
  updatedAt: string;
};

export function toProjectionResponse(
  dto: QuestionProposalProjectionDto,
): QuestionProposalProjectionResponse {
  return {
    ...dto,
    createdAt: dto.createdAt.toISOString(),
    updatedAt: dto.updatedAt.toISOString(),
  };
}
