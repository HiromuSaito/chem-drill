import type {
  QuestionQueryService,
  QuestionWithCategory,
} from "../../domain/question/question-query-service.js";
import type { UnitOfWork } from "../unit-of-work.js";

const DEFAULT_QUESTION_COUNT = 10;

export class GetRandomQuestionsUseCase {
  constructor(
    private uow: UnitOfWork,
    private questionQueryService: QuestionQueryService,
  ) {}

  async execute(): Promise<QuestionWithCategory[]> {
    return this.uow.run(async () => {
      return await this.questionQueryService.findRandom(DEFAULT_QUESTION_COUNT);
    });
  }
}
