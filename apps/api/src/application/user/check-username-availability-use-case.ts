import type { UserQueryService } from "../../domain/user/user-query-service.js";
import type { UnitOfWork } from "../unit-of-work.js";

export class CheckUsernameAvailabilityUseCase {
  constructor(
    private uow: UnitOfWork,
    private userQueryService: UserQueryService,
  ) {}

  async execute(username: string): Promise<boolean> {
    return this.uow.run(async () => {
      return await this.userQueryService.isUsernameAvailable(username);
    });
  }
}
