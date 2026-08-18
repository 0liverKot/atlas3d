import type { GlobePoint } from "./globeTypes";
import type { PopularDomains } from "./liveData";

function getColor(resultSet: {qbuf: string; result: {rt: number; size: number;}}[]): string {
    let total = 0; 
    resultSet.forEach((item) => {
        total += item.result.rt
    })

    const avgRtt = total / resultSet.length
    switch (true) {
        case avgRtt <= 10: return '#0d6623'
        case 10 < avgRtt && avgRtt <= 20: return '#348c31'
        case 20 < avgRtt && avgRtt <= 30: return '#57ba4b'
        case 30 < avgRtt && avgRtt <= 40: return '#acd039'
        case 40 < avgRtt && avgRtt <= 50: return '#ffd700'
        case 50 < avgRtt && avgRtt <= 100: return '#ffa500'
        case 100 < avgRtt && avgRtt <= 200: return '#ff4500'
        case 200 < avgRtt && avgRtt <= 300: return '#e00000'
        case avgRtt > 300: return '#a10e28'
        default: return '#000000'
    }
}

export function transformToPoints(data: PopularDomains): GlobePoint[] {

    const measurement = data.measurement;
    const probes = data.probes
    const globePoints: GlobePoint[] = []

    measurement?.forEach((probeData) => {
        const probe = probes.get(probeData.prb_id)
        if(!probe) return; 
        
        const globePoint: GlobePoint = {
            lat: probe.latitude,
            lng: probe.longitude,
            color: getColor(probeData.resultset),
            size: 0.2
        }
        globePoints.push(globePoint)
    })

    return globePoints
}