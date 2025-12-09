"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function InventoryPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.push("/inventory/products")
  }, [router])
  
  return null
}
