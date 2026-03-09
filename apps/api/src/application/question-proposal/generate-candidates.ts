import type {
  GeneratedQuestion,
  QuestionGenerationService,
} from "./question-generation-service.ts";

const QUESTION_COUNT = 10;

export class GenerateCandidates {
  constructor(private questionGenerationService: QuestionGenerationService) {}

  async execute(input: { url: string }): Promise<GeneratedQuestion[]> {
    return this.questionGenerationService.generate(input.url, QUESTION_COUNT);
  }
}
