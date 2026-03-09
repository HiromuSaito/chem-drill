import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Dependencies } from "../../../composition-root.ts";
import { errorSchema } from "../shared/schema.ts";
import { toQuestionProposalResponse, toProjectionResponse } from "./type.ts";

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
  .openapi("QuestionProposal");

const createSchema = z
  .object({
    questionText: z.string(),
    difficulty: z.string(),
    choices: z.array(z.string()),
    correctIndexes: z.array(z.number().int()),
    explanation: z.string(),
    categoryId: z.string().uuid(),
  })
  .openapi("CreateQuestionProposalRequest");

const updateSchema = z
  .object({
    questionText: z.string(),
    difficulty: z.string(),
    choices: z.array(z.string()),
    correctIndexes: z.array(z.number().int()),
    explanation: z.string(),
    categoryId: z.string().uuid(),
  })
  .openapi("UpdateQuestionProposalRequest");

const rejectSchema = z
  .object({
    rejectReason: z.string(),
  })
  .openapi("RejectQuestionProposalRequest");

const generateCandidatesSchema = z
  .object({
    url: z.string().url(),
  })
  .openapi("GenerateCandidatesRequest");

const generatedQuestionSchema = z
  .object({
    questionText: z.string(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    choices: z.array(z.string()),
    correctIndexes: z.array(z.number().int()),
    explanation: z.string(),
  })
  .openapi("GeneratedQuestion");

const bulkCreateSchema = z
  .object({
    categoryId: z.string().uuid(),
    questions: z.array(generatedQuestionSchema).min(1),
  })
  .openapi("BulkCreateQuestionProposalsRequest");

const questionProposalWithDatesSchema = z
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
  .openapi("QuestionProposalProjection");

const proposalIdParam = z.object({
  id: z.string().uuid(),
});

const proposalListRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["QuestionProposal"],
  summary: "出題案一覧を取得",
  request: {
    query: z.object({
      status: z
        .enum(["pending", "reviewed", "approved", "rejected", "withdrawn"])
        .optional(),
      categoryId: z.string().uuid().optional(),
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
            items: z.array(questionProposalWithDatesSchema),
            total: z.number().int(),
          }),
        },
      },
    },
  },
});

const proposalGetRoute = createRoute({
  method: "get",
  path: "/:id",
  tags: ["QuestionProposal"],
  summary: "出題案詳細を取得",
  request: {
    params: proposalIdParam,
  },
  responses: {
    200: {
      description: "出題案詳細",
      content: {
        "application/json": { schema: questionProposalWithDatesSchema },
      },
    },
    404: {
      description: "見つかりません",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
  },
});

const proposalResponse = {
  200: {
    description: "出題案",
    content: { "application/json": { schema: questionProposalSchema } },
  },
} as const;

const proposalCreateRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["QuestionProposal"],
  summary: "出題案を作成",
  request: {
    body: { content: { "application/json": { schema: createSchema } } },
  },
  responses: proposalResponse,
});

const proposalUpdateRoute = createRoute({
  method: "put",
  path: "/:id",
  tags: ["QuestionProposal"],
  summary: "出題案を更新",
  request: {
    params: proposalIdParam,
    body: { content: { "application/json": { schema: updateSchema } } },
  },
  responses: proposalResponse,
});

const proposalApproveRoute = createRoute({
  method: "post",
  path: "/:id/approve",
  tags: ["QuestionProposal"],
  summary: "出題案を承認",
  request: {
    params: proposalIdParam,
  },
  responses: proposalResponse,
});

const proposalRejectRoute = createRoute({
  method: "post",
  path: "/:id/reject",
  tags: ["QuestionProposal"],
  summary: "出題案を却下",
  request: {
    params: proposalIdParam,
    body: { content: { "application/json": { schema: rejectSchema } } },
  },
  responses: proposalResponse,
});

const proposalSubmitRoute = createRoute({
  method: "post",
  path: "/:id/submit",
  tags: ["QuestionProposal"],
  summary: "出題案を申請",
  request: {
    params: proposalIdParam,
  },
  responses: proposalResponse,
});

