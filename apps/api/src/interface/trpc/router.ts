import { sql } from "drizzle-orm";
import { router, publicProcedure } from "./trpc";
import { db } from "../../db";
import { questions } from "../../db/schema";

export const appRouter = router({
  health: publicProcedure.query(async () => {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(questions);
    return { status: "ok", questionsCount: row.count };
  }),
});

export type AppRouter = typeof appRouter;
