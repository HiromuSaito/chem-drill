import { type CreateTRPCReact, createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../api/src/index";

export const trpc: CreateTRPCReact<AppRouter, unknown> =
  createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "http://localhost:3001/trpc",
    }),
  ],
});
