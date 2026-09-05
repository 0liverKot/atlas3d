import type { DnsResponse } from "../api/schemas/dnsResponseSchema"
import { getMeasurementOfPopularDomains } from "../api/atlas"
import { findMissingProbes } from "./utils"
import { ee } from "../api/root"
import type { Probe, Ping, Traceroute } from "../api/schemas/db"
import { getProbes } from "../api/probe"
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
    LRU: {
        pings: Queue<number>
        traceroutes: Queue<number>
    }
}

const store: DataStore = {
    
    popularDomains: {
        measurement: null,
        probes: new Map
    },
    pings:  new Map,
    traceroutes: new Map,
    
    LRU: {
        pings: new Queue,
        traceroutes: new Queue
    } 
}

enum updateStoreTypes {Ping, Traceroute}

const evictLRU = (type: updateStoreTypes) => {
    switch(type) {
        case updateStoreTypes.Ping: store.LRU.pings.dequeue()
        case updateStoreTypes.Traceroute: store.LRU.traceroutes.dequeue()
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
            return Object.fromEntries(nestedValue)
        }

        return nestedValue
    })

    return Buffer.byteLength(serialized, "utf-8")
}

const logCacheSize = () => {
    console.log(`\nPopular Domains: ${formatBytes(serializedBytes(store.popularDomains))}`)
    console.log(`Pings: ${formatBytes(serializedBytes(store.pings))}`)
    console.log(`Traceroutes: ${formatBytes(serializedBytes(store.traceroutes))}\n`)
}

const updateStore = (type: updateStoreTypes, item: Ping | Traceroute) => {
    
    // emergency clearing at 100MB for traceroutes
    if(serializedBytes(store.traceroutes) > 100 * 1024 * 1024) {
        store.traceroutes.clear()
        store.LRU.traceroutes.clear()

        console.log("Emergency clearance of cache... \n")
    }
    
    switch (type) {
        case updateStoreTypes.Ping: {
            // max of 1MB for pings
            if (serializedBytes(store.pings) > 1 * 1024 * 1024) {
                evictLRU(updateStoreTypes.Ping)
                console.log('Ping cache cleared...')
            }

            store.pings.set(item.id, item as Ping)
            store.LRU.pings.enqeue(item.id)
        }   
        case updateStoreTypes.Traceroute: {
            // max of 50MB for traceroutes
            if(serializedBytes(store.traceroutes) > 50 * 1024 * 1024) {
                evictLRU(updateStoreTypes.Traceroute)
                console.log('traceroute cache cleared...')
            }

            store.traceroutes.set(item.id, item as Traceroute)
            store.LRU.traceroutes.enqeue(item.id)
            console.log('\n cache updated \n')
            console.log(store.traceroutes)
        }
    }

}

export async function getPing(id: number) {
    // check datastore if ping has been cached 
    const ping = store.pings.get(id)
    if (ping) {
        store.LRU.pings.leap(id)
        return ping;
    }

    const result = await fetchPing(id);
    updateStore(updateStoreTypes.Ping, result)
    return result
}

export async function getTraceroute(id: number) {
    // check datastore if traceroute has been cached 
    const traceroute = store.traceroutes.get(id)
    if (traceroute) {
        store.LRU.traceroutes.leap(id)
        return traceroute
    }

    const result = await fetchTraceroute(id)
    updateStore(updateStoreTypes.Traceroute, result)
    return result
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