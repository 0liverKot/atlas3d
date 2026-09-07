import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../trpc'
import { fetchProbes } from '../probe'

export const probeRouter = createTRPCRouter({
    getProbes: publicProcedure
    .input(z.array(z.number()))
    .query(async ({input}) => {
        return fetchProbes(input)
    })
})