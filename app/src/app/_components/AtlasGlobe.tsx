'use client';
import { memo, Suspense, useEffect, useMemo, useState } from "react";
import type{  GlobeConfig } from '../utils/globeTypes'
import React from "react";
import type { DetailSelection } from "../utils/DetailSelection";

const World = React.lazy(() => 
    import("./Globe").then((m) => ({default: m.World}))
) 

type AtlasGlobeProps = {
    selection: DetailSelection
}

const AtlasGlobe = memo(function AtlasGlobe({selection}: AtlasGlobeProps) {
    
    const globeConfig = useMemo<GlobeConfig>(() => ({
        pointSize: 4,
        globeColor: "#062056",
        showAtmosphere: true,
        atmosphereColor: "#FFFFFF",
        atmosphereAltitude: 0.1,
        emissive: "#062056",
        emissiveIntensity: 0.1,
        shininess: 0.9,
        polygonColor: "rgba(255,255,255,0.7)",
        ambientLight: "#38bdf8",
        directionalLeftLight: "#ffffff",
        directionalTopLight: "#ffffff",
        pointLight: "#ffffff",
        arcTime: 1000,
        arcLength: 0.9,
        rings: 1,
        maxRings: 3,
        initialPosition: { lat: 22.3193, lng: 114.1694 },
        autoRotate: true,
        autoRotateSpeed: 0.5,
    }), []);
    
    // guard against server side rendering
    const [isClient, setIsClient] = useState(false);
    useEffect(() => setIsClient(true), []);
    if (!isClient) return null; 

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <World globeConfig={globeConfig} selection={selection}/>
        </Suspense>
    )
})

export default AtlasGlobe;