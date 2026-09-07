import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { getTracerouteAndProbes } from "~/server/dataStore/DataStore";
import { fetchAllTracerouteMetaData } from "../traceroute";

export const traceoruteRouter = createTRPCRouter({
    getTracerouteAndProbes: publicProcedure
    .input(z.number())
    .query(async ({input}) => {
        return getTracerouteAndProbes(input)
    }),
    getMetadata: publicProcedure
    .query(async () => {
        return fetchAllTracerouteMetaData()
    })
})