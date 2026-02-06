import { initTRPC } from "@trpc/server";
import { consoleLogger, type Logger } from "../../lib/logger";

export interface Context {
  logger: Logger;
  [key: string]: unknown;
}

export const createContext = (): Context => ({
  logger: consoleLogger,
});

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
