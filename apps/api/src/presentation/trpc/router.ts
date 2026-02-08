import { router, publicProcedure } from "./trpc";
import { questionRouter } from "./question/question.router";

export const appRouter = router({
  health: publicProcedure.query(() => ({ status: "ok" })),

  question: questionRouter,
});

export type AppRouter = typeof appRouter;
