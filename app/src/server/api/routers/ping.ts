import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { getPing } from "~/server/dataStore/dataStore";

export const pingRouter = createTRPCRouter({
    getPing: publicProcedure
    .input(z.number())
    .query(async ({input}) => {
        return getPing(input)
    })
})