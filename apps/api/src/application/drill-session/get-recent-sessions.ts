import type {
  DrillStatsQueryService,
  SessionSummaryDto,
} from "../../domain/drill-session/query-service/drill-stats-query-service.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

const MAX_LIMIT = 50;

export class GetRecentSessions {
  constructor(
    private uow: UnitOfWork,
    private drillStatsQueryService: DrillStatsQueryService,
  ) {}

  async execute(params: {
    userId: string;
    limit?: number;
    offset?: number;
    categoryId?: string;
  }): Promise<SessionSummaryDto[]> {
    const limit = Math.min(params.limit ?? 10, MAX_LIMIT);
    const offset = params.offset ?? 0;

    return this.uow.run(async () => {
      return this.drillStatsQueryService.getRecentSessions(
        params.userId,
        limit,
        offset,
        params.categoryId,
      );
    });
  }
}
