'use client'

import type { DnsResponse, DnsResponseResultSet } from "~/server/api/schemas/dnsResponseSchema"
import { useLiveData } from "../hooks/useLiveData"
import { useEffect, useRef, useState } from "react"
import type { Probe } from "~/server/api/schemas/db"
import dnsPacket from "dns-packet"

const PAGESIZE = 10

const getRtts = (data: DnsResponse | null): number[] => {
    if (!data) return []

    const rtts = data.map((element) => {
        let total = 0;
        element.resultset.forEach((set) => {
            total += set.result.rt
        })
        return total / element.resultset.length
    }).sort()

    // filter out zeros since it prevents rerenders
    return rtts.filter((rtt) => rtt > 0);
}


const matchingProbes = (measurementProbeIds: number[], probes: Map<number, Probe>) => {
    return measurementProbeIds.filter((id) => probes.has(id))
}


const getDomainName = (resultSet: DnsResponseResultSet): string | null => {
    if(!resultSet.qbuf) return null

    const packet = dnsPacket.decode(Buffer.from(resultSet.qbuf, 'base64'))
    return packet.questions?.[0]?.name ?? null
}


const mostObserved = (page: number, pageSize: number, data: DnsResponse) => {
    const domainNames = new Map<string, number>

    data.forEach((result) => {
        const resultSet = result.resultset.at(0)
        if(!resultSet) return;
        const domainName = getDomainName(resultSet)
        if(!domainName) return;

        const currentCount = domainNames.get(domainName)
        domainNames.set(domainName, currentCount ? currentCount + 1 : 1)
    })

    const sortedDomainNames = [...domainNames.entries()].sort((a, b) => b[1] - a[1])
    const total = sortedDomainNames.length

    if (pageSize === Infinity) return { domains: sortedDomainNames, total}

    const start = 0 + (page * pageSize)
    const end = start + pageSize
    return { domains: sortedDomainNames.slice(start, end), total }
}


const formatRtt = (rtt: number) => {
    if (rtt < 1) return `${(rtt * 1000).toFixed(0)}μs`
    if (rtt < 1000) return `${rtt.toFixed(0)}ms`
    return `${(rtt / 1000).toFixed(1)}s`
}

