
export const formatRtt = (rtt: number) => {
    if (rtt < 1) return `${(rtt * 1000).toFixed(0)}μs`
    if (rtt < 1000) return `${rtt.toFixed(0)}ms`
    return `${(rtt / 1000).toFixed(1)}s`
}