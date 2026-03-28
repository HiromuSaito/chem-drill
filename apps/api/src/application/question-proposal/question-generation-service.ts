export type GeneratedQuestion = {
  questionText: string;
  difficulty: "easy" | "medium" | "hard";
  choices: string[];
  correctIndexes: number[];
  explanation: string;
};

export type GenerationSource =
  | { type: "url"; url: string }
  | { type: "pdf"; data: string }
  | { type: "image"; data: string; mimeType: "image/jpeg" | "image/png" };

export interface QuestionGenerationService {
  generate(
    source: GenerationSource,
    questionCount: number,
  ): Promise<GeneratedQuestion[]>;
}
