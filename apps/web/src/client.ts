import { hc } from "hono/client";
import type { AppType } from "../../api/src/app";

export const client = hc<AppType>(import.meta.env.VITE_API_URL, {
  init: { credentials: "include" },
});
