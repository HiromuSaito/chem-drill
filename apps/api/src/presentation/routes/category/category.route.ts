import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Dependencies } from "../../../composition-root.js";

const categorySchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
  })
  .openapi("Category");

const errorSchema = z.object({ error: z.string() });

const listRoute = createRoute({
  method: "get",
  path: "/",
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
  path: "/",
  tags: ["Category"],
  summary: "カテゴリを作成",
  request: {
    body: {
      content: { "application/json": { schema: createCategorySchema } },
    },
  },
  responses: {
    201: {
      description: "作成されたカテゴリ",
      content: {
        "application/json": { schema: createCategoryResponseSchema },
      },
    },
    409: {
      description: "カテゴリ名が重複",
      content: {
        "application/json": { schema: errorSchema },
      },
    },
  },
});

const categoryIdParam = z.object({
  id: z.string().uuid(),
});

const updateCategorySchema = z
  .object({
    name: z.string(),
  })
  .openapi("UpdateCategoryRequest");

const updateRoute = createRoute({
  method: "put",
  path: "/:id",
  tags: ["Category"],
  summary: "カテゴリを更新",
  request: {
    params: categoryIdParam,
    body: {
      content: { "application/json": { schema: updateCategorySchema } },
    },
  },
  responses: {
    200: {
      description: "更新されたカテゴリ",
      content: { "application/json": { schema: categorySchema } },
    },
    404: {
      description: "カテゴリが見つからない",
      content: { "application/json": { schema: errorSchema } },
    },
    409: {
      description: "カテゴリ名が重複",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

const deleteRoute = createRoute({
  method: "delete",
  path: "/:id",
  tags: ["Category"],
  summary: "カテゴリを削除",
  request: {
    params: categoryIdParam,
  },
  responses: {
    204: {
      description: "削除成功",
    },
    404: {
      description: "カテゴリが見つからない",
      content: { "application/json": { schema: errorSchema } },
    },
    409: {
      description: "関連データが存在するため削除不可",
      content: { "application/json": { schema: errorSchema } },
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
        201,
      );
    })
    .openapi(updateRoute, async (c) => {
      const { id } = c.req.valid("param");
      const input = c.req.valid("json");
      const category = await deps.updateCategory.execute({
        id,
        name: input.name,
      });
      return c.json(
        { id: category.id as string, name: category.name.value },
        200,
      );
    })
    .openapi(deleteRoute, async (c) => {
      const { id } = c.req.valid("param");
      await deps.deleteCategory.execute(id);
      return c.body(null, 204);
    });
