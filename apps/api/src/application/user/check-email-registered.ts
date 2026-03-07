import type { UserQueryService } from "../../domain/user/query-service/user-query-service.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export class CheckEmailRegistered {
  constructor(
    private uow: UnitOfWork,
    private userQueryService: UserQueryService,
  ) {}

  async execute(email: string): Promise<boolean> {
    return this.uow.run(async () => {
      return await this.userQueryService.isEmailRegistered(email);
    });
  }
}
