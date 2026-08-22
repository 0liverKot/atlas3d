'use client'

import type { DnsResponse, DnsResponseResultSet } from "~/server/api/schemas/dnsResponseSchema"
import { useLiveData } from "../hooks/useLiveData"
import { useEffect, useState } from "react"
import type { Probe } from "~/server/api/schemas/db"
import dnsPacket from "dns-packet"

const PAGESIZE = 10

// returns sorted array of the RTTS for eahc probes results
const getRtts = (data: DnsResponse | null): number[] => {
    
    if (!data) return []
    
    return data.map((element) => { 

        // calc average for each elemts result sets due to some reusltsets containing multiple entries for a single probe
        let total = 0;
        element.resultset.forEach((set) => {
            total += set.result.rt
        })
        return total / element.resultset.length
    }).sort()
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

    // get count of all domains
    data.forEach((result) => {
        const resultSet = result.resultset.at(0) // only need first one since all others are under the same domain

        if(!resultSet) return;
        const domainName = getDomainName(resultSet) 

        if(!domainName) return; 

        const currentCount = domainNames.get(domainName)
        domainNames.set(domainName, currentCount ? currentCount + 1 : 1)
    })

    // sort by count
    const sortedDomainNames = [...domainNames.entries()].sort((a, b) => b[1] - a[1])

    // get specific page
    const start = 0 + (page * pageSize)
    const end = start + pageSize

    return sortedDomainNames.slice(start, end)
}


export default function Details() {
    
    const [probesDisplayed, setProbesDisplayed] = useState(0)
    const [unavailableProbes, setUnavailableProbes] = useState(0)
    const [minRTT, setMinRTT] = useState(0)
    const [meanRTT, setMeanRTT] = useState(0)
    const [maxRTT, setMaxRTT] = useState(0)
    const [mostObservedDomains, setMostObservedDomains] = useState<[string, number][]>([])

    const data = useLiveData()
    useEffect(() => {
        if(!data?.measurement) return 

        const rtts = getRtts(data.measurement)
        const min = rtts.at(0) 
        const max = rtts.at(rtts.length - 1)
        const mean = rtts.reduce((partialSum, x) => partialSum + x, 0) / rtts.length

        if (min && max) {
            setMinRTT(min)
            setMaxRTT(max)
            setMeanRTT(mean)
            
            const displayed = matchingProbes(data.measurement.map((elem) => elem.prb_id), data.probes);
            const displayedCount = displayed.length
            const missingCount = data.measurement.length - displayedCount

            setProbesDisplayed(displayedCount)
            setUnavailableProbes(missingCount)
 
            setMostObservedDomains(mostObserved(0, PAGESIZE, data.measurement))
        }
    }, [data])

    return (
        <div className="bg-primary primary-text basis-1/4 w-3/5 h-3/4 rounded-xl relative">
            
            {!data && <div>loading...</div>}
            {data &&
            <>
                Measure of popular domains
                <div>{probesDisplayed} probes displayed </div>
                <div>{unavailableProbes} probes missing</div>    
                <div>Min RTT: {minRTT}</div>    
                <div>Mean RTT: {meanRTT}</div>    
                <div>Max RTT: {maxRTT}</div>        
                Most observed domains

                <ul>
                {mostObservedDomains.map((domain) => {
                   return  <li key={domain[0]}>{domain[0]} : {domain[1]} probes</li>
                })
                }

                </ul>
            </>
            }
             
             
        </div>
    )
}