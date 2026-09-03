import { readFile, writeFile } from "node:fs/promises";

const RESULTS_FILE = "prisma/traceroute-results.json";
const PROGRESS_FILE = "prisma/fetch-progress.json";
const DELAY_MS = 100;

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

type TraceRouteData = {
    id: number;
    domain: string;
    probes: number;
};

async function parseTraceroutes(): Promise<TraceRouteData[]> {
    const data = await readFile("prisma/cleanedtraceroutes.txt", "utf8");

    return data
        .split("\n")
        .filter(line => line.trim())
        .map(line => ({
            id: parseInt(line.split("|")[0]?.split(":")[1]?.trim() ?? ""),
            domain: line.split("|")[1]?.split(":")[1]?.trim() ?? "",
            probes: parseInt(line.split("|")[2]?.split(":")[1]?.trim() ?? ""),
        }))
        .filter(t => !isNaN(t.id) && t.domain && !isNaN(t.probes));
}

async function loadProgress(): Promise<Set<number>> {
    try {
        const data = await readFile(PROGRESS_FILE, "utf8");
        return new Set(JSON.parse(data) as number[]);
    } catch {
        return new Set();
    }
}

async function saveProgress(fetchedIds: number[]) {
    await writeFile(PROGRESS_FILE, JSON.stringify(fetchedIds));
}

async function loadExistingResults(): Promise<Record<number, TraceRouteResult>> {
    try {
        const data = await readFile(RESULTS_FILE, "utf8");
        return JSON.parse(data) as Record<number, TraceRouteResult>;
    } catch {
        return {};
    }
}

async function fetchWithTimeout(url: string, timeoutMs = 30000): Promise<Response | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { signal: controller.signal });
    } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
            return null;
        }
        throw e;
    } finally {
        clearTimeout(timeout);
    }
}

async function fetchTraceRouteResult(id: number): Promise<TraceRouteResult | null> {
    const res = await fetchWithTimeout(`https://atlas.ripe.net/api/v2/measurements/${id}/results`);

    if (!res || !res.ok) {
        return null;
    }

    const text = await res.text();
    if (!text) {
        return null;
    }

    const raw = JSON.parse(text) as Record<string, unknown>[];

    return raw
        .filter((r): r is Record<string, unknown> & { fw: number; prb_id: number; result: TraceRouteResult[0]["result"] } =>
            typeof r === "object" && r !== null && "fw" in r && r.fw !== 1
        )
        .map(r => ({
            fw: r.fw as number,
            prb_id: r.prb_id as number,
            result: r.result as TraceRouteResult[0]["result"],
        }));
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    const traceroutes = await parseTraceroutes();
    console.log(`Found ${traceroutes.length} traceroutes to fetch`);

    const completed = await loadProgress();
    const results = await loadExistingResults();
    const pending = traceroutes.filter(t => !completed.has(t.id));

    console.log(`Already fetched: ${completed.size}, remaining: ${pending.length}`);

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < pending.length; i++) {
        const { id, domain } = pending[i]!;

        process.stdout.write(`[${completed.size + i + 1}/${traceroutes.length}] ${domain} (${id})... `);

        const result = await fetchTraceRouteResult(id);

        if (result && result.length > 0 && result[0]!.fw !== 1) {
            results[id] = result;
            completed.add(id);
            successCount++;
            console.log("OK");
        } else {
            skipCount++;
            completed.add(id);
            console.log("SKIP");
        }

        if (i % 10 === 0) {
            await saveProgress([...completed]);
            await writeFile(RESULTS_FILE, JSON.stringify(results, null, 2));
        }

        if (i < pending.length - 1) {
            await sleep(DELAY_MS);
        }
    }

    await saveProgress([...completed]);
    await writeFile(RESULTS_FILE, JSON.stringify(results, null, 2));

    console.log(`\nDone! Fetched: ${successCount}, Skipped: ${skipCount}, Total: ${Object.keys(results).length}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
