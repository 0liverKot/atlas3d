'use client'
import { useSyncExternalStore } from "react"
import { liveData } from "../utils/liveData"

export function useLiveData() {
    return useSyncExternalStore(
        (cb) => liveData.subscribe(cb),
        () => liveData.getSnapshot(),
        () => liveData.getSnapshot() 
    )
}
