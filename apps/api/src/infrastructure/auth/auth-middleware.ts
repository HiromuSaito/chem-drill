import { createMiddleware } from "hono/factory";
import { auth } from "./auth.js";

type SessionUser = {
  id: string;
  email: string;
  name: string;
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
  });
  c.set("session", session.session);
  await next();
});
