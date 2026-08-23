import type { DnsResponse } from "../api/schemas/dnsResponseSchema"
import { getMeasurementOfPopularDomains } from "../api/atlas"
import { findMissingProbes } from "./utils"
import { ee } from "../api/root"
import type { Probe } from "../api/schemas/db"
import { getProbes } from "../api/probe"

interface DataStore {

    popularDomains: {
        measurement: DnsResponse | null 
        probes: Map<number, Probe>
    }
}

const store: DataStore = {
    
    popularDomains: {
        measurement: null,
        probes: new Map
    }
}

export async function updateCache() {

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
    await updateCache()
    setTimeout(() => { void poll() }, 10000)
}

void poll()