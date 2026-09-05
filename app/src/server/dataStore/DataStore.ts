import type { DnsResponse } from "../api/schemas/dnsResponseSchema"
import { getMeasurementOfPopularDomains } from "../api/atlas"
import { findMissingProbes } from "./utils"
import { ee } from "../api/root"
import type { Probe, Ping, Traceroute } from "../api/schemas/db"
import { getProbes } from "../api/probe"
import { fetchPing } from "../api/ping"
import { fetchTraceroute } from "../api/traceroute"

interface DataStore {

    popularDomains: {
        measurement: DnsResponse | null 
        probes: Map<number, Probe>
    }
    pings: Map<number, Ping>
    traceroutes: Map<number, Traceroute>
}

const store: DataStore = {
    
    popularDomains: {
        measurement: null,
        probes: new Map
    },
    pings:  new Map,
    traceroutes: new Map
}

export async function getPing(id: number) {
    // check datastore if ping has been cached 
    const ping = store.pings.get(id)
    if (ping) return ping;

    return fetchPing(id);
}

export async function getTraceroute(id: number) {
    // check datastore if traceroute has been cached 
    const traceroute = store.traceroutes.get(id)
    if (traceroute) return traceroute

    return fetchTraceroute(id)
}

export async function updatePopularDomains() {

    try { 
        const data = await getMeasurementOfPopularDomains()
        store.popularDomains.measurement = data 

        const probeIds = findMissingProbes(store.popularDomains.measurement, store.popularDomains.probes);
        
        if (probeIds.length > 0) {
            const probes = await getProbes(probeIds)
            probes.forEach((probe) => {
                store.popularDomains.probes.set(probe.id, probe)
            })     
        }
        ee.emit('update', store.popularDomains)
    
    }catch(err) {
        console.error('Cache Update Failed: ', err)
    }
}

async function poll() {
    await updatePopularDomains()
    setTimeout(() => { void poll() }, 1000)
}

void poll()