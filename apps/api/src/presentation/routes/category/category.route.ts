import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Dependencies } from "../../../composition-root.js";

const categorySchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
  })
  .openapi("Category");

const listRoute = createRoute({
  method: "get",
  path: "/list",
  tags: ["Category"],
  summary: "カテゴリ一覧を取得",
  responses: {
    200: {
      description: "カテゴリ一覧",
      content: { "application/json": { schema: z.array(categorySchema) } },
    },
  },
});

const createCategorySchema = z
  .object({
    name: z.string(),
  })
  .openapi("CreateCategoryRequest");

const createCategoryResponseSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
  })
  .openapi("CreateCategoryResponse");

const createRoute_ = createRoute({
  method: "post",
  path: "/create",
  tags: ["Category"],
  summary: "カテゴリを作成",
  request: {
    body: {
      content: { "application/json": { schema: createCategorySchema } },
    },
  },
  responses: {
    200: {
      description: "作成されたカテゴリ",
      content: {
        "application/json": { schema: createCategoryResponseSchema },
      },
    },
    409: {
      description: "カテゴリ名が重複",
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
    },
  },
});

export const createCategoryRoute = (deps: Dependencies) =>
  new OpenAPIHono()
    .openapi(listRoute, async (c) => {
      const categories = await deps.listCategories.execute();
      return c.json(categories);
    })
    .openapi(createRoute_, async (c) => {
      const input = c.req.valid("json");
      const category = await deps.createCategory.execute(input);
      return c.json(
        { id: category.id as string, name: category.name.value },
        200,
      );
    });
