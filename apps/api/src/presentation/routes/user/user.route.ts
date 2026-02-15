import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Dependencies } from "../../../composition-root.js";

const checkUsernameRoute = createRoute({
  method: "get",
  path: "/check-username",
  tags: ["User"],
  summary: "ユーザー名の利用可能チェック",
  request: {
    query: z.object({
      username: z.string().regex(/^[a-z0-9_-]{3,20}$/),
    }),
  },
  responses: {
    200: {
      description: "チェック結果",
      content: {
        "application/json": {
          schema: z
            .object({ available: z.boolean() })
            .openapi("CheckUsernameResponse"),
        },
      },
    },
  },
});

export const createUserRoute = (deps: Dependencies) =>
  new OpenAPIHono().openapi(checkUsernameRoute, async (c) => {
    const { username } = c.req.valid("query");
    const available = await deps.checkUsernameAvailability.execute(username);
    return c.json({ available });
  });
