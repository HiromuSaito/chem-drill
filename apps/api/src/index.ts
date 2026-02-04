import { serve } from "@hono/node-server";
import app from "./app";

export type { AppRouter } from "./interface/trpc/router";

const port = 3001;

serve({ fetch: app.fetch, port }, () => {
  console.log(`API server running on http://localhost:${port}`);
});
