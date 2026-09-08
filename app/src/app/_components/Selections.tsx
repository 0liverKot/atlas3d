'use client'

import { useEffect, useState } from "react"
import { api } from "~/trpc/react"
import type { DetailSelection } from "../utils/DetailSelection"
import { getVisiblePaginationTabs } from "../utils/utils"

const PAGESIZE = 10
const MAX_VISIBLE_PAGINATION_TABS = 5

type SelectionsProps = {
    onSelect: (selection: DetailSelection) => void
}

export default function Selections({ onSelect } : SelectionsProps) {

    const pingMetadata = api.ping.getMetadata.useQuery().data
    const tracerouteMetadata = api.traceroute.getMetadata.useQuery().data

    const [traceroutePage, setTraceroutePage] = useState(0)
    const [pingPage, setPingPage] = useState(0)
    const [traceroutePaginationTabs, setTraceroutePaginationTabs] = useState<{page: number; label: string}[]>()
    const [pingPaginationTabs, setPingPaginationTabs] = useState<{page: number; label: string}[]>()

    useEffect(() => {
        if (!tracerouteMetadata) return;
        const traceroutePages = Math.ceil(tracerouteMetadata.length / PAGESIZE)
        const traceroutePaginationTabs = Array.from({ length: traceroutePages }, (_, i) => ({
            page: i,
            label: `${i * PAGESIZE + 1}-${Math.min((i + 1) * PAGESIZE, tracerouteMetadata.length)}`,
        }))
        setTraceroutePaginationTabs(traceroutePaginationTabs)

    }, [tracerouteMetadata])
    
    useEffect(() => {
        if (!pingMetadata) return;
        const pingPages = Math.ceil(pingMetadata.length / PAGESIZE)
        const pingPaginationTabs = Array.from({ length: pingPages }, (_, i) => ({
            page: i,
            label: `${i * PAGESIZE + 1}-${Math.min((i + 1) * PAGESIZE, pingMetadata.length)}`,
        }))
        setPingPaginationTabs(pingPaginationTabs)

    }, [pingMetadata])

    const visibleTracerouteTabs = traceroutePaginationTabs
        ? getVisiblePaginationTabs(traceroutePaginationTabs, traceroutePage, MAX_VISIBLE_PAGINATION_TABS)
        : []
    const visibleTraceroutes = tracerouteMetadata?.slice(
        traceroutePage * PAGESIZE,
        (traceroutePage + 1) * PAGESIZE,
    )
    
    const visiblePingTabs = pingPaginationTabs
        ? getVisiblePaginationTabs(pingPaginationTabs, pingPage, MAX_VISIBLE_PAGINATION_TABS)
        : []
    const visiblePings = pingMetadata?.slice(
        pingPage * PAGESIZE,
        (pingPage + 1) * PAGESIZE,
    )



    return (
        <div className="bg-primary primary-text basis-1/4 w-3/4 h-3/4 rounded-xl relative py-8 px-8 flex flex-col gap-5 overflow-hidden shadow-xl/30">
            <div className="header">Measurements</div>
            <div className="w-full h-px bg-white/10" />

            <button 
                className="text-left text-sm"
                onClick={() => onSelect({type: "popular-domains"})}
            >
                    View measure of popular domains
            </button>

            <div className="flex-1 flex flex-col min-h-0">
                <div className="secondary-text mb-2">TraceRoutes</div>
                <div className="w-full h-px bg-white/10" />
                <div className="flex-1 overflow-y-auto min-h-0 scrollbar-none">
                {!tracerouteMetadata && <div className="text-neutral-400">loading...</div>}
                
                {visibleTraceroutes?.map((data, i) => {
                    return (
                        <div key={`tr-${data.id}`} className={`flex justify-between items-center py-2 ${i > 0 ? 'border-t border-white/5' : ''}`}>
                            <button 
                                className='text-sm truncate mr-2'
                                onClick={() => onSelect({type: "traceroute", id: data.id})}
                            >
                                {data.domain}{data.probes}
                            </button>
                            <span className="flex text-sm font-medium">{`${data.probes} probes`}</span>
                        </div>
                    )
                })}
                </div>
                    <div className="flex gap-2 mt-3 flex-wrap justify-center">
                        {visibleTracerouteTabs.map((tab) => (
                            <button
                                key={tab.page}
                                onClick={() => setTraceroutePage(tab.page)}
                                className={`tab ${traceroutePage === tab.page ? 'tab-active' : ''}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                <div className="secondary-text mb-2">Ping</div>
                <div className="w-full h-px bg-white/10" />
                <div className="flex-1 overflow-y-auto min-h-0 scrollbar-none">
                {!pingMetadata && <div className="text-neutral-400">loading...</div>}
                
                {visiblePings?.map((data, i) => {
                    return (
                        <div key={`p-${data.id}`} className={`flex justify-between items-center py-2 ${i > 0 ? "border-t border-white/5" : ""}`}> 
                            <button 
                                className='text-sm  truncate mr-2'
                                onClick={() => onSelect({type: 'ping', id: data.id})}
                            >
                                {data.domain}{data.probes}
                            </button>
                            <span className="flex text-sm font-medium">{`${data.probes} probes`}</span>
                        </div>

                    )
                })}
                </div>
                <div className="flex gap-2 mt-3 flex-wrap justify-center">
                    {visiblePingTabs?.map((tab) => (
                        <button
                            key={tab.page}
                            onClick={() => setPingPage(tab.page)}
                            className={`tab ${pingPage === tab.page ? 'tab-active' : ''}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

            </div>
        </div>
    )
}