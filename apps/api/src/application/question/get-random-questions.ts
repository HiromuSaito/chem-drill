import type {
  QuestionQueryService,
  QuestionWithCategory,
} from "../../domain/question/query-service/question-query-service.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

const DEFAULT_QUESTION_COUNT = 10;

export class GetRandomQuestions {
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
