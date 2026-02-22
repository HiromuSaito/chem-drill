import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "../../../infrastructure/auth/auth-middleware.ts";
import type { Dependencies } from "../../../composition-root.ts";
import { errorSchema } from "../shared/schema.ts";

const answerSchema = z.object({
  questionId: z.string().uuid(),
  selectedIndexes: z.array(z.number().int().min(0)),
  isCorrect: z.boolean(),
});

const saveDrillSessionRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["DrillSession"],
  summary: "ドリルセッションを保存",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              categoryId: z.string().uuid().nullable(),
              answers: z.array(answerSchema).min(1),
              startedAt: z.string().datetime(),
            })
            .openapi("SaveDrillSessionRequest"),
        },
      },
    },
  },
  responses: {
    201: {
      description: "保存成功",
      content: {
        "application/json": {
          schema: z
            .object({ sessionId: z.string().uuid() })
            .openapi("SaveDrillSessionResponse"),
        },
      },
    },
    400: {
      description: "バリデーションエラー",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

const recentQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  categoryId: z.string().uuid().optional(),
});

const sessionSummarySchema = z
  .object({
    sessionId: z.string().uuid(),
    categoryId: z.string().uuid().nullable(),
    categoryName: z.string().nullable(),
    totalCount: z.number().int(),
    correctCount: z.number().int(),
    completedAt: z.string().datetime(),
  })
  .openapi("SessionSummary");

const getRecentRoute = createRoute({
  method: "get",
  path: "/recent",
  tags: ["DrillSession"],
  summary: "最近のセッション一覧を取得",
  request: { query: recentQuerySchema },
  responses: {
    200: {
      description: "セッション一覧",
      content: {
        "application/json": { schema: z.array(sessionSummarySchema) },
      },
    },
  },
});

export const createDrillSessionsRoute = (deps: Dependencies) =>
  new OpenAPIHono<AuthEnv>()
    .openapi(saveDrillSessionRoute, async (c) => {
      const userId = c.get("user").id;
      const body = c.req.valid("json");
      const result = await deps.saveDrillSession.execute({
        userId,
        categoryId: body.categoryId,
        answers: body.answers,
        startedAt: body.startedAt,
      });
      return c.json(result, 201);
    })
    .openapi(getRecentRoute, async (c) => {
      const userId = c.get("user").id;
      const { limit, offset, categoryId } = c.req.valid("query");
      const sessions = await deps.getRecentSessions.execute({
        userId,
        limit,
        offset,
        categoryId,
      });
      return c.json(sessions);
    });
