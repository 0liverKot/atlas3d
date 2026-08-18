import type { GlobePoint } from "./globeTypes";
import type { PopularDomains } from "./liveData";

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
            color: '#ffffff',
            size: 0.4
        }
        globePoints.push(globePoint)
    })

    return globePoints
}