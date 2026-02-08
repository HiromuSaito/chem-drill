import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import {
  toQuestionWithCategoryResponse,
  toCreatedQuestionResponse,
} from "./type";

const createQuestionSchema = z.object({
  text: z.string(),
  difficulty: z.string(),
  choices: z.array(z.string()),
  correctIndexes: z.array(z.number().int()),
  explanation: z.string(),
  categoryId: z.string().uuid(),
});

export const questionRouter = router({
  getRandomQuestions: publicProcedure.query(async ({ ctx }) => {
    const questions = await ctx.deps.getRandomQuestions();
    return questions.map((q) => toQuestionWithCategoryResponse(q));
  }),

  create: publicProcedure
    .input(createQuestionSchema)
    .mutation(async ({ ctx, input }) => {
      const question = await ctx.deps.createQuestion(input);
      return toCreatedQuestionResponse(question);
    }),
});
