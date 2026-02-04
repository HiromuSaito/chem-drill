import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { initTRPC } from "@trpc/server";

const t = initTRPC.create();

const appRouter = t.router({
  health: t.procedure.query(() => ({ status: "ok" })),
});

export type AppRouter = typeof appRouter;

const app = new Hono();

app.use("*", cors({ origin: "http://localhost:5173" }));
app.use("/trpc/*", trpcServer({ router: appRouter }));

app.get("/", (c) => c.json({ message: "Chem Drill API" }));

const port = 3001;
serve({ fetch: app.fetch, port }, () => {
  console.log(`API server running on http://localhost:${port}`);
});

export default app;
