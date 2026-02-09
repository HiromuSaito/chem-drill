import { router, publicProcedure } from "./trpc";
import { questionRouter } from "./question/question.router";
import { questionProposalRouter } from "./question-proposal/question-proposal.router";

export const appRouter = router({
  health: publicProcedure.query(() => ({ status: "ok" })),

  question: questionRouter,
  questionProposal: questionProposalRouter,
});

export type AppRouter = typeof appRouter;
