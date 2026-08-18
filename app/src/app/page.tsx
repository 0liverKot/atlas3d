'use client';
import NotificationListener from "./_components/NotificationListener";
import AtlasGlobe from "./_components/AtlasGlobe";
import Selections from "./_components/Selections";
import Details from "./_components/Details";
import Starfield from "./_components/Starfield";

export default function Home() {

    return(
    
    <div className="flex flex-row items-center justify-center py-20 h-screen bg-slate-950 relative w-full px-10">
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
