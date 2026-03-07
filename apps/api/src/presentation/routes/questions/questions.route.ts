import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Dependencies } from "../../../composition-root.ts";
import {
  toQuestionWithCategoryResponse,
  toQuestionWithCategoryAndDatesResponse,
} from "./type.ts";

export const questionWithCategorySchema = z
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

const questionWithCategoryAndDatesSchema = questionWithCategorySchema
  .extend({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("QuestionWithCategoryAndDates");

const questionListRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Question"],
  summary: "問題一覧を取得",
  request: {
    query: z.object({
      categoryId: z.string().uuid().optional(),
      limit: z.coerce.number().int().min(1).max(100).optional().default(20),
      offset: z.coerce.number().int().min(0).optional().default(0),
    }),
  },
  responses: {
    200: {
      description: "問題一覧",
      content: {
        "application/json": {
          schema: z.object({
            items: z.array(questionWithCategoryAndDatesSchema),
            total: z.number().int(),
          }),
        },
      },
    },
  },
});

const questionGetByIdRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Question"],
  summary: "問題を取得",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: "問題",
      content: {
        "application/json": {
          schema: questionWithCategoryAndDatesSchema,
        },
      },
    },
    404: {
      description: "問題が見つかりません",
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
    },
  },
});

const randomQuestionGetRoute = createRoute({
  method: "get",
  path: "/random",
  tags: ["Question"],
  summary: "ランダムな問題一覧を取得",
  request: {
    query: z.object({
      categoryId: z.string().uuid().optional(),
      limit: z.coerce
        .number()
        .pipe(z.union([z.literal(5), z.literal(10), z.literal(20)]))
        .optional(),
    }),
  },
  responses: {
    200: {
      description: "問題一覧",
      content: {
        "application/json": { schema: z.array(questionWithCategorySchema) },
      },
    },
  },
});

export const createQuestionsRoute = (deps: Dependencies) =>
  new OpenAPIHono()
    .openapi(questionListRoute, async (c) => {
      const { categoryId, limit, offset } = c.req.valid("query");
      const result = await deps.listQuestions.execute(
        categoryId,
        limit,
        offset,
      );
      return c.json({
        items: result.items.map(toQuestionWithCategoryAndDatesResponse),
        total: result.total,
      });
    })
    .openapi(randomQuestionGetRoute, async (c) => {
      const { categoryId, limit } = c.req.valid("query");
      const questions = await deps.getRandomQuestions.execute({
        categoryId,
        limit,
      });
      return c.json(questions.map(toQuestionWithCategoryResponse));
    })
    .openapi(questionGetByIdRoute, async (c) => {
      const { id } = c.req.valid("param");
      const question = await deps.getQuestion.execute(id);
      if (!question) {
        return c.json({ error: "問題が見つかりません" }, 404);
      }
      return c.json(toQuestionWithCategoryAndDatesResponse(question), 200);
    });
