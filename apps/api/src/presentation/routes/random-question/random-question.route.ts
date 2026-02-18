import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Dependencies } from "../../../composition-root.ts";
import { toQuestionWithCategoryResponse } from "../question/type.ts";

const questionWithCategorySchema = z
  .object({
    id: z.string().uuid(),
    text: z.string(),
    difficulty: z.string(),
    choices: z.array(z.string()),
    correctIndexes: z.array(z.number().int()),
    explanation: z.string(),
    category: z.object({
      categoryId: z.string().uuid(),
      categoryName: z.string(),
    }),
  })
  .openapi("QuestionWithCategory");

const randomQuestionGetRoute = createRoute({
  method: "get",
  path: "/random",
  tags: ["Question"],
  summary: "ランダムな問題一覧を取得",
  responses: {
    200: {
      description: "問題一覧",
      content: {
        "application/json": { schema: z.array(questionWithCategorySchema) },
      },
    },
  },
});

export const createRandomQuestionRoute = (deps: Dependencies) =>
  new OpenAPIHono().openapi(randomQuestionGetRoute, async (c) => {
    const questions = await deps.getRandomQuestions.execute();
    return c.json(questions.map((q) => toQuestionWithCategoryResponse(q)));
  });
