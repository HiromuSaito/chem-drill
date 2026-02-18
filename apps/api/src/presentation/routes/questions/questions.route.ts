import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Dependencies } from "../../../composition-root.ts";
import {
  toCreatedQuestionResponse,
  toQuestionWithCategoryResponse,
} from "./type.ts";

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
  path: "/",
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

export const createQuestionsRoute = (deps: Dependencies) =>
  new OpenAPIHono()
    .openapi(randomQuestionGetRoute, async (c) => {
      const questions = await deps.getRandomQuestions.execute();
      return c.json(questions.map((q) => toQuestionWithCategoryResponse(q)));
    })
    .openapi(questionCreateRoute, async (c) => {
      const input = c.req.valid("json");
      const question = await deps.createQuestion.execute(input);
      return c.json(toCreatedQuestionResponse(question));
    });
