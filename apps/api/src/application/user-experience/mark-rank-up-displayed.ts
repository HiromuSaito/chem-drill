import type { UnitOfWork } from "../unit-of-work.ts";
import type { UserExperienceQueryService } from "../../domain/user-experience/query-service/user-experience-query-service.ts";

export class MarkRankUpDisplayed {
  constructor(
    private uow: UnitOfWork,
    private userExperienceQueryService: UserExperienceQueryService,
  ) {}

  async execute(eventIds: string[], userId: string): Promise<void> {
    return this.uow.run(async () => {
      await this.userExperienceQueryService.markRankUpsDisplayed(
        eventIds,
        userId,
      );
    });
  }
}
