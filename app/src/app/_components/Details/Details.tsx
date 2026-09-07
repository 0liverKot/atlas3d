import type { DetailSelection } from "~/app/utils/DetailSelection"
import PingDetails from "./Ping"
import TracerouteDetails from "./Traceroute"
import PopularDomainsDetails from "./PopularDomains"

type DetailsProps = {
    selection: DetailSelection
}

export default function Details({ selection }: DetailsProps) {
    const details = (() => {
        switch (selection.type) {
            case "popular-domains":
                return <PopularDomainsDetails />
            case "traceroute":
                return <TracerouteDetails id={selection.id} />
            case "ping":
                return <PingDetails id={selection.id} />
        }
    })()

    const title = (() => {
        switch (selection.type) {
            case "popular-domains":
                return "Popular domains"
            case "traceroute":
                return "Traceroute Details"
            case "ping":
                return "Ping Details"
        }
    })()

    return (
        <div className="bg-primary primary-text basis-1/4 w-3/5 h-3/4 rounded-xl relative py-8 px-8 flex flex-col gap-5 overflow-hidden shadow-xl/30">
            <div className="header">{title}</div>
            <div className="w-full h-px bg-white/10" />
            {details}
        </div>
    )
}