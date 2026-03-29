import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "../../../infrastructure/auth/auth-middleware.ts";
import type { Dependencies } from "../../../composition-root.ts";

const rankInfoSchema = z
  .object({
    totalExp: z.number().int(),
    currentRank: z.number().int(),
    substance: z.string(),
    category: z.string(),
    progress: z.number().int().min(0).max(100),
    nextRankExp: z.number().int().nullable(),
  })
  .openapi("RankInfo");

const getRankRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Rank"],
  summary: "現在のランク情報を取得",
  responses: {
    200: {
      description: "ランク情報",
      content: { "application/json": { schema: rankInfoSchema } },
    },
  },
});

const rankUpEventSchema = z
  .object({
    id: z.string().uuid(),
    userId: z.string(),
    previousRank: z.number().int(),
    newRank: z.number().int(),
    createdAt: z.string().datetime(),
  })
  .openapi("RankUpEvent");

const getPendingRankUpsRoute = createRoute({
  method: "get",
  path: "/pending-rank-ups",
  tags: ["Rank"],
  summary: "未表示のランクアップイベントを取得",
  responses: {
    200: {
      description: "未表示ランクアップイベント一覧",
      content: {
        "application/json": { schema: z.array(rankUpEventSchema) },
      },
    },
  },
});

const markDisplayedRoute = createRoute({
  method: "post",
  path: "/mark-displayed",
  tags: ["Rank"],
  summary: "ランクアップイベントを表示済みにする",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              rankUpEventIds: z.array(z.string().uuid()).min(1),
            })
            .openapi("MarkRankUpDisplayedRequest"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "表示済みに更新",
      content: {
        "application/json": {
          schema: z
            .object({ ok: z.boolean() })
            .openapi("MarkDisplayedResponse"),
        },
      },
    },
  },
});

export const createRankRoute = (deps: Dependencies) =>
  new OpenAPIHono<AuthEnv>()
    .openapi(getRankRoute, async (c) => {
      const userId = c.get("user").id;
      const info = await deps.getUserRankInfo.execute(userId);
      return c.json(info);
    })
    .openapi(getPendingRankUpsRoute, async (c) => {
      const userId = c.get("user").id;
      const events = await deps.getPendingRankUps.execute(userId);
      return c.json(events);
    })
    .openapi(markDisplayedRoute, async (c) => {
      const userId = c.get("user").id;
      const { rankUpEventIds } = c.req.valid("json");
      await deps.markRankUpDisplayed.execute(rankUpEventIds, userId);
      return c.json({ ok: true });
    });
