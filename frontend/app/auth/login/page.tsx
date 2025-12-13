"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { setAuthData } from "@/lib/auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Login failed")
      }

      const data = await response.json()
      
      // Store token and user data
      setAuthData(data.Token || data.token, data.User || data.user)
      
      // Redirect to dashboard
      router.push("/")
    } catch (err: any) {
      setError(err.message || "Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[450px] mx-auto">
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center pb-8 pt-8">
          <div className="flex justify-center mb-4 lg:hidden">
            <img src="/assets/logo.png" alt="NexCore ERP" className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 px-8">
            {error && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 h-11 bg-background/50 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 h-11 bg-background/50 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 px-8 pb-8 pt-2 text-center">
            <div className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link 
                href="/auth/register" 
                className="font-medium text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
              >
                Create an account
              </Link>
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-md text-left">
              <p className="text-xs font-semibold text-blue-900 mb-2">Demo Credentials:</p>
              <p className="text-xs text-blue-700">
                <strong>Admin:</strong> admin@nexcore.lk / Admin@123
              </p>
              <p className="text-xs text-blue-700 mt-1">
                <strong>Or register</strong> as an employee to test the system
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
