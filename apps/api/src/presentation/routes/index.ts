import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { createMiddleware } from "hono/factory";
import type { Dependencies } from "../../composition-root.ts";
import { createCategoriesRoute } from "./categories/categories.route.ts";
import { createQuestionsRoute } from "./questions/questions.route.ts";
import { createQuestionProposalsRoute } from "./question-proposals/question-proposals.route.ts";
import { createUserRoute } from "./user/user.route.ts";
import {
  requireAuth,
  requireAdmin,
  type AuthEnv,
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
    .use(
      "/*",
      createMiddleware<AuthEnv>(async (c, next) => {
        if (
          c.req.path.endsWith("/questions/random") &&
          c.req.method === "GET"
        ) {
          return next();
        }
        await requireAuth(c, next);
      }),
    )
    .use("/categories/*", async (c, next) => {
      if (c.req.method === "GET") return next();
      return requireAdmin(c, next);
    })
    .use("/questions/*", async (c, next) => {
      if (c.req.method === "GET") return next();
      return requireAdmin(c, next);
    })
    .use("/question-proposals/*", requireAdmin)
    .route("/categories", createCategoriesRoute(deps))
    .route("/questions", createQuestionsRoute(deps))
    .route("/question-proposals", createQuestionProposalsRoute(deps));
