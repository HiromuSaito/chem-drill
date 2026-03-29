import type { UnitOfWork } from "../unit-of-work.ts";
import { UserExperience } from "../../domain/user-experience/entity/user-experience.ts";
import type { UserExperienceRepository } from "../../domain/user-experience/repository/user-experience-repository.ts";
import type { UserRankInfoDto } from "../../domain/user-experience/query-service/user-experience-query-service.ts";

export class GetUserRankInfo {
  constructor(
    private uow: UnitOfWork,
    private userExperienceRepository: UserExperienceRepository,
  ) {}

  async execute(userId: string): Promise<UserRankInfoDto> {
    return this.uow.run(async () => {
      const ue =
        (await this.userExperienceRepository.findByUserId(userId)) ??
        UserExperience.create(userId);
      const def = ue.getRankDefinition();
      return {
        totalExp: ue.totalExp,
        currentRank: ue.currentRank,
        substance: def.substance,
        category: def.category,
        progress: ue.getProgress(),
        nextRankExp: ue.getNextRankExp(),
      };
    });
  }
}
