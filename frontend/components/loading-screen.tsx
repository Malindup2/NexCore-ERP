"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-background">
      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
          <Image
            src="/assets/logo.png"
            alt="NexCore ERP"
            width={200}
            height={200}
            className="relative animate-pulse drop-shadow-2xl"
            priority
            unoptimized
          />
        </div>
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">NexCore ERP</h1>
          <p className="text-muted-foreground text-sm">Enterprise Resource Planning</p>
          <div className="flex gap-1.5 mt-2">
            <div className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
