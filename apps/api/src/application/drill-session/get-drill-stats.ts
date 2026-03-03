import type {
  DrillStatsQueryService,
  OverallStatsDto,
  StatsDto,
} from "../../domain/drill-session/query-service/drill-stats-query-service.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export class GetDrillStats {
  constructor(
    private uow: UnitOfWork,
    private queryService: DrillStatsQueryService,
  ) {}

  async execute(params: {
    userId: string;
    categoryId?: string;
  }): Promise<OverallStatsDto | StatsDto | null> {
    return this.uow.run(async () => {
      if (params.categoryId) {
        return this.queryService.getCategoryStats(
          params.userId,
          params.categoryId,
        );
      }
      return this.queryService.getOverallStats(params.userId);
    });
  }
}
