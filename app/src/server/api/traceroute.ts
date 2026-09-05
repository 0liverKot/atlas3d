import z from "zod"
import { db } from "../db"
import { metaDataSchema, tracerouteSchema} from "./schemas/db"

export async function fetchTraceroute(tracerouteId: number) {
    const traceroute = await db.traceRoute.findFirst({
        where: { id: tracerouteId }
    }).catch((e) => {
        console.error("Prisma Error Getting Ping Measurement", e)
    })

    return tracerouteSchema.parse(traceroute)
}

export async function fetchAllTracerouteMetaData() {
    const metaData = await db.traceRoute.findMany({
        select: {
            id: true,
            domain: true,
            probes: true
        }
    }).catch((e) => {
        console.error("Prisma Error Getting Metadata For Traceroute Measurements", e)
    })

    return z.array(metaDataSchema).parse(metaData)
}