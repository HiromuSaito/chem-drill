import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Dependencies } from "../../../composition-root.js";
import { toQuestionProposalResponse } from "./type.js";

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
    questionProposalId: z.string().uuid(),
    questionText: z.string(),
    difficulty: z.string(),
    choices: z.array(z.string()),
    correctIndexes: z.array(z.number().int()),
    explanation: z.string(),
    categoryId: z.string().uuid(),
  })
  .openapi("UpdateQuestionProposalRequest");

const approveSchema = z
  .object({
    questionProposalId: z.string().uuid(),
  })
  .openapi("ApproveQuestionProposalRequest");

const rejectSchema = z
  .object({
    questionProposalId: z.string().uuid(),
    rejectReason: z.string(),
  })
  .openapi("RejectQuestionProposalRequest");

const generateFromUrlSchema = z
  .object({
    url: z.string().url(),
    categoryId: z.string().uuid(),
  })
  .openapi("GenerateFromUrlRequest");

const proposalResponse = {
  200: {
    description: "問題提案",
    content: { "application/json": { schema: questionProposalSchema } },
  },
} as const;

const createProposalRoute = createRoute({
  method: "post",
  path: "/create",
  tags: ["QuestionProposal"],
  summary: "問題提案を作成",
  request: {
    body: { content: { "application/json": { schema: createSchema } } },
  },
  responses: proposalResponse,
});

const updateProposalRoute = createRoute({
  method: "post",
  path: "/update",
  tags: ["QuestionProposal"],
  summary: "問題提案を更新",
  request: {
    body: { content: { "application/json": { schema: updateSchema } } },
  },
  responses: proposalResponse,
});

const approveProposalRoute = createRoute({
  method: "post",
  path: "/approve",
  tags: ["QuestionProposal"],
  summary: "問題提案を承認",
  request: {
    body: { content: { "application/json": { schema: approveSchema } } },
  },
  responses: proposalResponse,
});

const rejectProposalRoute = createRoute({
  method: "post",
  path: "/reject",
  tags: ["QuestionProposal"],
  summary: "問題提案を却下",
  request: {
    body: { content: { "application/json": { schema: rejectSchema } } },
  },
  responses: proposalResponse,
});

const generateFromUrlRoute = createRoute({
  method: "post",
  path: "/generate-from-url",
  tags: ["QuestionProposal"],
  summary: "URLから問題提案を自動生成",
  request: {
    body: {
      content: { "application/json": { schema: generateFromUrlSchema } },
    },
  },
  responses: {
    200: {
      description: "生成された問題提案一覧",
      content: {
        "application/json": { schema: z.array(questionProposalSchema) },
      },
    },
  },
});

export const createQuestionProposalRoute = (deps: Dependencies) =>
  new OpenAPIHono()
    .openapi(createProposalRoute, async (c) => {
      const input = c.req.valid("json");
      const proposal = await deps.createQuestionProposal.execute(input);
      return c.json(toQuestionProposalResponse(proposal));
    })
    .openapi(updateProposalRoute, async (c) => {
      const input = c.req.valid("json");
      const proposal = await deps.updateQuestionProposal.execute(input);
      return c.json(toQuestionProposalResponse(proposal));
    })
    .openapi(approveProposalRoute, async (c) => {
      const input = c.req.valid("json");
      const proposal = await deps.approveQuestionProposal.execute(input);
      return c.json(toQuestionProposalResponse(proposal));
    })
    .openapi(rejectProposalRoute, async (c) => {
      const input = c.req.valid("json");
      const proposal = await deps.rejectQuestionProposal.execute(input);
      return c.json(toQuestionProposalResponse(proposal));
    })
    .openapi(generateFromUrlRoute, async (c) => {
      const input = c.req.valid("json");
      const proposals = await deps.generateQuestionProposals.execute(input);
      return c.json(proposals.map(toQuestionProposalResponse));
    });
