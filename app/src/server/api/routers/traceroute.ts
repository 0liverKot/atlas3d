import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { getTraceroute } from "~/server/dataStore/DataStore";

export const traceoruteRouter = createTRPCRouter({
    getTraceroute: publicProcedure
    .input(z.number())
    .query(async ({input}) => {
        return getTraceroute(input)
    })
})