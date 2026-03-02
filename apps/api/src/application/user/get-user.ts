import type {
  UserQueryService,
  UserListItemDto,
} from "../../domain/user/query-service/user-query-service.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export class GetUser {
  constructor(
    private uow: UnitOfWork,
    private userQueryService: UserQueryService,
  ) {}

  async execute(userId: string): Promise<UserListItemDto | null> {
    return this.uow.run(async () => {
      return await this.userQueryService.findById(userId);
    });
  }
}
