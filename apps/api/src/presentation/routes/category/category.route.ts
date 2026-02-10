import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Dependencies } from "../../../composition-root.js";

const createCategorySchema = z.object({
  name: z.string(),
});

export const createCategoryRoute = (deps: Dependencies) =>
  new Hono()
    .get("/list", async (c) => {
      const categories = await deps.listCategories.execute();
      return c.json(categories);
    })
    .post("/create", zValidator("json", createCategorySchema), async (c) => {
      const input = c.req.valid("json");
      const category = await deps.createCategory.execute(input);
      return c.json({ id: category.id as string, name: category.name.value });
    });
