import type { Probe } from "../api/schemas/db";
import type { DnsResponse } from "../api/schemas/dnsResponseSchema";

export function findMissingProbes(dnsResponse: DnsResponse, currentProbes: Probe[]): number[] {
    
    const requiredIDs = dnsResponse.map((item) => item.prb_id)
    const currentIDs = currentProbes.map((item) => item.id)

    return requiredIDs.filter((item) => !currentIDs.includes(item))
}