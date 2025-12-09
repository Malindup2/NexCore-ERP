"use client"

import * as React from "react"
import { useEffect, useState } from "react"

export function HeaderDateTime() {
    const [date, setDate] = useState<Date | null>(null)

    useEffect(() => {
        setDate(new Date())
        const timer = setInterval(() => {
            setDate(new Date())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    if (!date) {
        return null
    }

    return (
        <div className="flex flex-col items-end justify-center text-sm mr-4">
            <div className="font-medium">
                {date.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                })}
            </div>
            <div className="text-muted-foreground text-xs">
                {date.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                })}
            </div>
        </div>
    )
}
