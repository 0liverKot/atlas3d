import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { getPing } from "~/server/dataStore/DataStore";
import { fetchAllPingMetaData } from "../ping";

export const pingRouter = createTRPCRouter({
    getPing: publicProcedure
    .input(z.number())
    .query(async ({input}) => {
        return getPing(input)
    }),
    getMetadata: publicProcedure
    .query(async () => {
        return fetchAllPingMetaData()
    })
})