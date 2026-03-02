import { eq } from "drizzle-orm";
import { user } from "../db/auth-schema.ts";
import { getCurrentTransaction } from "../db/transaction-context.ts";
import type { UserRepository } from "../../domain/user/repository/user-repository.ts";

export class DrizzleUserRepository implements UserRepository {
  async updateImage(userId: string, imageUrl: string | null): Promise<void> {
    const tx = getCurrentTransaction();
    await tx
      .update(user)
      .set({ image: imageUrl, updatedAt: new Date() })
      .where(eq(user.id, userId));
  }
}
