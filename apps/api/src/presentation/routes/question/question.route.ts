import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Dependencies } from "../../../composition-root.js";
import {
  toQuestionWithCategoryResponse,
  toCreatedQuestionResponse,
} from "./type.js";

const createQuestionSchema = z.object({
  text: z.string(),
  difficulty: z.string(),
  choices: z.array(z.string()),
  correctIndexes: z.array(z.number().int()),
  explanation: z.string(),
  categoryId: z.string().uuid(),
});

export const createQuestionRoute = (deps: Dependencies) =>
  new Hono()
    .get("/random", async (c) => {
      const questions = await deps.getRandomQuestions.execute();
      return c.json(questions.map((q) => toQuestionWithCategoryResponse(q)));
    })
    .post("/create", zValidator("json", createQuestionSchema), async (c) => {
      const input = c.req.valid("json");
      const question = await deps.createQuestion.execute(input);
      return c.json(toCreatedQuestionResponse(question));
    });