export default function Details() {

    const [probesDisplayed, setProbesDisplayed] = useState(0)
    const [minRTT, setMinRTT] = useState(0)
    const [meanRTT, setMeanRTT] = useState(0)
    const [maxRTT, setMaxRTT] = useState(0)
    const [mostObservedDomains, setMostObservedDomains] = useState<[string, number][]>([])
    const [totalDomains, setTotalDomains] = useState(0)
    const [currentPage, setCurrentPage] = useState(0)

    const [rttDeltas, setRttDeltas] = useState<{ min: number, mean: number, max: number }>({ min: 0, mean: 0, max: 0 })
    const [probeDeltaLiteral, setProbeDelta] = useState(0)
    const [domainChanges, setDomainChanges] = useState<Map<string, number>>(new Map())

    const prevRef = useRef({
        minRTT: 0,
        meanRTT: 0,
        maxRTT: 0,
        probesDisplayed: 0,
        domains: new Map<string, number>(),
    })

    const data = useLiveData()

    useEffect(() => {
        setCurrentPage(0)
    }, [data?.measurement])

    useEffect(() => {
        if(!data?.measurement) return

        const rtts = getRtts(data.measurement)
        const min = rtts.at(0)
        const max = rtts.at(rtts.length - 1)
        const mean = rtts.reduce((partialSum, x) => partialSum + x, 0) / rtts.length

        if (min && max) {
            const prev = prevRef.current

            const computeDelta = (prev: number, curr: number) => {
                if (prev === 0) return 0
                return ((curr - prev) / prev) * 100
            }

            setRttDeltas({
                min: computeDelta(prev.minRTT, min),
                mean: computeDelta(prev.meanRTT, mean),
                max: computeDelta(prev.maxRTT, max),
            })

            console.log(min)
            console.log(max)
            setMinRTT(min)
            setMaxRTT(max)
            setMeanRTT(mean)

            const displayed = matchingProbes(data.measurement.map((elem) => elem.prb_id), data.probes);
            const displayedCount = displayed.length

            setProbeDelta(displayedCount - prev.probesDisplayed)
            setProbesDisplayed(displayedCount)

            const { domains, total } = mostObserved(currentPage, PAGESIZE, data.measurement)
            setMostObservedDomains(domains)
            setTotalDomains(total)

            const changes = new Map<string, number>
            domains.forEach(([name, count]) => {
                const prevCount = prev.domains.get(name)
                if (prevCount !== undefined) {
                    changes.set(name, computeDelta(prevCount, count))
                }
            })
            setDomainChanges(changes)

            const allDomains = mostObserved(0, Infinity, data.measurement).domains
            prevRef.current = {
                minRTT: min,
                meanRTT: mean,
                maxRTT: max,
                probesDisplayed: displayedCount,
                domains: new Map(allDomains),
            }
        }
    }, [data, currentPage])

    const totalPages = Math.ceil(totalDomains / PAGESIZE)
    const paginationTabs = Array.from({ length: totalPages }, (_, i) => ({
        page: i,
        label: `${i * PAGESIZE + 1}-${Math.min((i + 1) * PAGESIZE, totalDomains)}`,
    }))

    const renderDelta = (delta: number, literal = false) => {
        if (delta === 0) return <span className="text-neutral-500 w-14 text-center">—</span>
        const isPositive = delta > 0
        const color = isPositive ? "text-emerald-400" : "text-rose-400"
        const arrow = isPositive ? "↑" : "↓"
        
        return <span className={color + " w-14"}>{arrow}{literal ? delta : Math.abs(delta).toFixed(1)}{literal ? "" : "%"}</span>
    }
    
    return (
        <div className="bg-primary primary-text basis-1/4 w-3/5 h-3/4 rounded-xl relative py-8 px-8 flex flex-col gap-5 overflow-hidden">

            {!data && <div className="text-neutral-400">loading...</div>}
            {data &&
            <>
                <div className="header">Popular domains</div>
                <div className="w-full h-px bg-white/10" />

                    <div className="p-3 flex flex-col items-center">
                        <span className="text-2xl font-semibold">{probesDisplayed}</span>
                        <span className="stat-label mt-1">Probes Online</span>
                        <span className="text-xs mt-1">{renderDelta(probeDeltaLiteral, true)}</span>
                    </div>

                <div>
                    <div className="secondary-text mb-2">Response Time</div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 flex flex-col items-center">
                            <span className="stat-label">Min</span>
                            <span className="text-lg font-medium mt-1">{formatRtt(minRTT)}</span>
                            <span className="text-xs mt-1">{renderDelta(rttDeltas.min)}</span>
                        </div>
                        <div className="p-3 flex flex-col items-center">
                            <span className="stat-label">Mean</span>
                            <span className="text-lg font-medium mt-1">{formatRtt(meanRTT)}</span>
                            <span className="text-xs mt-1">{renderDelta(rttDeltas.mean)}</span>
                        </div>
                        <div className="p-3 flex flex-col items-center">
                            <span className="stat-label">Max</span>
                            <span className="text-lg font-medium mt-1">{formatRtt(maxRTT)}</span>
                            <span className="text-xs mt-1">{renderDelta(rttDeltas.max)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                    <div className="secondary-text mb-2">Most Observed Domains</div>
                    <div className="flex-1 overflow-y-auto min-h-0 scrollbar-none">
                        <div className="flex flex-col">
                            {mostObservedDomains.map(([domain, count], i) => {
                                const change = domainChanges.get(domain)
                                return (
                                    <div key={domain} className={`flex justify-between items-center py-2 ${i > 0 ? 'border-t border-white/5' : ''}`}>
                                        <span className="text-sm truncate mr-2">{domain}</span>
                                        <div className="flex text-xs items-center gap-3 w-max">
                                            <span className="text-sm font-medium">{count}</span>
                                            {change !== undefined && renderDelta(change)}
                                        </div>
                                    </div>
                                )
                            })}
                            {mostObservedDomains.length === 0 && (
                                <div className="text-sm text-neutral-500 py-2">No domains observed</div>
                            )}
                        </div>
                    </div>

                    {totalPages > 1 &&
                    <div className="flex gap-2 mt-3 flex-wrap justify-center">
                        {paginationTabs.map((tab) => (
                            <button
                                key={tab.page}
                                onClick={() => setCurrentPage(tab.page)}
                                className={`tab ${currentPage === tab.page ? 'tab-active' : ''}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    }
                </div>
            </>
            }
        </div>
    )
}
