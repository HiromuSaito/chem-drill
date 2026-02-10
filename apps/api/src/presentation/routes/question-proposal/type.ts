import type { QuestionProposal } from "../../../domain/question-proposal/question-proposal";

export type QuestionProposalResponse = {
  id: string;
  status: string;
  text: string;
  difficulty: string;
  choices: readonly string[];
  correctIndexes: readonly number[];
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
    choices: proposal.choices,
    correctIndexes: proposal.correctIndexes.values,
    explanation: proposal.explanation.value,
    categoryId: proposal.categoryId,
    rejectReason: proposal.rejectReason?.value,
  };
}
