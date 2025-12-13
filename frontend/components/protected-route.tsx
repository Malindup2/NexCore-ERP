"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUser, hasRole } from "@/lib/auth"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  redirectTo = "/auth/login" 
}: ProtectedRouteProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const user = getUser()
      
      // Check if user is logged in
      if (!user) {
        router.push(redirectTo)
        return
      }

      // Check if user has required role (if specified)
      if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
        router.push("/unauthorized")
        return
      }

      setIsAuthorized(true)
      setIsChecking(false)
    }

    checkAuth()
  }, [router, requiredRoles, redirectTo])

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
