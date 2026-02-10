import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Dependencies } from "../../../composition-root.js";
import { toQuestionProposalResponse } from "./type.js";

const createQuestionProposalSchema = z.object({
  questionText: z.string(),
  difficulty: z.string(),
  choices: z.array(z.string()),
  correctIndexes: z.array(z.number().int()),
  explanation: z.string(),
  categoryId: z.string().uuid(),
});

const updateQuestionProposalSchema = z.object({
  questionProposalId: z.string().uuid(),
  questionText: z.string(),
  difficulty: z.string(),
  choices: z.array(z.string()),
  correctIndexes: z.array(z.number().int()),
  explanation: z.string(),
  categoryId: z.string().uuid(),
});

const approveQuestionProposalSchema = z.object({
  questionProposalId: z.string().uuid(),
});

const rejectQuestionProposalSchema = z.object({
  questionProposalId: z.string().uuid(),
  rejectReason: z.string(),
});

const generateFromUrlSchema = z.object({
  url: z.string().url(),
  categoryId: z.string().uuid(),
});

export const createQuestionProposalRoute = (deps: Dependencies) =>
  new Hono()
    .post(
      "/create",
      zValidator("json", createQuestionProposalSchema),
      async (c) => {
        const input = c.req.valid("json");
        const proposal = await deps.createQuestionProposal.execute(input);
        return c.json(toQuestionProposalResponse(proposal));
      },
    )
    .post(
      "/update",
      zValidator("json", updateQuestionProposalSchema),
      async (c) => {
        const input = c.req.valid("json");
        const proposal = await deps.updateQuestionProposal.execute(input);
        return c.json(toQuestionProposalResponse(proposal));
      },
    )
    .post(
      "/approve",
      zValidator("json", approveQuestionProposalSchema),
      async (c) => {
        const input = c.req.valid("json");
        const proposal = await deps.approveQuestionProposal.execute(input);
        return c.json(toQuestionProposalResponse(proposal));
      },
    )
    .post(
      "/reject",
      zValidator("json", rejectQuestionProposalSchema),
      async (c) => {
        const input = c.req.valid("json");
        const proposal = await deps.rejectQuestionProposal.execute(input);
        return c.json(toQuestionProposalResponse(proposal));
      },
    )
    .post(
      "/generate-from-url",
      zValidator("json", generateFromUrlSchema),
      async (c) => {
        const input = c.req.valid("json");
        const proposals = await deps.generateQuestionProposals.execute(input);
        return c.json(proposals.map(toQuestionProposalResponse));
      },
    );
