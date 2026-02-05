import { router, publicProcedure } from "./trpc";
import { getSessionUseCase } from "../../application/question/getSessionUseCase";

export const questionRouter = router({
  getSession: publicProcedure.query(() => {
    return getSessionUseCase();
  }),
});
