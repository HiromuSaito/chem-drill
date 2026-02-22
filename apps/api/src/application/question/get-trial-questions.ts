import type {
  QuestionQueryService,
  QuestionWithCategory,
} from "../../domain/question/query-service/question-query-service.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

const TRIAL_QUESTION_COUNT = 5;

export class GetTrialQuestions {
  constructor(
    private uow: UnitOfWork,
    private questionQueryService: QuestionQueryService,
  ) {}

  async execute(): Promise<QuestionWithCategory[]> {
    return this.uow.run(async () => {
      return await this.questionQueryService.findRandom(TRIAL_QUESTION_COUNT);
    });
  }
}
