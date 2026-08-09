import { z } from "zod";

export const dnsResponseResultSetSchema = z.object({
    qbuf: z.string(),
    result: z.object({
        rt: z.number(),
        size: z.number()
    })
})

export const dnsResponseProbeSchema = z.object({
    resultset: z.array(dnsResponseResultSetSchema),
    prb_id: z.number()
})

// invalid probes are silently discarded, repsonse from api is rather messy 
export const dnsResponseSchema = z.array(z.unknown()).transform((list) => {
    return list.flatMap((probe) => {
        const result = dnsResponseProbeSchema.safeParse(probe)
        return result.success ? [result.data] : []
    })
})

export type DnsResponse = z.infer<typeof dnsResponseSchema>
export type DnsResponseResultSet = z.infer<typeof dnsResponseResultSetSchema>