const proposalEditApprovedRoute = createRoute({
  method: "put",
  path: "/:id/edit-approved",
  tags: ["QuestionProposal"],
  summary: "承認済み出題案を編集（対応する問題も即時更新）",
  request: {
    params: proposalIdParam,
    body: { content: { "application/json": { schema: updateSchema } } },
  },
  responses: proposalResponse,
});

const proposalWithdrawRoute = createRoute({
  method: "post",
  path: "/:id/withdraw",
  tags: ["QuestionProposal"],
  summary: "出題案を取り下げ",
  request: {
    params: proposalIdParam,
  },
  responses: proposalResponse,
});

const generateCandidatesRoute = createRoute({
  method: "post",
  path: "/generate-candidates",
  tags: ["QuestionProposal"],
  summary: "URLからAI出題候補を生成（DB保存なし）",
  request: {
    body: {
      content: { "application/json": { schema: generateCandidatesSchema } },
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
  tags: ["QuestionProposal"],
  summary: "選択した出題候補を一括登録",
  request: {
    body: {
      content: { "application/json": { schema: bulkCreateSchema } },
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

export const createQuestionProposalsRoute = (deps: Dependencies) =>
  new OpenAPIHono()
    .openapi(proposalListRoute, async (c) => {
      const { status, categoryId, limit, offset } = c.req.valid("query");
      const result = await deps.listQuestionProposals.execute(
        status,
        categoryId,
        limit,
        offset,
      );
      return c.json({
        items: result.items.map(toProjectionResponse),
        total: result.total,
      });
    })
    .openapi(proposalGetRoute, async (c) => {
      const { id } = c.req.valid("param");
      const proposal = await deps.getQuestionProposalByAdmin.execute(id);
      if (!proposal) {
        return c.json({ error: "Not found" }, 404);
      }
      return c.json(toProjectionResponse(proposal), 200);
    })
    .openapi(proposalCreateRoute, async (c) => {
      const input = c.req.valid("json");
      const proposal = await deps.createQuestionProposal.execute(input);
      return c.json(toQuestionProposalResponse(proposal));
    })
    .openapi(proposalUpdateRoute, async (c) => {
      const { id } = c.req.valid("param");
      const input = c.req.valid("json");
      const proposal = await deps.updateQuestionProposalByAdmin.execute({
        questionProposalId: id,
        ...input,
      });
      return c.json(toQuestionProposalResponse(proposal));
    })
    .openapi(proposalEditApprovedRoute, async (c) => {
      const { id } = c.req.valid("param");
      const input = c.req.valid("json");
      const proposal = await deps.updateApprovedQuestionProposal.execute({
        questionProposalId: id,
        ...input,
      });
      return c.json(toQuestionProposalResponse(proposal));
    })
    .openapi(proposalApproveRoute, async (c) => {
      const { id } = c.req.valid("param");
      const proposal = await deps.approveQuestionProposal.execute({
        questionProposalId: id,
      });
      return c.json(toQuestionProposalResponse(proposal));
    })
    .openapi(proposalRejectRoute, async (c) => {
      const { id } = c.req.valid("param");
      const { rejectReason } = c.req.valid("json");
      const proposal = await deps.rejectQuestionProposal.execute({
        questionProposalId: id,
        rejectReason,
      });
      return c.json(toQuestionProposalResponse(proposal));
    })
    .openapi(proposalSubmitRoute, async (c) => {
      const { id } = c.req.valid("param");
      const proposal = await deps.submitQuestionProposalByAdmin.execute({
        questionProposalId: id,
      });
      return c.json(toQuestionProposalResponse(proposal));
    })
    .openapi(proposalWithdrawRoute, async (c) => {
      const { id } = c.req.valid("param");
      const proposal = await deps.withdrawQuestionProposal.execute({
        questionProposalId: id,
      });
      return c.json(toQuestionProposalResponse(proposal));
    })
    .openapi(generateCandidatesRoute, async (c) => {
      const { url } = c.req.valid("json");
      const candidates = await deps.generateCandidates.execute({ url });
      return c.json({ candidates });
    })
    .openapi(bulkCreateRoute, async (c) => {
      const input = c.req.valid("json");
      const proposals = await deps.bulkCreateQuestionProposals.execute(input);
      return c.json(proposals.map(toQuestionProposalResponse));
    });
