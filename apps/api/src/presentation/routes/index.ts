import { Hono } from "hono";
import type { Dependencies } from "../../composition-root.js";
import { createCategoryRoute } from "./category/category.route.js";
import { createQuestionRoute } from "./question/question.route.js";
import { createQuestionProposalRoute } from "./question-proposal/question-proposal.route.js";

export const createApiRoutes = (deps: Dependencies) =>
  new Hono()
    .get("/health", (c) => c.json({ status: "ok" }))
    .route("/category", createCategoryRoute(deps))
    .route("/question", createQuestionRoute(deps))
    .route("/question-proposal", createQuestionProposalRoute(deps));
