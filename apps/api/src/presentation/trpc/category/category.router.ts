import { z } from "zod";
import { router, publicProcedure } from "../trpc";

const createCategorySchema = z.object({
  name: z.string(),
});

export const categoryRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return await ctx.deps.listCategories.execute();
  }),

  create: publicProcedure
    .input(createCategorySchema)
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.deps.createCategory.execute(input);
      return { id: category.id as string, name: category.name.value };
    }),
});
