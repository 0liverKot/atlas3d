import type { Probe, Traceroute, Ping } from "../api/schemas/db";
import type { DnsResponse } from "../api/schemas/dnsResponseSchema";

type StoreItem = Ping | Traceroute | Probe[];

export function assertPing(item: StoreItem): asserts item is Ping {
    if (Array.isArray(item) || !("result" in item)) {
        throw new Error("Expected a ping when updating the ping store");
    }
}

export function assertTraceroute(item: StoreItem): asserts item is Traceroute {
    if (Array.isArray(item) || !("results" in item)) {
        throw new Error("Expected a traceroute when updating the traceroute store");
    }
}

export function assertProbes(item: StoreItem): asserts item is Probe[] {
    if (!Array.isArray(item)) {
        throw new Error("Expected probes when updating the probe store");
    }
}

export function findMissingProbesPopularDomains(dnsResponse: DnsResponse, currentProbes: Map<number, Probe>): number[] {
    
    const requiredIDs = dnsResponse.map((item) => item.prb_id)
    const currentIDs = Array.from(currentProbes.keys())

    return requiredIDs.filter((item) => !currentIDs.includes(item))
}

export function findMissingProbes(requiredIDs: number[], currentIDs: number[]) {
    return requiredIDs.filter((item) => !currentIDs.includes(item))
}

export function getRequiredPingProbes(data: Ping) {
    return data.result.map((item) => item.prb_id)
}

export function getRequiredTracerouteProbes(data: Traceroute) {
    return data.results.map((item) => item.prb_id)
}