import z from "zod";

export const probeSchema = z.object({
    id: z.number(),
    latitude: z.number(),
    longitude: z.number()
})

export const probeArraySchema = z.array(probeSchema)

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

export const tracerouteProbeResultSchema = z.array(z.object({
    hop: z.number(),
    error: z.string().optional(),
    result: z.array(z.union([
        z.object({
            x: z.string()
        }),
        z.object({
            error: z.string()
        }),
        z.object({
            from: z.string(),
            rtt: z.number().optional(),
            err: z.string().optional()
        })
    ])).optional()
}))

export const tracerouteResultSchema = z.object({
    prb_id: z.number(),
    result: tracerouteProbeResultSchema
})

export const tracerouteSchema = z.object({
    id: z.number(),
    domain: z.string(),
    probes: z.number(),
    results: z.array(tracerouteResultSchema)
})

export type Traceroute = z.infer<typeof tracerouteSchema>
export type TracerouteResult = z.infer<typeof tracerouteResultSchema>
export type TracerouteProbeResult = z.infer<typeof tracerouteProbeResultSchema>

export type Ping = z.infer<typeof pingSchema>
export type Pingresult = z.infer<typeof pingResultSchema>
export type PingProbeResult = z.infer<typeof pingProbeResultSchema>

export type Probe = z.infer<typeof probeSchema>