import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { ICON_ALLOWED_TYPES, ICON_MAX_SIZE } from "shared";
import type { Dependencies } from "../../../composition-root.ts";
import { requireAuth } from "../../../infrastructure/auth/auth-middleware.ts";

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

const uploadIconRoute = createRoute({
  method: "post",
  path: "/icon",
  tags: ["User"],
  summary: "アイコン画像をアップロード",
  middleware: [requireAuth] as const,
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            file: z.any().openapi({ type: "string", format: "binary" }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "アップロード成功",
      content: {
        "application/json": {
          schema: z
            .object({ imageUrl: z.string() })
            .openapi("UploadIconResponse"),
        },
      },
    },
  },
});

const deleteIconRoute = createRoute({
  method: "delete",
  path: "/icon",
  tags: ["User"],
  summary: "アイコン画像を削除",
  middleware: [requireAuth] as const,
  responses: {
    200: {
      description: "削除成功",
      content: {
        "application/json": {
          schema: z
            .object({ success: z.boolean() })
            .openapi("DeleteIconResponse"),
        },
      },
    },
  },
});

export const createUserRoute = (deps: Dependencies) =>
  new OpenAPIHono()
    .openapi(checkUsernameRoute, async (c) => {
      const { username } = c.req.valid("query");
      const available = await deps.checkUsernameAvailability.execute(username);
      return c.json({ available });
    })
    .openapi(uploadIconRoute, async (c) => {
      const body = await c.req.parseBody();
      const file = body.file;

      if (!(file instanceof File)) {
        throw new HTTPException(400, {
          message: "ファイルが指定されていません",
        });
      }

      if (!ICON_ALLOWED_TYPES.includes(file.type)) {
        throw new HTTPException(400, {
          message: "JPEG、PNG、WebP、GIF のみアップロードできます",
        });
      }

      if (file.size > ICON_MAX_SIZE) {
        throw new HTTPException(400, {
          message: "ファイルサイズは 5MB 以下にしてください",
        });
      }

      const userId = c.get("user").id;
      const fileData = await file.arrayBuffer();
      const imageUrl = await deps.uploadIcon.execute(userId, fileData);

      return c.json({ imageUrl });
    })
    .openapi(deleteIconRoute, async (c) => {
      const userId = c.get("user").id;

      await deps.deleteIcon.execute(userId);

      return c.json({ success: true });
    });
