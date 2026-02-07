import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./interface/trpc/router";
import { createContext } from "./interface/trpc/trpc";
import { consoleLogger } from "./lib/logger";

const app = new Hono();

// --------------- Middleware ---------------
app.use("*", cors({ origin: "http://localhost:5173" }));
app.use(logger());

app.onError((err, c) => {
  consoleLogger.error("Unexpected error", { error: err, path: c.req.path });
  return c.json({ error: "Internal Server Error" }, 500);
});

// --------------- tRPC ---------------
app.use("/trpc/*", trpcServer({ router: appRouter, createContext }));

// --------------- HTTP routes ---------------
app.get("/", (c) => c.json({ message: "Chem Drill API" }));

// Webhook 等は interface/http/ から import して mount する
// 例: app.route("/webhook", webhookRoute);

export default app;
