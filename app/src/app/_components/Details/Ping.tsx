import { useEffect, useState } from "react"
import { api } from "~/trpc/react"
import { formatRtt, getVisiblePaginationTabs } from "~/app/utils/utils"

const MAX_VISIBLE_PAGINATION_TABS = 9

type PingDetailsProps = {
    id: number
}

export default function PingDetails({ id }: PingDetailsProps) {
    
    const data = api.ping.getPingAndProbes.useQuery(id).data
    
    const [probesDisplayed, setProbesDisplayed] = useState(0)
    const [probesMissing, setProbesMissing] = useState(0)

    const [minRtt, setMinRtt] = useState(0)
    const [meanRtt, setmeanRtt] = useState(0)
    const [maxRtt, setMaxRtt] = useState(0)
    const [currentTab, setCurrentTab] = useState(0)
    const [paginationTabs, setPaginationTabs] = useState<{page: number; label: string}[]>()

    useEffect(() => {
        if (!data) return;
        setProbesDisplayed(data.probes.length)
        setProbesMissing(data.ping.probes - data.probes.length)

        const minRtts = data.ping.result.map((entry) => entry.min)
        const meanRtts = data.ping.result.map((entry) => entry.avg)
        const maxRtts = data.ping.result.map((entry) => entry.max)

        let min = minRtts.sort((a, b) => a - b).shift()!
        if (min < 0) min = 0; // some of the data has negative times 
        setMinRtt(min)
        setMaxRtt(maxRtts.sort((a, b) => a - b).pop()!)

        setmeanRtt(meanRtts.reduce((total, number) => total + number, 0) / data.ping.probes)

        const paginationTabs = Array.from({ length: data.probes.length }, (_, i) => ({
            page: i,
            label: (i + 1).toString()
        }))
        setPaginationTabs(paginationTabs)

    }, [data])

    const visibleTabs = paginationTabs
        ? getVisiblePaginationTabs(paginationTabs, currentTab, MAX_VISIBLE_PAGINATION_TABS)
        : []
    const selectedProbe = data?.probes[currentTab]
    const selectedResult = selectedProbe
        ? data.ping.result.find((result) => result.prb_id === selectedProbe.id)
        : undefined

    return (
        <>
        {!data && <div className="text-neutral-400">loading...</div>}
        {data &&
        <>
        <div className="flex flex-row justify-center">
            <div className="p-3 flex flex-col items-center">
                <span className="text-2xl font-semibold">{probesDisplayed}</span>
                <span className="stat-label mt-1">Probes Online</span>
            </div>
            <div className="p-3 flex flex-col items-center">
                <span className="text-2xl font-semibold">{probesMissing}</span>
                <span className="stat-label mt-1">Probes Missing</span>
            </div>
        </div>

        <div>
            <div className="secondary-text mb-2">Response Time</div>
            <div className="grid grid-cols-3 gap-3">
                <div className="p-3 flex flex-col items-center">
                    <span className="stat-label">Min</span>
                    <span className="text-lg font-medium mt-1">{formatRtt(minRtt)}</span>
                </div>
                <div className="p-3 flex flex-col items-center">
                    <span className="stat-label">Mean</span>
                    <span className="text-lg font-medium mt-1">{formatRtt(meanRtt)}</span>
                </div>
                <div className="p-3 flex flex-col items-center">
                    <span className="stat-label">Max</span>
                    <span className="text-lg font-medium mt-1">{formatRtt(maxRtt)}</span>
                </div>
            </div>
            </div>

            <div className="flex flex-row justify-center items-center gap-3">
                <span className="secondary-text mb-2">Target: </span>
                <span className="primary-text mb-2">{data.ping.domain}</span>
            </div>

            {selectedProbe && selectedResult && (
                <div className="rounded-lg bg-white/5 p-4">
                    <div className="secondary-text mb-3">Selected probe</div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="stat-label">Probe</div>
                            <div className="mt-1 font-medium">#{selectedProbe.id}</div>
                        </div>
                        <div>
                            <div className="stat-label">Location</div>
                            <div className="mt-1 font-medium">
                                {selectedProbe.latitude.toFixed(2)}, {selectedProbe.longitude.toFixed(2)}
                            </div>
                        </div>
                        <div>
                            <div className="stat-label">Average RTT</div>
                            <div className="mt-1 font-medium">{formatRtt(selectedResult.avg)}</div>
                        </div>
                        <div>
                            <div className="stat-label">Range</div>
                            <div className="mt-1 font-medium">
                                {formatRtt(selectedResult.min)} - {formatRtt(selectedResult.max)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex gap-2 mt-3 flex-wrap justify-center">
                {visibleTabs?.map((tab) => (
                    <button
                        key={tab.page}
                        onClick={() => setCurrentTab(tab.page)}
                        className={`tab ${currentTab === tab.page ? 'tab-active' : ''}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

        </>}
        </>
    )
}