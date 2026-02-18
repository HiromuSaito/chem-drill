import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Dependencies } from "../../composition-root.ts";
import { createCategoryRoute } from "./category/category.route.ts";
import {
  createQuestionRoute,
  createRandomQuestionRoute,
} from "./question/question.route.ts";
import { createQuestionProposalRoute } from "./question-proposal/question-proposal.route.ts";
import { createUserRoute } from "./user/user.route.ts";
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
    .route("/random-question", createRandomQuestionRoute(deps))
    .route("/user", createUserRoute(deps))
    .use("/*", requireAuth)
    .use("/category/*", async (c, next) => {
      if (c.req.method === "GET") return next();
      return requireAdmin(c, next);
    })
    .use("/question/create", requireAdmin)
    .use("/question-proposal/*", requireAdmin)
    .route("/category", createCategoryRoute(deps))
    .route("/question", createQuestionRoute(deps))
    .route("/question-proposal", createQuestionProposalRoute(deps));
