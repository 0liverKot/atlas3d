import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { getPingAndProbes } from "~/server/dataStore/DataStore";
import { fetchAllPingMetaData } from "../ping";

export const pingRouter = createTRPCRouter({
    getPingAndProbes: publicProcedure
    .input(z.number())
    .query(async ({input}) => {
        return getPingAndProbes(input)
    }),
    getMetadata: publicProcedure
    .query(async () => {
        return fetchAllPingMetaData()
    })
})