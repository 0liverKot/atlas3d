import { readFile, writeFile } from "node:fs/promises";

const RESULTS_FILE = "prisma/ping-results.json";
const PROGRESS_FILE = "prisma/fetch-ping-progress.json";
const DELAY_MS = 100;

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

type Ping = {
    id: number;
    domain: string;
    probes: number;
}

async function parseDomains(): Promise<Ping[]> {
    const data = await readFile("prisma/domains.txt", "utf-8")

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

async function fetchPingResult(id: number): Promise<PingResult | null> {
    const res = await fetchWithTimeout(`https://atlas.ripe.net/api/v2/measurements/${id}/results`);

    if (!res || !res.ok) {
        return null;
    }
    
    const text = await res.text();
    if (!text) {
        return null;
    }

    const raw = JSON.parse(text) as Record<string, unknown>[];

    const mapped = raw
        .filter((r): r is Record<string, unknown> & { fw: number; prb_id: number; result: PingResult[0]["result"] } =>
            typeof r === "object" && r !== null && "fw" in r && r.fw !== 1
        )
        .map(r => ({
            fw: r.fw as number,
            prb_id: r.prb_id as number,
            min: r.min as number,
            avg: r.avg as number,
            max: r.max as number,
            result: r.result as PingResult[0]["result"],
        }));

    
    // clean so only one set of results per probe
    const uniquePrbs: number[] = []
    const cleanedResult: PingResult = []
    mapped.forEach((result) => {
        if (!uniquePrbs.includes(result.prb_id)) {
            uniquePrbs.push(result.prb_id)
            cleanedResult.push(result)
        } 
    })

    return cleanedResult;
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

async function loadExistingResults(): Promise<Record<number, PingResult>> {
    try {
        const data = await readFile(RESULTS_FILE, "utf8");
        return JSON.parse(data) as Record<number, PingResult>;
    } catch {
        return {};
    }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    const pings = await parseDomains();
    console.log(`Found ${pings.length} pings to fetch`)

    const completed = await loadProgress();
    const results = await loadExistingResults();
    const pending = pings.filter(t => !completed.has(t.id))

    console.log(`Already fetched: ${completed.size}, remaining: ${pending.length}`)

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < pending.length; i++) {
        const {id, domain } = pending[i]!;

        process.stdout.write(`[${completed.size + i + 1}/${pings.length}] ${domain} (${id})... `);

        const result = await fetchPingResult(id)
        
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
