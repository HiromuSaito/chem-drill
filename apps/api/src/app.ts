import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createApiRoutes } from "./presentation/routes/index.js";
import { dependencies } from "./composition-root";
import { consoleLogger } from "./lib/logger";

const app = new Hono();

// --------------- Middleware ---------------
app.use("*", cors({ origin: "http://localhost:5173" }));
app.use(logger());

app.onError((err, c) => {
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
