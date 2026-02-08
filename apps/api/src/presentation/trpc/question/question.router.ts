import { router, publicProcedure } from "../trpc";
import { toQuestionResponse } from "./type";

export const questionRouter = router({
  getRandomQuestions: publicProcedure.query(async ({ ctx }) => {
    const questions = await ctx.deps.getRandomQuestions();
    return questions.map((q) => toQuestionResponse(q));
  }),
});
