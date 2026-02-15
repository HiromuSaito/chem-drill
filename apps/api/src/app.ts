import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createApiRoutes } from "./presentation/routes/index.js";
import { dependencies } from "./composition-root";
import { consoleLogger } from "./lib/logger";
import { DomainConflictError } from "./domain/errors.js";
import { Scalar } from "@scalar/hono-api-reference";
import { OpenAPIHono } from "@hono/zod-openapi";
import { auth } from "./infrastructure/auth/auth.js";

const app = new OpenAPIHono();

// --------------- Middleware ---------------

app.doc("/doc", {
  openapi: "3.0.0",
  info: { title: "Chem Drill API", version: "1.0.0" },
});
app.get("/docs", Scalar({ url: "/doc" }));

app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  }),
);

// --------------- Auth routes (Better Auth) ---------------
// app.use で登録することで app.route("/api", ...) 内の requireAuth より先に実行される
app.use("/api/auth/*", async (c) => {
  return auth.handler(c.req.raw);
});

app.use(logger());

app.onError((err, c) => {
  if (err instanceof DomainConflictError) {
    return c.json({ error: err.message }, 409);
  }
  consoleLogger.error("Unexpected error", { error: err, path: c.req.path });
  return c.json({ error: "Internal Server Error" }, 500);
});

// --------------- API routes ---------------
const apiRoutes = createApiRoutes(dependencies);
const routes = app
  .route("/api", apiRoutes)
  .get("/", (c) => c.json({ message: "Chem Drill API" }));

export default routes;
export type AppType = typeof routes;
