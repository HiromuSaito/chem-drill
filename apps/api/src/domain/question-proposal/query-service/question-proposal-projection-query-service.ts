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
  userId: string | null;
  userName: string | null;
  questionId: string | null;
  questionCreated: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ListQuestionProposalsByUserIdResult = {
  items: QuestionProposalProjectionDto[];
  total: number;
};

export interface QuestionProposalProjectionQueryService {
  list(
    status: string | undefined,
    categoryId: string | undefined,
    limit: number,
    offset: number,
  ): Promise<ListQuestionProposalsByUserIdResult>;

  listByUserId(
    userId: string,
    status: string | undefined,
    limit: number,
    offset: number,
  ): Promise<ListQuestionProposalsByUserIdResult>;

  findById(
    questionProposalId: string,
  ): Promise<QuestionProposalProjectionDto | null>;
}
