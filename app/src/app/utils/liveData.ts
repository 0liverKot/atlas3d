'useClient';
import type { DnsResponse } from "~/server/api/schemas/dnsResponseSchema";
import type { Probe } from "~/server/api/schemas/db";

type Listener = () => void; 
export type PopularDomains = { measurement: DnsResponse | null, probes: Map<number, Probe> }

class LiveData {
    private static _instance = new LiveData()
    private snapshot: PopularDomains | null = null
    private listeners = new Set<Listener>()

    static get instance() { return this._instance }

    subscribe(listener: Listener) {
        this.listeners.add(listener)
        return () => { this.listeners.delete(listener) } // returns a cleanup function 
    }

    getSnapshot(): PopularDomains | null {
        return this.snapshot
    }

    set(data: PopularDomains) {
        this.snapshot = data
        this.listeners.forEach((fn) => fn())
    }
}

export const liveData = LiveData.instance