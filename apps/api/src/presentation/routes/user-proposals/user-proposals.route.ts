import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import type { AuthEnv } from "../../../infrastructure/auth/auth-middleware.ts";
import type { Dependencies } from "../../../composition-root.ts";
import { errorSchema } from "../shared/schema.ts";
import {
  toQuestionProposalResponse,
  toProjectionResponse,
} from "../question-proposals/type.ts";

const questionProposalSchema = z
  .object({
    id: z.string().uuid(),
    status: z.string(),
    text: z.string(),
    difficulty: z.string(),
    choices: z.array(z.string()),
    correctIndexes: z.array(z.number().int()),
    explanation: z.string(),
    categoryId: z.string().uuid(),
    rejectReason: z.string().optional(),
  })
  .openapi("UserQuestionProposal");

const projectionSchema = z
  .object({
    questionProposalId: z.string().uuid(),
    status: z.string(),
    text: z.string(),
    difficulty: z.string(),
    choices: z.array(z.string()),
    correctIndexes: z.array(z.number().int()),
    explanation: z.string(),
    categoryId: z.string().uuid(),
    rejectReason: z.string().nullable(),
    userName: z.string().nullable(),
    questionCreated: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("UserQuestionProposalProjection");

const createSchema = z
  .object({
    questionText: z.string(),
    difficulty: z.string(),
    choices: z.array(z.string()),
    correctIndexes: z.array(z.number().int()),
    explanation: z.string(),
    categoryId: z.string().uuid(),
  })
  .openapi("CreateUserProposalRequest");

const updateSchema = z
  .object({
    questionText: z.string(),
    difficulty: z.string(),
    choices: z.array(z.string()),
    correctIndexes: z.array(z.number().int()),
    explanation: z.string(),
    categoryId: z.string().uuid(),
  })
  .openapi("UpdateUserProposalRequest");

const proposalIdParam = z.object({
  id: z.string().uuid(),
});

const proposalResponse = {
  200: {
    description: "出題案",
    content: { "application/json": { schema: questionProposalSchema } },
  },
} as const;

const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["UserProposal"],
  summary: "自分の出題案一覧を取得",
  request: {
    query: z.object({
      status: z
        .enum(["pending", "reviewed", "approved", "rejected", "withdrawn"])
        .optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      offset: z.coerce.number().int().min(0).default(0),
    }),
  },
  responses: {
    200: {
      description: "出題案一覧",
      content: {
        "application/json": {
          schema: z.object({
            items: z.array(projectionSchema),
            total: z.number().int(),
          }),
        },
      },
    },
  },
});

const getRoute = createRoute({
  method: "get",
  path: "/:id",
  tags: ["UserProposal"],
  summary: "自分の出題案詳細を取得",
  request: {
    params: proposalIdParam,
  },
  responses: {
    200: {
      description: "出題案詳細",
      content: {
        "application/json": { schema: projectionSchema },
      },
    },
    403: {
      description: "権限がありません",
      content: { "application/json": { schema: errorSchema } },
    },
    404: {
      description: "見つかりません",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

const createProposalRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["UserProposal"],
  summary: "出題案を新規作成",
  request: {
    body: { content: { "application/json": { schema: createSchema } } },
  },
  responses: proposalResponse,
});

const updateProposalRoute = createRoute({
  method: "put",
  path: "/:id",
  tags: ["UserProposal"],
  summary: "出題案を編集",
  request: {
    params: proposalIdParam,
    body: { content: { "application/json": { schema: updateSchema } } },
  },
  responses: proposalResponse,
});

const submitRoute = createRoute({
  method: "post",
  path: "/:id/submit",
  tags: ["UserProposal"],
  summary: "出題案を申請",
  request: {
    params: proposalIdParam,
  },
  responses: proposalResponse,
});

export const createUserProposalsRoute = (deps: Dependencies) =>
  new OpenAPIHono<AuthEnv>()
    .openapi(listRoute, async (c) => {
      const user = c.get("user");
      const { status, limit, offset } = c.req.valid("query");
      const result = await deps.listUserProposals.execute(
        user.id,
        status,
        limit,
        offset,
      );
      return c.json({
        items: result.items.map(toProjectionResponse),
        total: result.total,
      });
    })
    .openapi(getRoute, async (c) => {
      const user = c.get("user");
      const { id } = c.req.valid("param");
      const proposal = await deps.getQuestionProposal.execute(id);
      if (!proposal) {
        return c.json({ error: "Not found" }, 404);
      }
      if (proposal.userId !== user.id) {
        return c.json({ error: "Forbidden" }, 403);
      }
      return c.json(toProjectionResponse(proposal), 200);
    })
    .openapi(createProposalRoute, async (c) => {
      const user = c.get("user");
      const input = c.req.valid("json");
      const proposal = await deps.createQuestionProposal.execute({
        ...input,
        userId: user.id,
      });
      return c.json(toQuestionProposalResponse(proposal));
    })
    .openapi(updateProposalRoute, async (c) => {
      const user = c.get("user");
      const { id } = c.req.valid("param");
      const existing = await deps.getQuestionProposal.execute(id);
      if (!existing) {
        throw new HTTPException(404, { message: "Not found" });
      }
      if (existing.userId !== user.id) {
        throw new HTTPException(403, { message: "Forbidden" });
      }
      const input = c.req.valid("json");
      const proposal = await deps.updateQuestionProposal.execute({
        questionProposalId: id,
        ...input,
      });
      return c.json(toQuestionProposalResponse(proposal));
    })
    .openapi(submitRoute, async (c) => {
      const user = c.get("user");
      const { id } = c.req.valid("param");
      const existing = await deps.getQuestionProposal.execute(id);
      if (!existing) {
        throw new HTTPException(404, { message: "Not found" });
      }
      if (existing.userId !== user.id) {
        throw new HTTPException(403, { message: "Forbidden" });
      }
      const proposal = await deps.submitQuestionProposal.execute({
        questionProposalId: id,
      });
      return c.json(toQuestionProposalResponse(proposal));
    });
