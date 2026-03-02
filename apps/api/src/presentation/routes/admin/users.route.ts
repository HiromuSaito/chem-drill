import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Dependencies } from "../../../composition-root.ts";

const userListItemSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    username: z.string().nullable(),
    role: z.string(),
    image: z.string().nullable(),
    createdAt: z.string(),
    lastLoginAt: z.string().nullable(),
  })
  .openapi("AdminUserListItem");

const listUsersRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Admin"],
  summary: "ユーザー一覧を取得",
  request: {
    query: z.object({
      search: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      offset: z.coerce.number().int().min(0).default(0),
    }),
  },
  responses: {
    200: {
      description: "ユーザー一覧",
      content: {
        "application/json": {
          schema: z.object({
            items: z.array(userListItemSchema),
            total: z.number().int(),
          }),
        },
      },
    },
  },
});

export const createAdminUsersRoute = (deps: Dependencies) =>
  new OpenAPIHono().openapi(listUsersRoute, async (c) => {
    const { search, limit, offset } = c.req.valid("query");
    const result = await deps.listUsers.execute(search, limit, offset);
    return c.json({
      items: result.items.map((item) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        username: item.username,
        role: item.role,
        image: item.image,
        createdAt: item.createdAt.toISOString(),
        lastLoginAt: item.lastLoginAt?.toISOString() ?? null,
      })),
      total: result.total,
    });
  });
