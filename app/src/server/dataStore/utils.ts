import type { Probe } from "../api/schemas/db";
import type { DnsResponse } from "../api/schemas/dnsResponseSchema";

export function findMissingProbes(dnsResponse: DnsResponse, currentProbes: Map<number, Probe>): number[] {
    
    const requiredIDs = dnsResponse.map((item) => item.prb_id)
    const currentIDs = Array.from(currentProbes.keys())

    return requiredIDs.filter((item) => !currentIDs.includes(item))
}