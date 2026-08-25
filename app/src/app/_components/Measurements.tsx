'use client'

import { useState } from "react"

export default function Selections() {


    const [traceroutePage, setTraceroutePage] = useState(0)
    const [pingPage, setPingPage] = useState(0)

    // temporary
    const domains = ['google.com', 'amazon.com', 'twitter.com', 'website.com', 'generic.com', 'random.com', 'instagram.com', 'youtube.com']

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

            <div className="flex flex-col gap-2 min-h-0">
                <div className="secondary-text">TraceRoutes</div>
                <div className="w-full h-px bg-white/10" />
                <div className="flex flex-col overflow-y-auto scrollbar-none">
                {domains.map((domain) => {
                    return (
                        <button className='text-left text-sm py-2' key={`tr-${domain}`}>{domain}</button>
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

            <div className="flex flex-col gap-2 min-h-0">
                <div className="secondary-text">Ping</div>
                <div className="w-full h-px bg-white/10" />
                <div className="flex flex-col overflow-y-auto scrollbar-none">
                {domains.map((domain) => {
                    return (
                        <button className='text-left text-sm py-2' key={`tr-${domain}`}>{domain}</button>
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