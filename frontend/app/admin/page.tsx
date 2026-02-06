"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/protected-route"
import { UserRoles, getUser } from "@/lib/auth"
import { Users, UserCog, Shield, TrendingUp } from "lucide-react"
import Link from "next/link"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"

interface AdminMetrics {
  totalUsers: number
  totalEmployees: number
  totalAdmins: number
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)

  useEffect(() => {
    setUser(getUser())
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem("token")
      
      const [usersRes, employeesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/auth/users`, {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/hr/employees`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ])

      if (usersRes.ok && employeesRes.ok) {
        const users = await usersRes.json()
        const employees = await employeesRes.json()

        const adminCount = users.filter((u: any) => u.role === "Admin").length

        setMetrics({
          totalUsers: users.length,
          totalEmployees: employees.length,
          totalAdmins: adminCount
        })
      }
    } catch (err) {
      console.error("Failed to fetch admin metrics:", err)
    }
  }

  return (
    <ProtectedRoute requiredRoles={[UserRoles.Admin]}>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.username}! Manage your NexCore ERP system.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">All system users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employees</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalEmployees || 0}</div>
              <p className="text-xs text-muted-foreground">Active employees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalAdmins || 0}</div>
              <p className="text-xs text-muted-foreground">System administrators</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Good</div>
              <p className="text-xs text-muted-foreground">All services running</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Create and manage system users with different roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/admin/users">
                  <UserCog className="mr-2 h-4 w-4" />
                  Manage Users
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/hr">View HR Module</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/accounting">View Accounting</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/sales">View Sales</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
