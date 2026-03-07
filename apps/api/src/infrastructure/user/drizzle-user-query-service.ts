import { eq, ilike, or, desc, count, max } from "drizzle-orm";
import { user, session } from "../db/auth-schema.ts";
import { getCurrentTransaction } from "../db/transaction-context.ts";
import type {
  UserQueryService,
  UserListItemDto,
  ListUsersResult,
} from "../../domain/user/query-service/user-query-service.ts";

type UserRow = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string;
  image: string | null;
  createdAt: Date;
  lastLoginAt: Date | null;
};

function toDto(row: UserRow): UserListItemDto {
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

function createLastLoginSubquery(tx: ReturnType<typeof getCurrentTransaction>) {
  return tx
    .select({
      userId: session.userId,
      lastLoginAt: max(session.createdAt).as("last_login_at"),
    })
    .from(session)
    .groupBy(session.userId)
    .as("last_login");
}

function userWithLastLoginFields(
  lastLoginSubquery: ReturnType<typeof createLastLoginSubquery>,
) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    image: user.image,
    createdAt: user.createdAt,
    lastLoginAt: lastLoginSubquery.lastLoginAt,
  };
}

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

  async isEmailRegistered(email: string): Promise<boolean> {
    const tx = getCurrentTransaction();
    const rows = await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);
    return rows.length > 0;
  }

  async findById(userId: string): Promise<UserListItemDto | null> {
    const tx = getCurrentTransaction();
    const lastLogin = createLastLoginSubquery(tx);

    const rows = await tx
      .select(userWithLastLoginFields(lastLogin))
      .from(user)
      .leftJoin(lastLogin, eq(user.id, lastLogin.userId))
      .where(eq(user.id, userId))
      .limit(1);

    if (rows.length === 0) return null;
    return toDto(rows[0]!);
  }

  async listUsers(
    search: string | undefined,
    limit: number,
    offset: number,
  ): Promise<ListUsersResult> {
    const tx = getCurrentTransaction();
    const lastLogin = createLastLoginSubquery(tx);

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
        .select(userWithLastLoginFields(lastLogin))
        .from(user)
        .leftJoin(lastLogin, eq(user.id, lastLogin.userId))
        .where(conditions)
        .orderBy(desc(user.createdAt))
        .limit(limit)
        .offset(offset),
      tx.select({ count: count() }).from(user).where(conditions),
    ]);

    return {
      items: items.map(toDto),
      total: totalResult[0]?.count ?? 0,
    };
  }
}
