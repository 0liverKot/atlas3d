'use client'

import type { DnsResponse } from "~/server/api/schemas/dnsResponseSchema"
import { useLiveData } from "../hooks/useLiveData"
import { useEffect, useState } from "react"

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

export default function Details() {
    
    const [probesDisplayed, setProbesDisplayed] = useState(0)
    const [unavailableProbes, setUnavailableProbes] = useState(0)
    const [minRTT, setMinRTT] = useState(0)
    const [meanRTT, setMeanRTT] = useState(0)
    const [maxRTT, setMaxRTT] = useState(0)

    const data = useLiveData()
    useEffect(() => {
        if(!data) return 

        const rtts = getRtts(data.measurement)
        const min = rtts.at(0) 
        const max = rtts.at(rtts.length - 1)
        const mean = rtts.reduce((partialSum, x) => partialSum + x, 0) / rtts.length

        if (min && max) {
            setMinRTT(min)
            setMaxRTT(max)
            setMeanRTT(mean)
        }
    }, [data])

    return (
        <div className="bg-primary primary-text basis-1/4 w-3/5 h-3/4 rounded-xl relative">
            
            {!data && <div>loading...</div>}
            
            Measure of popular domains
            <div>{probesDisplayed} probes displayed </div>
            <div>{unavailableProbes} probes missing</div>    
            <div>Min RTT: {minRTT}</div>    
            <div>Mean RTT: {meanRTT}</div>    
            <div>Max RTT: {maxRTT}</div>    
             
             
             
        </div>
    )
}