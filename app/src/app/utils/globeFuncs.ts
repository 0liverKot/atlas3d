import { type Ping, type Probe } from "~/server/api/schemas/db";
import type { GlobePoint } from "./globeTypes";
import type { PopularDomains } from "./liveData";

function getColor(rtt: number): string {
    
    switch (true) {
        case rtt <= 10: return '#0d6623'
        case 10 < rtt && rtt <= 20: return '#348c31'
        case 20 < rtt && rtt <= 30: return '#57ba4b'
        case 30 < rtt && rtt <= 40: return '#acd039'
        case 40 < rtt && rtt <= 50: return '#ffd700'
        case 50 < rtt && rtt <= 100: return '#ffa500'
        case 100 < rtt && rtt <= 200: return '#ff4500'
        case 200 < rtt && rtt <= 300: return '#e00000'
        case rtt > 300: return '#a10e28'
        default: return '#000000'
    }
}

function getAvgRtt(resultSet: {qbuf: string; result: {rt: number; size: number;}}[]) {
    let total = 0; 
    resultSet.forEach((item) => {
        total += item.result.rt
    })

    return total / resultSet.length

}

export function transformPopularDomainsToPoints(data: PopularDomains): GlobePoint[] {

    const measurement = data.measurement;
    const probes = data.probes
    const globePoints: GlobePoint[] = []

    measurement?.forEach((probeData) => {
        const probe = probes.get(probeData.prb_id)
        if (!probe) return; 
        
        const avgRtt = getAvgRtt(probeData.resultset)

        const globePoint: GlobePoint = {
            lat: probe.latitude,
            lng: probe.longitude,
            color: getColor(avgRtt),
            size: 0.2
        }
        globePoints.push(globePoint)
    })

    return globePoints
}

export function transformPingToPoints(data: {ping: Ping; probes: Probe[]}): GlobePoint[] {
    const ping = data.ping
    const probes = data.probes
    const globePoints: GlobePoint[] = []

    ping.result.forEach((probeData) => {
        const probe = probes.find((probe) => probeData.prb_id === probe.id)
        if (!probe) return;
        const globePoint: GlobePoint = {
            lat: probe.latitude,
            lng: probe.longitude,
            color: getColor(probeData.max),
            size: 0.5
        }
        globePoints.push(globePoint)
    })

    return globePoints
}