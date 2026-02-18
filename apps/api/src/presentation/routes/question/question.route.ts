import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Dependencies } from "../../../composition-root.ts";
import { toCreatedQuestionResponse } from "./type.ts";

const createdQuestionSchema = z
  .object({
    id: z.string().uuid(),
    text: z.string(),
    difficulty: z.string(),
    choices: z.array(z.string()),
    correctIndexes: z.array(z.number().int()),
    explanation: z.string(),
    categoryId: z.string().uuid(),
  })
  .openapi("CreatedQuestion");

const createQuestionRequestSchema = z
  .object({
    text: z.string(),
    difficulty: z.string(),
    choices: z.array(z.string()),
    correctIndexes: z.array(z.number().int()),
    explanation: z.string(),
    categoryId: z.string().uuid(),
  })
  .openapi("CreateQuestionRequest");

const questionCreateRoute = createRoute({
  method: "post",
  path: "/create",
  tags: ["Question"],
  summary: "問題を作成",
  request: {
    body: {
      content: {
        "application/json": { schema: createQuestionRequestSchema },
      },
    },
  },
  responses: {
    200: {
      description: "作成された問題",
      content: { "application/json": { schema: createdQuestionSchema } },
    },
  },
});

export const createQuestionRoute = (deps: Dependencies) =>
  new OpenAPIHono().openapi(questionCreateRoute, async (c) => {
    const input = c.req.valid("json");
    const question = await deps.createQuestion.execute(input);
    return c.json(toCreatedQuestionResponse(question));
  });
