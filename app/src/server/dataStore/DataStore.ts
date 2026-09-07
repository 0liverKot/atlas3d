import type { DnsResponse } from "../api/schemas/dnsResponseSchema"
import { getMeasurementOfPopularDomains } from "../api/atlas"
import { assertPing, assertProbes, assertTraceroute, findMissingProbes, findMissingProbesPopularDomains, getRequiredPingProbes, getRequiredTracerouteProbes } from "./utils"
import { ee } from "../api/root"
import type { Probe, Ping, Traceroute } from "../api/schemas/db"
import { fetchProbes } from "../api/probe"
import { fetchPing } from "../api/ping"
import { fetchTraceroute } from "../api/traceroute"
import { Queue } from "./Queue"

interface DataStore {

    popularDomains: {
        measurement: DnsResponse | null 
        probes: Map<number, Probe>
    }
    
    pings: Map<number, Ping>
    traceroutes: Map<number, Traceroute>
    
    // probes for ping and traceroutes not needed to be emitted alongside live data
    probes: Map<number, Probe>
    
    LRU: {
        pings: Queue<number>
        traceroutes: Queue<number>
        probes: Queue<number>
    }
}

const store: DataStore = {
    
    popularDomains: {
        measurement: null,
        probes: new Map
    },
    pings:  new Map,
    traceroutes: new Map,
    probes: new Map,
    
    LRU: {
        pings: new Queue,
        traceroutes: new Queue,
        probes: new Queue
    } 
}

enum updateStoreTypes {Ping, Traceroute, Probe}

const evictLRU = (type: updateStoreTypes) => {
    switch(type) {
        case updateStoreTypes.Ping: store.LRU.pings.dequeue(); break;
        case updateStoreTypes.Traceroute: store.LRU.traceroutes.dequeue(); break;
        case updateStoreTypes.Probe: store.LRU.probes.dequeue(); break;
    }    
}

function formatBytes(value: number) {
  if (value < 1024) return `${value.toFixed(0)} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

const serializedBytes = (value: unknown) => {
    const serialized = JSON.stringify(value, (_key, nestedValue: unknown) => {
        if (nestedValue instanceof Map) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return Object.fromEntries(nestedValue)
        }

        return nestedValue
    })

    return Buffer.byteLength(serialized, "utf-8")
}

const logCacheSize = () => {
    console.log(`\nPopular Domain Measurements: ${formatBytes(serializedBytes(store.popularDomains.measurement))}`)
    console.log(`Popular Domain Probes: ${formatBytes(serializedBytes(store.popularDomains.probes))}`)
    console.log(`Pings: ${formatBytes(serializedBytes(store.pings))}`)
    console.log(`Traceroutes: ${formatBytes(serializedBytes(store.traceroutes))}`)
    console.log(`Probes (excluding live data probes): ${formatBytes(serializedBytes(store.probes))}\n`)
    console.log(`Total Datastore: ${formatBytes(serializedBytes(store))}`)
}

const updateStore = (type: updateStoreTypes, item: Ping | Traceroute | Probe[]) => {

    // emergency clearing at 100MB for traceroutes
    if(serializedBytes(store.traceroutes) > 100 * 1024 * 1024) {
        store.traceroutes.clear()
        store.LRU.traceroutes.clear()

        console.log("Emergency clearance of cache... \n")
    }
    
    switch (type) {
        case updateStoreTypes.Ping: {
            assertPing(item)

            // max of 1MB for pings
            if (serializedBytes(store.pings) > 1 * 1024 * 1024) {
                evictLRU(updateStoreTypes.Ping)
                console.log('Ping cache cleared...')
            }

            store.pings.set(item.id, item)
            store.LRU.pings.enqeue(item.id)
            break
        }
        case updateStoreTypes.Traceroute: {
            assertTraceroute(item)

            // max of 50MB for traceroutes
            if(serializedBytes(store.traceroutes) > 50 * 1024 * 1024) {
                evictLRU(updateStoreTypes.Traceroute)
                console.log('traceroute cache cleared...')
            }

            store.traceroutes.set(item.id, item)
            store.LRU.traceroutes.enqeue(item.id)
            console.log('\n cache updated \n')
            console.log(store.traceroutes)
            break
        }
        case updateStoreTypes.Probe: {
            assertProbes(item)
            
            // max of 1MB for probes
            if(serializedBytes(store.traceroutes) > 1 * 1024 * 1024) {
                evictLRU(updateStoreTypes.Probe)
                console.log('probe cache cleared...')
            }

            item.forEach((probe) => {
                store.probes.set(probe.id, probe)
                store.LRU.traceroutes.enqeue(probe.id)
            })
            console.log('\n cache updated \n')
            console.log(store.probes)
            break
        }
    }

}

const currentProbeIds = () => {
    return Array.from(store.probes.keys())
}

async function handleProbeCache(requiredProbesIds: number[], missingProbesIds: number[]) {
    const probes: Probe[] = []

    // fill any probes we have 
    requiredProbesIds.forEach((id) => {
        const probe = store.probes.get(id)
        if (probe) {
            probes.push(probe)
            store.LRU.probes.leap(id)
        }
    })

    // handle any probes we dont have
    if(missingProbesIds.length > 0) {
        const fetchedProbes = await fetchProbes(missingProbesIds)
        updateStore(updateStoreTypes.Probe, fetchedProbes)
        fetchedProbes.forEach((probe) => {
            probes.push(probe)
        })
    }

    return probes
}

export async function getPingAndProbes(id: number) {
    // check datastore if ping has been cached 
    let ping = store.pings.get(id)
    if (ping) {
        store.LRU.pings.leap(id)
    } else {
        ping = await fetchPing(id);
        updateStore(updateStoreTypes.Ping, ping) 
    }

    const requiredProbesIds = getRequiredPingProbes(ping)
    const missingProbesIds = findMissingProbes(requiredProbesIds, currentProbeIds())

    const probes = await handleProbeCache(requiredProbesIds, missingProbesIds)
    
    return {ping: ping, probes: probes}
}

export async function getTracerouteAndProbes(id: number) {
    // check datastore if traceroute has been cached 
    let traceroute = store.traceroutes.get(id)

    if (traceroute) {
        store.LRU.traceroutes.leap(id)
    } else {
        traceroute = await fetchTraceroute(id)
        updateStore(updateStoreTypes.Traceroute, traceroute)
    }

    const requiredProbesIds = getRequiredTracerouteProbes(traceroute)
    const missingProbesIds = findMissingProbes(requiredProbesIds, currentProbeIds())

    const probes = await handleProbeCache(requiredProbesIds, missingProbesIds)

    return {traceroute: traceroute, probes: probes}
}

export async function updatePopularDomains() {

    try { 
        const data = await getMeasurementOfPopularDomains()
        store.popularDomains.measurement = data 

        const probeIds = findMissingProbesPopularDomains(store.popularDomains.measurement, store.popularDomains.probes);
        
        if (probeIds.length > 0) {
            const probes = await fetchProbes(probeIds)
            probes.forEach((probe) => {
                store.popularDomains.probes.set(probe.id, probe)
            })     
        }
        logCacheSize()
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