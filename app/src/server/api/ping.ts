import z from "zod"
import { db } from "../db"
import { pingSchema,metaDataSchema } from "./schemas/db"

export async function fetchPing(pingId: number) {
    const ping = await db.ping.findFirst({
        where: { id: pingId }
    }).catch((e) => {
        console.error("Prisma Error Getting Ping Measurement", e)
    })

    return pingSchema.parse(ping)
}

export async function fetchAllPingMetaData() {
    const metaData = await db.ping.findMany({
        select: {
            id: true,
            domain: true,
            probes: true
        }
    }).catch((e) => {
        console.error("Prisma Error Getting Metadata For Ping Measurements", e)
    })

    return z.array(metaDataSchema).parse(metaData)

}