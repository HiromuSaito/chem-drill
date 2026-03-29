import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Dependencies } from "../../composition-root.ts";
import { createCategoriesRoute } from "./categories/categories.route.ts";
import { createQuestionsRoute } from "./questions/questions.route.ts";
import { createQuestionProposalsRoute } from "./question-proposals/question-proposals.route.ts";
import { createUserRoute } from "./user/user.route.ts";
import { createDrillSessionsRoute } from "./drill-sessions/drill-sessions.route.ts";
import { createDrillStatsRoute } from "./drill-stats/drill-stats.route.ts";
import { createRankRoute } from "./rank/rank.route.ts";
import { createAdminUsersRoute } from "./admin/users.route.ts";
import { createUserProposalsRoute } from "./user-proposals/user-proposals.route.ts";
import {
  requireAuth,
  requireAdmin,
} from "../../infrastructure/auth/auth-middleware.ts";

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  tags: ["System"],
  summary: "ヘルスチェック",
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({ status: z.string() }).openapi("HealthResponse"),
        },
      },
    },
  },
});

export const createApiRoutes = (deps: Dependencies) =>
  new OpenAPIHono()
    .openapi(healthRoute, (c) => c.json({ status: "ok" }))
    .route("/user", createUserRoute(deps))
    .use("/*", requireAuth)
    .route("/user-proposals", createUserProposalsRoute(deps))
    .use("/categories/*", async (c, next) => {
      if (c.req.method === "GET") return next();
      return requireAdmin(c, next);
    })
    .use("/questions/*", async (c, next) => {
      if (c.req.method === "GET") return next();
      return requireAdmin(c, next);
    })
    .use("/question-proposals/*", requireAdmin)
    .use("/admin/*", requireAdmin)
    .route("/categories", createCategoriesRoute(deps))
    .route("/questions", createQuestionsRoute(deps))
    .route("/question-proposals", createQuestionProposalsRoute(deps))
    .route("/admin/users", createAdminUsersRoute(deps))
    .route("/drill-sessions", createDrillSessionsRoute(deps))
    .route("/drill-stats", createDrillStatsRoute(deps))
    .route("/rank", createRankRoute(deps));
