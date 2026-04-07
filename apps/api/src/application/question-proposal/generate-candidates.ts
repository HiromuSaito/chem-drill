import type {
  GeneratedQuestion,
  GenerationSource,
  QuestionGenerationService,
} from "./question-generation-service.ts";

const DEFAULT_QUESTION_COUNT = 10;
const FREE_INPUT_QUESTION_COUNT = 5;

export class GenerateCandidates {
  constructor(private questionGenerationService: QuestionGenerationService) {}

  async execute(input: GenerationSource): Promise<GeneratedQuestion[]> {
    const questionCount =
      input.type === "freeInput"
        ? FREE_INPUT_QUESTION_COUNT
        : DEFAULT_QUESTION_COUNT;
    return this.questionGenerationService.generate(input, questionCount);
  }
}
