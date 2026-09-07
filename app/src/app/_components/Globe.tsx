/*

-- From AceternityUI + a few changes  

*/

"use client";
import React, { useEffect, useRef, useState, memo, useMemo } from "react";
import {
    Color,
    Scene,
    Fog,
    PerspectiveCamera,
    Vector3,
    Group,
    Raycaster,
    Sphere,
    Vector2,
    DirectionalLight,
    PointLight,
} from "three";
import ThreeGlobe from "three-globe";
import { useThree, Canvas, extend, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import countries from "public/data/globedata.json";
import type { Position, GlobeConfig } from "../utils/globeTypes";
import { liveData } from "../utils/liveData";
import { transformToPoints } from "../utils/globeFuncs";
import type { DetailSelection } from "../utils/DetailSelection";
import { api } from "~/trpc/react";
declare module "@react-three/fiber" {
    interface ThreeElements {
        threeGlobe: ThreeElements["mesh"] & (new () => ThreeGlobe);
    }
}

extend({ ThreeGlobe: ThreeGlobe });

const RING_PROPAGATION_SPEED = 3;
const cameraZ = 300;

let numbersOfRings = [0];

type GlobeProps = {
    globeConfig: GlobeConfig;
    selection: DetailSelection;
};

export function Globe({ globeConfig, selection }: GlobeProps) {
    const globeRef = useRef<ThreeGlobe | null>(null);
    const groupRef = useRef<Group>(null!);
    const [isInitialized, setIsInitialized] = useState(false);

    const defaultProps = {
        pointSize: 1,
        atmosphereColor: "#ffffff",
        showAtmosphere: true,
        atmosphereAltitude: 0.1,
        polygonColor: "rgba(255,255,255,0.7)",
        globeColor: "#1d072e",
        emissive: "#000000",
        emissiveIntensity: 0.1,
        shininess: 0.9,
        arcTime: 2000,
        arcLength: 0.9,
        rings: 1,
        maxRings: 3,
        ...globeConfig,
    };

    // placeholder for the initial mounting
    const data: Position[] = useMemo(() => [], []);

    const pingId = selection.type === "ping" ? selection.id : 0;
    const pingQuery = api.ping.getPingAndProbes.useQuery(pingId, {
        enabled: selection.type === "ping",
    });
    
    const tracerouteId = selection.type === "traceroute" ? selection.id : 0;
    const tracerouteQuery = api.traceroute.getTracerouteAndProbes.useQuery(tracerouteId, {
        enabled: selection.type === "traceroute",
    });

    // update globe with ping data
    useEffect(() => {
        if (!globeRef.current || !isInitialized) return;
        if (selection.type !== "ping") return;

        if(!pingQuery.data) return; 

        const data = pingQuery.data
        console.log(data)
    }, [isInitialized, selection, pingQuery.data]);

    // update globe with traceroute data
    useEffect(() => {
        if (!globeRef.current || !isInitialized) return;
        if (selection.type !== "traceroute") return;

        if(!tracerouteQuery.data) return;

        const data = tracerouteQuery.data
        console.log(data)
        
        console.log("traceroute selected", selection.id);
    }, [isInitialized, selection, tracerouteQuery.data]);

    // subscribe globe to live data if popular domains is selectted
    useEffect(() => {
        if (!globeRef.current || !isInitialized) return;
        if (selection.type !== "popular-domains") {
            globeRef.current.pointsData([]);
            globeRef.current.ringsData([]);
            globeRef.current.arcsData([]);
            return;
        }

        const updateGlobe = () => {
            const data = liveData.getSnapshot();
            if (!data) return;

            const points = transformToPoints(data);
            globeRef.current?.pointsData(points);
        };

        updateGlobe();
        return liveData.subscribe(updateGlobe);
    }, [isInitialized, selection.type]);

    // Initialize globe only once
    useEffect(() => {
        if (!globeRef.current && groupRef.current) {
            globeRef.current = new ThreeGlobe();
            (groupRef.current as any).add(globeRef.current);
            setIsInitialized(true);
        }
    }, []);

    // Build material when globe is initialized or when relevant props change
    useEffect(() => {
        if (!globeRef.current || !isInitialized) return;

        const globeMaterial = globeRef.current.globeMaterial() as unknown as {
            color: Color;
            emissive: Color;
            emissiveIntensity: number;
            shininess: number;
        };
        globeMaterial.color = new Color(globeConfig.globeColor);
        globeMaterial.emissive = new Color(globeConfig.emissive);
        globeMaterial.emissiveIntensity = globeConfig.emissiveIntensity || 0.1;
        globeMaterial.shininess = globeConfig.shininess || 0.9;
    }, [
        isInitialized,
        globeConfig.globeColor,
        globeConfig.emissive,
        globeConfig.emissiveIntensity,
        globeConfig.shininess,
    ]);

    // Build data when globe is initialized or when data changes
    useEffect(() => {
        if (!globeRef.current || !isInitialized || !data) return;

        const arcs = data;
        let points = [];
        for (let i = 0; i < arcs.length; i++) {
            const arc = arcs[i]!;
            const rgb = hexToRgb(arc.color) as {
                r: number;
                g: number;
                b: number;
            };
            points.push({
                size: defaultProps.pointSize,
                order: arc.order,
                color: arc.color,
                lat: arc.startLat,
                lng: arc.startLng,
            });
            points.push({
                size: defaultProps.pointSize,
                order: arc.order,
                color: arc.color,
                lat: arc.endLat,
                lng: arc.endLng,
            });
        }

        // remove duplicates for same lat and lng
        const filteredPoints = points.filter(
            (v, i, a) =>
                a.findIndex((v2) =>
                    ["lat", "lng"].every(
                        (k) => v2[k as "lat" | "lng"] === v[k as "lat" | "lng"],
                    ),
                ) === i,
        );

        globeRef.current
            .hexPolygonsData(countries.features)
            .hexPolygonResolution(3)
            .hexPolygonMargin(0.7)
            .showAtmosphere(defaultProps.showAtmosphere)
            .atmosphereColor(defaultProps.atmosphereColor)
            .atmosphereAltitude(defaultProps.atmosphereAltitude)
            .hexPolygonColor(() => defaultProps.polygonColor);

        globeRef.current
            .arcsData(data)
            .arcStartLat((d) => (d as { startLat: number }).startLat * 1)
            .arcStartLng((d) => (d as { startLng: number }).startLng * 1)
            .arcEndLat((d) => (d as { endLat: number }).endLat * 1)
            .arcEndLng((d) => (d as { endLng: number }).endLng * 1)
            .arcColor((e: any) => (e as { color: string }).color)
            .arcAltitude((e) => (e as { arcAlt: number }).arcAlt * 1)
            .arcStroke(() => [0.32, 0.28, 0.3][Math.round(Math.random() * 2)]!)
            .arcDashLength(defaultProps.arcLength)
            .arcDashInitialGap((e) => (e as { order: number }).order * 1)
            .arcDashGap(15)
            .arcDashAnimateTime(() => defaultProps.arcTime);

        globeRef.current
            .pointsData(filteredPoints)
            .pointColor((e) => (e as { color: string }).color)
            .pointsMerge(true)
            .pointAltitude(0.0)
            .pointRadius((e) => (e as { size: number }).size);

        globeRef.current
            .ringsData([])
            .ringColor(() => defaultProps.polygonColor)
            .ringMaxRadius(defaultProps.maxRings)
            .ringPropagationSpeed(RING_PROPAGATION_SPEED)
            .ringRepeatPeriod(
                (defaultProps.arcTime * defaultProps.arcLength) /
                    defaultProps.rings,
            );
    }, [
        isInitialized,
        data,
        defaultProps.pointSize,
        defaultProps.showAtmosphere,
        defaultProps.atmosphereColor,
        defaultProps.atmosphereAltitude,
        defaultProps.polygonColor,
        defaultProps.arcLength,
        defaultProps.arcTime,
        defaultProps.rings,
        defaultProps.maxRings,
    ]);

    // Handle rings animation with cleanup
    useEffect(() => {
        if (!globeRef.current || !isInitialized || !data) return;

        const interval = setInterval(() => {
            if (!globeRef.current) return;

            const newNumbersOfRings = genRandomNumbers(
                0,
                data.length,
                Math.floor((data.length * 4) / 5),
            );

            const ringsData = data
                .filter((d, i) => newNumbersOfRings.includes(i))
                .map((d) => ({
                    lat: d.startLat,
                    lng: d.startLng,
                    color: d.color,
                }));

            globeRef.current.ringsData(ringsData);
        }, 2000);

        return () => {
            clearInterval(interval);
        };
    }, [isInitialized, data]);

    return <group ref={groupRef} />;
}

export function WebGLRendererConfig() {
    const { gl, size } = useThree();

    useEffect(() => {
        gl.setPixelRatio(window.devicePixelRatio);
        gl.setSize(size.width, size.height);
        gl.setClearColor(0xffaaff, 0);
    }, []);

    return null;
}

function CameraConfig() {
    const { camera, size } = useThree();

    useEffect(() => {
        if (!(camera instanceof PerspectiveCamera) || size.height === 0) return;

        camera.aspect = size.width / size.height;
        camera.updateProjectionMatrix();
    }, [camera, size.width, size.height]);

    return null;
}

function CameraRelativeLights({ globeConfig }: { globeConfig: GlobeConfig }) {
    const { camera } = useThree();
    const leftLightRef = useRef<DirectionalLight>(null);
    const topLightRef = useRef<DirectionalLight>(null);
    const pointLightRef = useRef<PointLight>(null);
    const leftLightPosition = useMemo(() => new Vector3(), []);
    const topLightPosition = useMemo(() => new Vector3(), []);
    const pointLightPosition = useMemo(() => new Vector3(), []);

    useFrame(() => {
        leftLightPosition.set(-220, 180, 260);
        topLightPosition.set(-140, 260, 220);
        pointLightPosition.set(-180, 140, 240);
        camera.localToWorld(leftLightPosition);
        camera.localToWorld(topLightPosition);
        camera.localToWorld(pointLightPosition);

        if (leftLightRef.current) {
            leftLightRef.current.position.copy(leftLightPosition);
            leftLightRef.current.target.position.set(0, 0, 0);
            leftLightRef.current.target.updateMatrixWorld();
        }

        if (topLightRef.current) {
            topLightRef.current.position.copy(topLightPosition);
            topLightRef.current.target.position.set(0, 0, 0);
            topLightRef.current.target.updateMatrixWorld();
        }

        pointLightRef.current?.position.copy(pointLightPosition);
    });

    return (
        <>
            <directionalLight
                ref={leftLightRef}
                color={globeConfig.directionalLeftLight}
            />
            <directionalLight
                ref={topLightRef}
                color={globeConfig.directionalTopLight}
            />
            <pointLight
                ref={pointLightRef}
                color={globeConfig.pointLight}
                intensity={0.8}
            />
        </>
    );
}

export const World = memo(function World({
    globeConfig,
    selection,
}: GlobeProps) {
    const scene = useMemo(() => {
        const nextScene = new Scene();
        nextScene.fog = new Fog(0xffffff, 400, 2000);
        return nextScene;
    }, []);
    const camera = useMemo(
        () => new PerspectiveCamera(50, 1, 180, 1800),
        [],
    );

    return (
        <Canvas
            scene={scene}
            camera={camera}
        >
            <WebGLRendererConfig />
            <CameraConfig />
            <ambientLight color={globeConfig.ambientLight} intensity={0.1} />
            <CameraRelativeLights globeConfig={globeConfig} />
            <Globe globeConfig={globeConfig} selection={selection} />
            <OrbitControls
                enablePan={false}
                enableZoom={false}
                minDistance={cameraZ}
                maxDistance={cameraZ}
                autoRotateSpeed={1}
                autoRotate={true}
                minPolarAngle={Math.PI / 3.5}
                maxPolarAngle={Math.PI - Math.PI / 3}
            />
        </Canvas>
    );
});

export function hexToRgb(hex: string) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1]!, 16),
              g: parseInt(result[2]!, 16),
              b: parseInt(result[3]!, 16),
          }
        : null;
}

export function genRandomNumbers(min: number, max: number, count: number) {
    const arr = [];
    while (arr.length < count) {
        const r = Math.floor(Math.random() * (max - min)) + min;
        if (arr.indexOf(r) === -1) arr.push(r);
    }

    return arr;
}
