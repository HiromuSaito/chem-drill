import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
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

const proposalInputSchema = z
  .object({
    questionText: z.string(),
    difficulty: z.string(),
    choices: z.array(z.string()),
    correctIndexes: z.array(z.number().int()),
    explanation: z.string(),
    categoryId: z.string().uuid(),
  })
  .openapi("UserProposalInput");

const proposalIdParam = z.object({
  id: z.string().uuid(),
});

const userGenerateCandidatesSchema = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("url"),
      url: z.string().url(),
    }),
    z.object({
      type: z.literal("freeInput"),
      input: z.string().min(1).max(2000),
    }),
  ])
  .openapi("UserGenerateCandidatesRequest");

const generatedQuestionSchema = z
  .object({
    questionText: z.string(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    choices: z.array(z.string()).min(2).max(10),
    correctIndexes: z.array(z.number().int().min(0)).min(1).max(10),
    explanation: z.string(),
  })
  .openapi("UserGeneratedQuestion");

const userBulkCreateSchema = z
  .object({
    categoryId: z.string().uuid(),
    questions: z.array(generatedQuestionSchema).min(1).max(5),
  })
  .openapi("UserBulkCreateRequest");

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
    body: { content: { "application/json": { schema: proposalInputSchema } } },
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
    body: { content: { "application/json": { schema: proposalInputSchema } } },
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

const generateCandidatesRoute = createRoute({
  method: "post",
  path: "/generate-candidates",
  tags: ["UserProposal"],
  summary: "URL・キーワードからAI出題候補を生成（DB保存なし）",
  request: {
    body: {
      content: {
        "application/json": { schema: userGenerateCandidatesSchema },
      },
    },
  },
  responses: {
    200: {
      description: "生成された候補一覧",
      content: {
        "application/json": {
          schema: z.object({
            candidates: z.array(generatedQuestionSchema),
          }),
        },
      },
    },
  },
});

const bulkCreateRoute = createRoute({
  method: "post",
  path: "/bulk-create",
  tags: ["UserProposal"],
  summary: "選択した出題候補を一括登録",
  request: {
    body: {
      content: { "application/json": { schema: userBulkCreateSchema } },
    },
  },
  responses: {
    200: {
      description: "作成された出題案一覧",
      content: {
        "application/json": {
          schema: z.array(questionProposalSchema),
        },
      },
    },
  },
});

export const createUserProposalsRoute = (deps: Dependencies) =>
  new OpenAPIHono<AuthEnv>()
    .openapi(listRoute, async (c) => {
      const user = c.get("user");
      const { status, limit, offset } = c.req.valid("query");
      const result = await deps.listQuestionProposalsByUserId.execute(
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
      const proposal = await deps.getQuestionProposalByUser.execute(
        id,
        user.id,
      );
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
      const input = c.req.valid("json");
      const proposal = await deps.updateQuestionProposalByUser.execute({
        questionProposalId: id,
        ...input,
        callerId: user.id,
      });
      return c.json(toQuestionProposalResponse(proposal));
    })
    .openapi(submitRoute, async (c) => {
      const user = c.get("user");
      const { id } = c.req.valid("param");
      const proposal = await deps.submitQuestionProposalByUser.execute({
        questionProposalId: id,
        callerId: user.id,
      });
      return c.json(toQuestionProposalResponse(proposal));
    })
    .openapi(generateCandidatesRoute, async (c) => {
      const source = c.req.valid("json");
      const candidates = await deps.generateCandidates.execute(source);
      return c.json({ candidates: candidates.slice(0, 5) });
    })
    .openapi(bulkCreateRoute, async (c) => {
      const user = c.get("user");
      const input = c.req.valid("json");
      const proposals = await deps.bulkCreateQuestionProposals.execute({
        ...input,
        userId: user.id,
      });
      return c.json(proposals.map(toQuestionProposalResponse));
    });
