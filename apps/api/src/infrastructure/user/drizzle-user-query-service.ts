import { eq, ilike, or, desc, count, max } from "drizzle-orm";
import { user, session } from "../db/auth-schema.ts";
import { getCurrentTransaction } from "../db/transaction-context.ts";
import type {
  UserQueryService,
  UserListItemDto,
  ListUsersResult,
} from "../../domain/user/query-service/user-query-service.ts";

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

  async findById(userId: string): Promise<UserListItemDto | null> {
    const tx = getCurrentTransaction();

    const lastLoginSubquery = tx
      .select({
        userId: session.userId,
        lastLoginAt: max(session.createdAt).as("last_login_at"),
      })
      .from(session)
      .groupBy(session.userId)
      .as("last_login");

    const rows = await tx
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        image: user.image,
        createdAt: user.createdAt,
        lastLoginAt: lastLoginSubquery.lastLoginAt,
      })
      .from(user)
      .leftJoin(lastLoginSubquery, eq(user.id, lastLoginSubquery.userId))
      .where(eq(user.id, userId))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0]!;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      username: row.username,
      role: row.role,
      image: row.image,
      createdAt: row.createdAt,
      lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt) : null,
    };
  }

  async listUsers(
    search: string | undefined,
    limit: number,
    offset: number,
  ): Promise<ListUsersResult> {
    const tx = getCurrentTransaction();

    const lastLoginSubquery = tx
      .select({
        userId: session.userId,
        lastLoginAt: max(session.createdAt).as("last_login_at"),
      })
      .from(session)
      .groupBy(session.userId)
      .as("last_login");

    const escapedSearch = search
      ? search.replace(/[%_\\]/g, (ch) => `\\${ch}`)
      : undefined;

    const conditions = escapedSearch
      ? or(
          ilike(user.name, `%${escapedSearch}%`),
          ilike(user.email, `%${escapedSearch}%`),
        )
      : undefined;

    const [items, totalResult] = await Promise.all([
      tx
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
          image: user.image,
          createdAt: user.createdAt,
          lastLoginAt: lastLoginSubquery.lastLoginAt,
        })
        .from(user)
        .leftJoin(lastLoginSubquery, eq(user.id, lastLoginSubquery.userId))
        .where(conditions)
        .orderBy(desc(user.createdAt))
        .limit(limit)
        .offset(offset),
      tx.select({ count: count() }).from(user).where(conditions),
    ]);

    return {
      items: items.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        username: row.username,
        role: row.role,
        image: row.image,
        createdAt: row.createdAt,
        lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt) : null,
      })),
      total: totalResult[0]?.count ?? 0,
    };
  }
}
