import type { UserQueryService } from "../../domain/user/query-service/user-query-service.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

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
