import { z } from "zod";

export const generatedQuestionSchema = z.object({
  questionText: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  choices: z.array(z.string()).min(4).max(8),
  correctIndexes: z.array(z.number().int().min(0)),
  explanation: z.string(),
});

export const questionGenerationResultSchema = z.array(generatedQuestionSchema);
