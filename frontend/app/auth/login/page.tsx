"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { setAuthData } from "@/lib/auth"
import { toast } from "sonner"

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
      
      // Show success toast
      const user = data.User || data.user
      toast.success("Login successful!", {
        description: `Welcome back, ${user.username}!`
      })
      
      // Redirect based on user role
      if (user?.role === "Admin") {
        router.push("/admin")
      } else {
        router.push("/")
      }
    } catch (err: any) {
      toast.error("Login failed", {
        description: err.message || "Invalid email or password"
      })
      setError(err.message || "Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md border-zinc-200 dark:border-zinc-800 shadow-xl">
        <CardHeader className="space-y-1 text-center pb-6 pt-8">
          <div className="flex justify-center mb-4">
            <img src="/assets/logo.png" alt="NexCore ERP" className="h-16 w-16" />
          </div>
          <CardTitle className="text-3xl font-bold">Welcome back</CardTitle>
          <CardDescription className="text-base">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 px-8">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 h-11"
                />
              </div>
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full h-11" disabled={isLoading}>
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
            </div>
            <div className="w-full p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">Demo Credentials:</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Admin:</strong> admin@nexcore.lk / Admin@123
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                <strong>Or register</strong> as an employee to test the system
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
