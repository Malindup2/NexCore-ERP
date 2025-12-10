"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    
    // Public routes that don't require authentication
    const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password']
    const isPublicRoute = publicRoutes.includes(pathname)

    if (!token && !isPublicRoute) {
      // No token and trying to access protected route - redirect to login
      router.push('/auth/login')
    } else if (token && isPublicRoute) {
      // Has token but on auth page - redirect to dashboard
      router.push('/')
    } else {
      setIsChecking(false)
    }
  }, [pathname, router])

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
}
