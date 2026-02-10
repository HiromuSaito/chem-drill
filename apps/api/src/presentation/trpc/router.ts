import { router, publicProcedure } from "./trpc";
import { categoryRouter } from "./category/category.router";
import { questionRouter } from "./question/question.router";
import { questionProposalRouter } from "./question-proposal/question-proposal.router";

export const appRouter = router({
  health: publicProcedure.query(() => ({ status: "ok" })),

  category: categoryRouter,
  question: questionRouter,
  questionProposal: questionProposalRouter,
});

export type AppRouter = typeof appRouter;
