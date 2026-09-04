import { z } from "zod";

export const PingProbeResult = z.array(
    z.union([   
        z.object({rtt: z.number()}),
        z.object({x: z.string()}),
        z.object({error: z.string()})
    ])
)

export const PingResult = z.object({
    avg: z.number(),
    max: z.number(),
    min: z.number(),
    prb_id: z.number(), 
    result: PingProbeResult
})

export const PingSchema = z.object({
    domain: z.string(),
    probes: z.number(),
    result: z.array(PingResult)
})