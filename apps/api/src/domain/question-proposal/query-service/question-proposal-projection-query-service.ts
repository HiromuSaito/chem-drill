export type QuestionProposalProjectionDto = {
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
  createdAt: Date;
  updatedAt: Date;
};

export type ListQuestionProposalsResult = {
  items: QuestionProposalProjectionDto[];
  total: number;
};

export interface QuestionProposalProjectionQueryService {
  list(
    status: string | undefined,
    categoryId: string | undefined,
    limit: number,
    offset: number,
  ): Promise<ListQuestionProposalsResult>;
  findById(
    questionProposalId: string,
  ): Promise<QuestionProposalProjectionDto | null>;
}
