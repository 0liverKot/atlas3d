import { db } from "../db"
import { tracerouteSchema} from "./schemas/db"

export async function fetchTraceroute(tracerouteId: number) {
    const traceroute = await db.traceRoute.findFirst({
        where: { id: tracerouteId }
    }).catch((e) => {
        console.error("Prisma Error Getting Ping Measurement", e)
    })

    return tracerouteSchema.parse(traceroute)
}