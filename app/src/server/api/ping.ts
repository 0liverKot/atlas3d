import { db } from "../db"
import { pingSchema } from "./schemas/ping"

export async function fetchPing(pingId: number) {
    const ping = await db.ping.findFirst({
        where: { id: pingId }
    }).catch((e) => {
        console.error("Prisma Error Getting Ping Measurement", e)
    })

    return pingSchema.parse(ping)
}