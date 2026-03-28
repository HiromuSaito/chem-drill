import type {
  GeneratedQuestion,
  GenerationSource,
  QuestionGenerationService,
} from "./question-generation-service.ts";

const QUESTION_COUNT = 10;

export class GenerateCandidates {
  constructor(private questionGenerationService: QuestionGenerationService) {}

  async execute(input: GenerationSource): Promise<GeneratedQuestion[]> {
    return this.questionGenerationService.generate(input, QUESTION_COUNT);
  }
}
