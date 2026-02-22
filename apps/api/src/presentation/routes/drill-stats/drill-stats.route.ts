import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "../../../infrastructure/auth/auth-middleware.ts";
import type { Dependencies } from "../../../composition-root.ts";

const statsQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
});

const statsResponseSchema = z
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
  .openapi("DrillStatsResponse");

const getStatsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["DrillStats"],
  summary: "成績統計を取得",
  request: { query: statsQuerySchema },
  responses: {
    200: {
      description: "成績統計",
      content: { "application/json": { schema: statsResponseSchema } },
    },
  },
});

const categoryScoreSchema = z
  .object({
    categoryId: z.string().uuid(),
    categoryName: z.string(),
    correctRate: z.number(),
    coverageRate: z.number(),
  })
  .openapi("CategoryScore");

const getCategoryScoresRoute = createRoute({
  method: "get",
  path: "/category-scores",
  tags: ["DrillStats"],
  summary: "カテゴリ別スコアを取得",
  responses: {
    200: {
      description: "カテゴリ別スコア",
      content: {
        "application/json": { schema: z.array(categoryScoreSchema) },
      },
    },
  },
});

export const createDrillStatsRoute = (deps: Dependencies) =>
  new OpenAPIHono<AuthEnv>()
    .openapi(getStatsRoute, async (c) => {
      const userId = c.get("user").id;
      const { categoryId } = c.req.valid("query");
      const stats = await deps.getDrillStats.execute({ userId, categoryId });
      return c.json(
        stats ?? {
          totalAnswered: 0,
          correctCount: 0,
          uniqueQuestionsAnswered: 0,
          totalQuestions: 0,
        },
      );
    })
    .openapi(getCategoryScoresRoute, async (c) => {
      const userId = c.get("user").id;
      const scores = await deps.getCategoryScores.execute(userId);
      return c.json(scores);
    });
