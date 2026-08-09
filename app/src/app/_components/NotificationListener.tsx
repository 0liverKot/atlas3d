'use client';
import { api } from "~/trpc/react";
import { liveData } from "../utils/liveData";

export default function NotificationListener() {
    
    api.onCacheUpdate.useSubscription(undefined, {
        onData(data) {
            console.log('listener')
            liveData.set(data)
        }
    })

    return null
}



