'use client'

import { useState } from "react"
import { api } from "~/trpc/react"

export default function Selections() {

    const pingMetadata = api.ping.getMetadata.useQuery().data
    const tracerouteMetadata = api.traceroute.getMetadata.useQuery().data

    const [traceroutePage, setTraceroutePage] = useState(0)
    const [pingPage, setPingPage] = useState(0)

    const tracerouteTabs = [
        {page: 1, label: "1-10"},
        {page: 2, label: "11-20"},
        {page: 3, label: "21-20"},
        {page: 4, label: "31-40"},
        {page: 5, label: "41-50"},
    ]
    const pingTabs = [
        {page: 1, label: "1-10"},
        {page: 2, label: "11-20"},
        {page: 3, label: "21-20"},
        {page: 4, label: "31-40"},
        {page: 5, label: "41-50"},
    ]
    
    return (
        <div className="bg-primary primary-text basis-1/4 w-3/4 h-3/4 rounded-xl relative py-8 px-8 flex flex-col gap-5 overflow-hidden shadow-xl/30">
            <div className="header">Measurements</div>
            <div className="w-full h-px bg-white/10" />

            <button className="text-left text-sm">View measure of popular domains</button>

            <div className="flex-1 flex flex-col min-h-0">
                <div className="secondary-text mb-2">TraceRoutes</div>
                <div className="w-full h-px bg-white/10" />
                <div className="flex-1 overflow-y-auto min-h-0 scrollbar-none">
                {!tracerouteMetadata && <div className="text-neutral-400">loading...</div>}
                
                {tracerouteMetadata?.map((data, i) => {
                    return (
                        <div key={`tr-${data.id}`} className={`flex justify-between items-center py-2 ${i > 0 ? 'border-t border-white/5' : ''}`}>
                            <button className='text-sm truncate mr-2'>{data.domain}{data.probes}</button>
                            <span className="flex text-sm font-medium">{`${data.probes} probes`}</span>
                        </div>
                    )
                })}
                </div>
                <div className="flex gap-2 mt-3 flex-wrap justify-center">
                    {tracerouteTabs.map((tab) => (
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
                
                {pingMetadata?.map((data, i) => {
                    return (
                        <div key={`p-${data.id}`} className={`flex justify-between items-center py-2 ${i > 0 ? "border-t border-white/5" : ""}`}> 
                            <button className='text-sm  truncate mr-2'>{data.domain}{data.probes}</button>
                            <span className="flex text-sm font-medium">{`${data.probes} probes`}</span>
                        </div>

                    )
                })}
                </div>
                <div className="flex gap-2 mt-3 flex-wrap justify-center">
                    {pingTabs.map((tab) => (
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