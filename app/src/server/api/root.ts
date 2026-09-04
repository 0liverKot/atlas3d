import { createCallerFactory, createTRPCRouter, t } from "~/server/api/trpc";
import { atlasRouter } from "./routers/atlas";
import EventEmitter, { on } from "node:events";
import type { DnsResponse } from "./schemas/dnsResponseSchema";
import "../dataStore/dataStore"
import { probeRouter } from "./routers/probe";
import type { Probe } from "./schemas/db";
import { pingRouter } from "./routers/ping";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */

export const ee = new EventEmitter();

export const appRouter = createTRPCRouter({
  atlas: atlasRouter,
  probe: probeRouter,
  ping: pingRouter,

  onCacheUpdate: t.procedure.subscription(async function* (opts) {
    for await (const [data] of on(ee, 'update', {
        signal: opts.signal
    })) {
        yield data as {measurement: DnsResponse, probes: Map<number, Probe>};
    }
  })
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
