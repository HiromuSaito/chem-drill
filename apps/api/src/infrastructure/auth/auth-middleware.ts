import { createMiddleware } from "hono/factory";
import { auth } from "./auth.js";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type AuthEnv = {
  Variables: {
    user: SessionUser;
    session: typeof auth.$Infer.Session.session;
  };
};

export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role ?? "user",
  });
  c.set("session", session.session);
  await next();
});

export const requireAdmin = createMiddleware<AuthEnv>(async (c, next) => {
  const user = c.get("user");
  if (user.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }
  await next();
});
