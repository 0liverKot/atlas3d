import { PrismaClient } from "../generated/prisma";
import { readFile } from "node:fs/promises";

const RESULTS_FILE = "prisma/traceroute-results.json";
const TRACEROUTES_FILE = "prisma/cleanedtraceroutes.txt";
const BATCH_SIZE = 50;

const PING_RESULTS_FILE = "prisma/ping-results.json"
const PINGS_FILE = "prisma/domains.txt"

type TraceRouteResult = {
    fw: number;
    prb_id: number;
    result: {
        hop: number;
        result: [{
            from: string;
            rtt: number;
        }];
    };
}[];

type TimeoutResult = {
  type: "Timeout";
  x: string;
};

type ErrorResult = {
  type: "Error";
  error: string;
};

type ReplyResult = {
  type: "Reply";
  rtt: number;
};

type PingProbeResult = TimeoutResult | ErrorResult | ReplyResult

type PingResult = {
    fw: number;
    prb_id: number;
    min: number;
    avg: number;
    max: number;
    result: PingProbeResult[]
}[];

type Metadata = {
    id: number;
    domain: string;
    probes: number;
};

type Probe = {
    id: number;
    status: { id: number }
    geometry: { coordinates: [number, number] };
}

async function loadMetadata(): Promise<Map<number, Metadata>> {
    const data = await readFile(PINGS_FILE, "utf8");
    const map = new Map<number, Metadata>();

    for (const line of data.split("\n").filter(l => l.trim())) {
        const id = parseInt(line.split("|")[0]?.split(":")[1]?.trim() ?? "");
        const domain = line.split("|")[1]?.split(":")[1]?.trim() ?? "";
        const probes = parseInt(line.split("|")[2]?.split(":")[1]?.trim() ?? "");

        if (!isNaN(id) && domain && !isNaN(probes)) {
            map.set(id, { id, domain, probes });
        }
    }

    return map;
}

async function getAllProbes(): Promise<Probe[]> {
    const probes: Probe[] = [];
    const pageSize = 500; // 500 seems to be the max page size

    // large amount of data requires looping through each page 
    for(let page = 1;; page++) {
        const res = await fetch(`https://atlas.ripe.net/api/v2/probes/?page=${page}&page_size=${pageSize}`)

        if (!res.ok) {
            throw new Error(`RIPE Atlas APi error' ${res.status}`);
        }

        const data = await res.json() as {results: Probe[]};
        probes.push(...data.results);

        if (data.results.length < pageSize) break;
    }

    return probes;
}

async function main() {
    const db = new PrismaClient();

    try {

        // probe seeding
        /*
        const probes = await getAllProbes();
        const data = probes.
            filter((p) => p.status.id === 1 && p.geometry).// only use probes that are connected and have a location listed
            map((p) => ({
                id: p.id,
                latitude: p.geometry.coordinates[1],
                longitude: p.geometry.coordinates[0],
            }))

            const { count } = await db.probe.createMany({ data, skipDuplicates: true});
            console.log(`Seeding complete, ${count} probes added`)
        */

        // traceroutes seeding
        /*
        const metadata = await loadMetadata();
        const results = JSON.parse(await readFile(RESULTS_FILE, "utf8")) as Record<string, TraceRouteResult>;

        const entries = Object.entries(results);
        console.log(`Seeding ${entries.length} traceroutes in batches of ${BATCH_SIZE}...`);

        let totalSeeded = 7;

        for (let i = 344; i < entries.length; i += BATCH_SIZE) {
            const batch = entries.slice(i, i + BATCH_SIZE)
                .map(([idStr, result]) => {
                    const id = parseInt(idStr);
                    const meta = metadata.get(id);
                    if (!meta) return null;
                    return { id, domain: meta.domain, probes: meta.probes, results: result };
                })
                .filter((t): t is TraceRoute => t !== null);

            if (batch.length === 0) continue;

            const { count } = await db.traceRoute.createMany({ data: batch, skipDuplicates: true });
            totalSeeded += count;
            console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${count} seeded (${totalSeeded} total)`);
        }

        console.log(`Seeding complete, ${totalSeeded} traceroutes added`);
        */
        

        // ping seeding 
        const metadata = await loadMetadata();
        const results = JSON.parse(await readFile(PING_RESULTS_FILE, "utf8")) as Record<string, PingResult>;

        const entries = Object.entries(results)
        
        const data = entries
            .map(([idStr, result]) => {
                const id = parseInt(idStr)
                const meta = metadata.get(id)
                if(!meta) return null
                return {id, domain: meta.domain, probes: meta.probes, result: result}
            }) 


        const { count } = await db.ping.createMany({data, skipDuplicates: true})
        console.log(`Seeding complete, ${count} pings added`);

    } finally {
        await db.$disconnect();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});