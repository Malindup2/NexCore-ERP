"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ProcurementPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.push("/procurement/suppliers")
  }, [router])
  
  return null
}
