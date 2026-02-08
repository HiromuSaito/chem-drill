import { initTRPC } from "@trpc/server";
import { consoleLogger, type Logger } from "../../lib/logger";
import type { Dependencies } from "../../composition-root";

export type Context = {
  logger: Logger;
  deps: Dependencies;
  [key: string]: unknown;
};

export const createContext = (deps: Dependencies): Context => ({
  logger: consoleLogger,
  deps,
});

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
