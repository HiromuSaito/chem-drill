import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Dependencies } from "../../../composition-root.ts";
import { toQuestionWithCategoryResponse } from "../questions/type.ts";
import { questionWithCategorySchema } from "../questions/questions.route.ts";

const trialQuestionsGetRoute = createRoute({
  method: "get",
  path: "/questions",
  tags: ["Trial"],
  summary: "トライアル用のランダムな問題一覧を取得（5問固定）",
  responses: {
    200: {
      description: "問題一覧",
      content: {
        "application/json": {
          schema: z.array(questionWithCategorySchema),
        },
      },
    },
  },
});

export const createTrialRoute = (deps: Dependencies) =>
  new OpenAPIHono().openapi(trialQuestionsGetRoute, async (c) => {
    const questions = await deps.getTrialQuestions.execute();
    return c.json(questions.map((q) => toQuestionWithCategoryResponse(q)));
  });
