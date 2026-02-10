import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { toQuestionProposalResponse } from "./type";

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

export const questionProposalRouter = router({
  create: publicProcedure
    .input(createQuestionProposalSchema)
    .mutation(async ({ ctx, input }) => {
      const proposal = await ctx.deps.createQuestionProposal.execute(input);
      return toQuestionProposalResponse(proposal);
    }),

  update: publicProcedure
    .input(updateQuestionProposalSchema)
    .mutation(async ({ ctx, input }) => {
      const proposal = await ctx.deps.updateQuestionProposal.execute(input);
      return toQuestionProposalResponse(proposal);
    }),

  approve: publicProcedure
    .input(approveQuestionProposalSchema)
    .mutation(async ({ ctx, input }) => {
      const proposal = await ctx.deps.approveQuestionProposal.execute(input);
      return toQuestionProposalResponse(proposal);
    }),

  reject: publicProcedure
    .input(rejectQuestionProposalSchema)
    .mutation(async ({ ctx, input }) => {
      const proposal = await ctx.deps.rejectQuestionProposal.execute(input);
      return toQuestionProposalResponse(proposal);
    }),

  generateFromUrl: publicProcedure
    .input(generateFromUrlSchema)
    .mutation(async ({ ctx, input }) => {
      const proposals = await ctx.deps.generateQuestionProposals.execute(input);
      return proposals.map(toQuestionProposalResponse);
    }),
});
