'use client';
import NotificationListener from "./_components/NotificationListener";
import AtlasGlobe from "./_components/AtlasGlobe";
import Selections from "./_components/Measurements";
import Details from "./_components/Details";
import dynamic from "next/dynamic";

// dynamic import since Math.random causes hydration mismatches between server and client
const Starfield = dynamic(() => import("./_components/Starfield"), { ssr: false});

export default function Home() {

    return (
        <div className="bg-darkprimary flex flex-row items-center justify-center py-20 h-screen relative w-full px-20">
            <Starfield/>
            <NotificationListener/>
            <Selections/>
            <div className="basis-1/2 mx-auto w-full relative overflow-hidden h-full z-10">
                <AtlasGlobe/>
            </div>
            <Details/>
        </div>
    )
    
}
