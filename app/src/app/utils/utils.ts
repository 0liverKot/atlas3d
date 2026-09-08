
export const formatRtt = (rtt: number) => {
    if (rtt < 1) return `${(rtt * 1000).toFixed(0)}μs`
    if (rtt < 1000) return `${rtt.toFixed(0)}ms`
    return `${(rtt / 1000).toFixed(1)}s`
}

export const getVisiblePaginationTabs = (
    tabs: { page: number; label: string }[],
    currentTab: number,
    maxVisible: number
) => {
    if (tabs.length <= maxVisible) return tabs

    const halfWindow = Math.floor(maxVisible / 2)
    const start = Math.min(
        Math.max(currentTab - halfWindow, 0),
        tabs.length - maxVisible,
    )

    return tabs.slice(start, start + maxVisible)
}