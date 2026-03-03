import type {
  DrillStatsQueryService,
  CategoryScoreDto,
} from "../../domain/drill-session/query-service/drill-stats-query-service.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export class GetCategoryScores {
  constructor(
    private uow: UnitOfWork,
    private queryService: DrillStatsQueryService,
  ) {}

  async execute(userId: string): Promise<CategoryScoreDto[]> {
    return this.uow.run(async () => {
      return this.queryService.getCategoryScores(userId);
    });
  }
}
