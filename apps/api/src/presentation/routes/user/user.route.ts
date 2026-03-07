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

const checkEmailRoute = createRoute({
  method: "get",
  path: "/check-email",
  tags: ["User"],
  summary: "メールアドレスの登録有無チェック",
  request: {
    query: z.object({
      email: z.string().email(),
    }),
  },
  responses: {
    200: {
      description: "チェック結果",
      content: {
        "application/json": {
          schema: z
            .object({ registered: z.boolean() })
            .openapi("CheckEmailResponse"),
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

const generateIconRoute = createRoute({
  method: "post",
  path: "/icon/generate",
  tags: ["User"],
  summary: "AIでアイコン画像を生成",
  middleware: [requireAuth] as const,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            color: z.string().min(1),
            element: z.string().min(1),
            style: z.enum(["cute", "cool", "simple", "science"]),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "生成成功",
      content: {
        "application/json": {
          schema: z
            .object({
              candidates: z.array(
                z.object({ url: z.string(), key: z.string() }),
              ),
            })
            .openapi("GenerateIconResponse"),
        },
      },
    },
  },
});

const selectIconRoute = createRoute({
  method: "post",
  path: "/icon/select",
  tags: ["User"],
  summary: "生成されたアイコン候補から1つを選択",
  middleware: [requireAuth] as const,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            selectedKey: z.string().min(1),
            rejectedKeys: z.array(z.string()),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "選択成功",
      content: {
        "application/json": {
          schema: z
            .object({ imageUrl: z.string() })
            .openapi("SelectIconResponse"),
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
    .openapi(checkEmailRoute, async (c) => {
      const { email } = c.req.valid("query");
      const registered = await deps.checkEmailRegistered.execute(email);
      return c.json({ registered });
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
    })
    .openapi(generateIconRoute, async (c) => {
      const userId = c.get("user").id;
      const body = c.req.valid("json");

      try {
        const result = await deps.generateIcon.execute(userId, body);
        return c.json(result);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (
          message.includes("429") ||
          message.includes("Resource exhausted") ||
          message.includes("RESOURCE_EXHAUSTED")
        ) {
          throw new HTTPException(429, {
            message:
              "現在生成が混み合っています。しばらく待ってからお試しください",
          });
        }
        throw new HTTPException(500, {
          message: "画像生成に失敗しました",
        });
      }
    })
    .openapi(selectIconRoute, async (c) => {
      const userId = c.get("user").id;
      const body = c.req.valid("json");
      const result = await deps.selectIcon.execute(userId, body);
      return c.json(result);
    });
