import type { UnitOfWork } from "../unit-of-work.ts";
import type {
  UserExperienceQueryService,
  RankUpEventDto,
} from "../../domain/user-experience/query-service/user-experience-query-service.ts";

export class GetPendingRankUps {
  constructor(
    private uow: UnitOfWork,
    private userExperienceQueryService: UserExperienceQueryService,
  ) {}

  async execute(userId: string): Promise<RankUpEventDto[]> {
    return this.uow.run(async () => {
      return this.userExperienceQueryService.getPendingRankUps(userId);
    });
  }
}
