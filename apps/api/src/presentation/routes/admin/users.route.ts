import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import type { Dependencies } from "../../../composition-root.ts";

const userListItemSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    username: z.string().nullable(),
    role: z.string(),
    image: z.string().nullable(),
    createdAt: z.string(),
    lastLoginAt: z.string().nullable(),
  })
  .openapi("AdminUserListItem");

const listUsersRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Admin"],
  summary: "ユーザー一覧を取得",
  request: {
    query: z.object({
      search: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      offset: z.coerce.number().int().min(0).default(0),
    }),
  },
  responses: {
    200: {
      description: "ユーザー一覧",
      content: {
        "application/json": {
          schema: z.object({
            items: z.array(userListItemSchema),
            total: z.number().int(),
          }),
        },
      },
    },
  },
});

const getUserRoute = createRoute({
  method: "get",
  path: "/:id",
  tags: ["Admin"],
  summary: "ユーザー詳細を取得",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: "ユーザー詳細",
      content: {
        "application/json": {
          schema: userListItemSchema,
        },
      },
    },
    404: {
      description: "ユーザーが見つかりません",
    },
  },
});

const adminStatsQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
});

const adminStatsResponseSchema = z
  .object({
    totalAnswered: z.number().int(),
    correctCount: z.number().int(),
    uniqueQuestionsAnswered: z.number().int(),
    totalQuestions: z.number().int(),
    categoryStats: z
      .array(
        z.object({
          categoryId: z.string().uuid(),
          categoryName: z.string(),
          totalAnswered: z.number().int(),
          correctCount: z.number().int(),
          uniqueQuestionsAnswered: z.number().int(),
          totalQuestions: z.number().int(),
        }),
      )
      .optional(),
  })
  .openapi("AdminDrillStatsResponse");

const getUserStatsRoute = createRoute({
  method: "get",
  path: "/:id/stats",
  tags: ["Admin"],
  summary: "ユーザーの成績統計を取得",
  request: {
    params: z.object({ id: z.string() }),
    query: adminStatsQuerySchema,
  },
  responses: {
    200: {
      description: "成績統計",
      content: { "application/json": { schema: adminStatsResponseSchema } },
    },
  },
});

const adminRecentQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  categoryId: z.string().uuid().optional(),
});

const adminSessionSummarySchema = z
  .object({
    sessionId: z.string().uuid(),
    categoryId: z.string().uuid().nullable(),
    categoryName: z.string().nullable(),
    totalCount: z.number().int(),
    correctCount: z.number().int(),
    completedAt: z.string().datetime(),
  })
  .openapi("AdminSessionSummary");

const getUserRecentSessionsRoute = createRoute({
  method: "get",
  path: "/:id/stats/recent-sessions",
  tags: ["Admin"],
  summary: "ユーザーの最近のセッション一覧を取得",
  request: {
    params: z.object({ id: z.string() }),
    query: adminRecentQuerySchema,
  },
  responses: {
    200: {
      description: "セッション一覧",
      content: {
        "application/json": {
          schema: z.array(adminSessionSummarySchema),
        },
      },
    },
  },
});

const adminCategoryScoreSchema = z
  .object({
    categoryId: z.string().uuid(),
    categoryName: z.string(),
    correctRate: z.number(),
    coverageRate: z.number(),
  })
  .openapi("AdminCategoryScore");

const getUserCategoryScoresRoute = createRoute({
  method: "get",
  path: "/:id/stats/category-scores",
  tags: ["Admin"],
  summary: "ユーザーのカテゴリ別スコアを取得",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: "カテゴリ別スコア",
      content: {
        "application/json": { schema: z.array(adminCategoryScoreSchema) },
      },
    },
  },
});

export const createAdminUsersRoute = (deps: Dependencies) =>
  new OpenAPIHono()
    .openapi(listUsersRoute, async (c) => {
      const { search, limit, offset } = c.req.valid("query");
      const result = await deps.listUsers.execute(search, limit, offset);
      return c.json({
        items: result.items.map((item) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          username: item.username,
          role: item.role,
          image: item.image,
          createdAt: item.createdAt.toISOString(),
          lastLoginAt: item.lastLoginAt?.toISOString() ?? null,
        })),
        total: result.total,
      });
    })
    .openapi(getUserRoute, async (c) => {
      const { id } = c.req.valid("param");
      const user = await deps.getUser.execute(id);
      if (!user) {
        throw new HTTPException(404, {
          message: "ユーザーが見つかりません",
        });
      }
      return c.json({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        image: user.image,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      });
    })
    .openapi(getUserStatsRoute, async (c) => {
      const { id } = c.req.valid("param");
      const { categoryId } = c.req.valid("query");
      const stats = await deps.getDrillStats.execute({
        userId: id,
        categoryId,
      });
      return c.json(
        stats ?? {
          totalAnswered: 0,
          correctCount: 0,
          uniqueQuestionsAnswered: 0,
          totalQuestions: 0,
        },
      );
    })
    .openapi(getUserRecentSessionsRoute, async (c) => {
      const { id } = c.req.valid("param");
      const { limit, offset, categoryId } = c.req.valid("query");
      const sessions = await deps.getRecentSessions.execute({
        userId: id,
        limit,
        offset,
        categoryId,
      });
      return c.json(sessions);
    })
    .openapi(getUserCategoryScoresRoute, async (c) => {
      const { id } = c.req.valid("param");
      const scores = await deps.getCategoryScores.execute(id);
      return c.json(scores);
    });
