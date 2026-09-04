import { z } from "zod";

export const pingProbeResultSchema = z.array(
    z.union([   
        z.object({rtt: z.number()}),
        z.object({x: z.string()}),
        z.object({error: z.string()})
    ])
)

export const pingResultSchema = z.object({
    avg: z.number(),
    max: z.number(),
    min: z.number(),
    prb_id: z.number(), 
    result: pingProbeResultSchema
})

export const pingSchema = z.object({
    id: z.number(),
    domain: z.string(),
    probes: z.number(),
    result: z.array(pingResultSchema)
})

export type Ping = z.infer<typeof pingSchema>
export type Pingresult = z.infer<typeof pingResultSchema>
export type PingProbeResult = z.infer<typeof pingProbeResultSchema>