import { db } from "../db";
import { probeArraySchema } from "./schemas/db";

export async function fetchProbes(ids: number[]) {
    const probes = await db.probe.findMany({
        where: { id: { in: ids } }
    }).catch((e) => {
        console.error("Prisma Error Getting Probes", e)
    })

    return probeArraySchema.parse(probes)
}