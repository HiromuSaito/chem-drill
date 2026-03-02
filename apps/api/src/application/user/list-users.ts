import type {
  UserQueryService,
  ListUsersResult,
} from "../../domain/user/query-service/user-query-service.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export class ListUsers {
  constructor(
    private uow: UnitOfWork,
    private userQueryService: UserQueryService,
  ) {}

  async execute(
    search: string | undefined,
    limit: number,
    offset: number,
  ): Promise<ListUsersResult> {
    return this.uow.run(async () => {
      return await this.userQueryService.listUsers(search, limit, offset);
    });
  }
}
