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

export type ListQuestionProposalsInput = {
  status?: string;
  limit: number;
  offset: number;
};

export type ListQuestionProposalsResult = {
  items: QuestionProposalProjectionDto[];
  total: number;
};

export interface QuestionProposalListQueryService {
  list(input: ListQuestionProposalsInput): Promise<ListQuestionProposalsResult>;
  findById(
    questionProposalId: string,
  ): Promise<QuestionProposalProjectionDto | null>;
}
