import type { DetailSelection } from "~/app/utils/DetailSelection"
import PingDetails from "./Ping"
import TracerouteDetails from "./Traceroute"
import PopularDomainsDetails from "./PopularDomains"

type DetailsProps = {
    selection: DetailSelection
}

export default function Details({ selection }: DetailsProps) {
    switch (selection.type) {
        case "popular-domains":return <PopularDomainsDetails />
        case "traceroute": return <TracerouteDetails id={selection.id}/>
        case "ping": return <PingDetails id={selection.id}/>
    }
}