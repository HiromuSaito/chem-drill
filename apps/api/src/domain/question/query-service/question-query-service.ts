export type QuestionWithCategory = {
  id: string;
  text: string;
  difficulty: string;
  choices: string[];
  correctIndexes: number[];
  explanation: string;
  category: {
    categoryId: string;
    categoryName: string;
  };
};

export type QuestionWithCategoryAndDates = QuestionWithCategory & {
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ListQuestionsResult = {
  items: QuestionWithCategoryAndDates[];
  total: number;
};

export interface QuestionQueryService {
  findRandom(
    limit: number,
    categoryId?: string,
  ): Promise<QuestionWithCategory[]>;
  list(
    categoryId: string | undefined,
    limit: number,
    offset: number,
  ): Promise<ListQuestionsResult>;
  findById(id: string): Promise<QuestionWithCategoryAndDates | null>;
}
