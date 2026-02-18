import { eq } from "drizzle-orm";
import { user } from "../db/auth-schema.ts";
import { getCurrentTransaction } from "../db/transaction-context.ts";
import type { UserQueryService } from "../../domain/user/query-service/user-query-service.ts";

export class DrizzleUserQueryService implements UserQueryService {
  async isUsernameAvailable(username: string): Promise<boolean> {
    const tx = getCurrentTransaction();
    const rows = await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, username))
      .limit(1);
    return rows.length === 0;
  }
}
