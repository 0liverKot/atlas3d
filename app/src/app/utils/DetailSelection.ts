export type DetailSelection = 
    { type: "popular-domains" } |
    { type: "traceroute"; id: number} |
    { type: "ping"; id: number}