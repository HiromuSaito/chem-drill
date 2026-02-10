export type GeneratedQuestion = {
  questionText: string;
  difficulty: "easy" | "medium" | "hard";
  choices: string[];
  correctIndexes: number[];
  explanation: string;
};

export interface QuestionGenerationService {
  generate(url: string, questionCount: number): Promise<GeneratedQuestion[]>;
}
