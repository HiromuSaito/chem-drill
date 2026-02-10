import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Dependencies } from "../../composition-root.js";
import { createCategoryRoute } from "./category/category.route.js";
import { createQuestionRoute } from "./question/question.route.js";
import { createQuestionProposalRoute } from "./question-proposal/question-proposal.route.js";

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
    .route("/category", createCategoryRoute(deps))
    .route("/question", createQuestionRoute(deps))
    .route("/question-proposal", createQuestionProposalRoute(deps));
