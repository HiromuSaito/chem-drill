export type QuestionWithCategory = {
  id: string;
  text: string;
  difficulty: string;
  choices: string[];
  correctIndexes: number[];
  explanation: string;
  categoryId: string;
  categoryName: string;
};

export interface QuestionQueryService {
  findRandom(limit: number): Promise<QuestionWithCategory[]>;
}
