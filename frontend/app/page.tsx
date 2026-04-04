"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Calendar, Clock, FileText, Award } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Line, LineChart, Area, AreaChart } from "recharts";
import { getUser, UserRoles } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { apiTryJson, apiJson } from "@/lib/api";

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [adminMetrics, setAdminMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getUser()
    setUser(currentUser)
    
    // Fetch dashboard data for employees
    if (currentUser?.role === UserRoles.Employee) {
      fetchEmployeeDashboard(currentUser.id)
    } else {
      // Fetch admin/manager metrics
      fetchAdminMetrics()
    }
  }, [])

  const fetchEmployeeDashboard = async (userId: number) => {
    try {
      const data = await apiJson<Record<string, unknown>>(
        `/api/hr/EmployeeSelfService/dashboard/${userId}`
      )
      setDashboardData(data)
    } catch (error) {
      console.error("Error fetching dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAdminMetrics = async () => {
    try {
      const [sales, inventory, employees, procurement, payroll, incomeStmt] = await Promise.all([
        apiTryJson<Array<Record<string, unknown>>>("/api/sales/orders"),
        apiTryJson<Array<Record<string, unknown>>>("/api/inventory/products"),
        apiTryJson<Array<Record<string, unknown>>>("/api/hr/employees"),
        apiTryJson<Array<Record<string, unknown>>>("/api/procurement/orders"),
        apiTryJson<Record<string, unknown>>("/api/payroll/summary"),
        apiTryJson<Record<string, unknown>>("/api/accounting/Reports/income-statement"),
      ])

      const salesList = sales ?? []
      const inventoryList = inventory ?? []
      const employeeList = employees ?? []
      const procurementList = procurement ?? []

      const totalRevenue = salesList.reduce(
        (sum, order) => sum + Number(order.totalAmount ?? order.TotalAmount ?? 0),
        0
      )
      const expensesBlock = incomeStmt?.expenses as { total?: number } | undefined
      const totalExpenses = Number(expensesBlock?.total ?? 0)

      const inventoryValue = inventoryList.reduce(
        (sum, p) =>
          sum +
          Number(p.quantity ?? p.Quantity ?? 0) * Number(p.costPrice ?? p.CostPrice ?? 0),
        0
      )

      const pendingPOs = procurementList.filter(
        (po) => po.status === "Draft" || po.status === "Submitted"
      ).length

      const payrollSummary = payroll ?? null

      const now = new Date()
      const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short" })
      const weekdayFmt = new Intl.DateTimeFormat("en-US", { weekday: "short" })

      const monthlyBuckets = Array.from({ length: 6 }, (_, index) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
        const key = `${d.getFullYear()}-${d.getMonth()}`
        return { key, month: monthFmt.format(d), revenue: 0 }
      })
      const monthlyIndex = new Map(monthlyBuckets.map((b, i) => [b.key, i]))

      const dayOrder = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      const weeklyBuckets = dayOrder.map((name) => ({ name, sales: 0 }))
      const weeklyIndex = new Map(dayOrder.map((name, i) => [name, i]))

      for (const order of salesList) {
        const amount = Number(order.totalAmount ?? order.TotalAmount ?? 0)
        const rawDate =
          order.orderDate ??
          order.OrderDate ??
          order.createdAt ??
          order.CreatedAt ??
          order.createdOn ??
          order.CreatedOn
        if (!rawDate) continue

        const parsed = new Date(String(rawDate))
        if (Number.isNaN(parsed.getTime())) continue

        const monthKey = `${parsed.getFullYear()}-${parsed.getMonth()}`
        const monthIdx = monthlyIndex.get(monthKey)
        if (monthIdx !== undefined) {
          monthlyBuckets[monthIdx].revenue += amount
        }

        const dayName = weekdayFmt.format(parsed)
        const dayIdx = weeklyIndex.get(dayName)
        if (dayIdx !== undefined) {
          weeklyBuckets[dayIdx].sales += amount
        }
      }

      setAdminMetrics({
        totalRevenue,
        totalExpenses,
        salesCount: salesList.length,
        inventoryValue,
        inventoryCount: inventoryList.length,
        employeeCount: employeeList.length,
        pendingPOs,
        payrollSummary,
        revenueSeries: monthlyBuckets,
        weeklySalesSeries: weeklyBuckets,
        recentOrders: salesList.slice(0, 4).map((order) => ({
          id: `ORD-${order.id}`,
          customerId: order.customerId,
          amount: `LKR ${Number(order.totalAmount ?? order.TotalAmount ?? 0).toLocaleString()}`,
          status: order.status,
        })),
      })
    } catch (error) {
      console.error("Error fetching admin metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  // Employee Dashboard
  if (user?.role === UserRoles.Employee) {
    if (loading) {
      return (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {dashboardData?.profile?.firstName || user?.username}!
          </h1>
          <p className="text-muted-foreground">
            {dashboardData?.profile?.designation || "Employee"} • {dashboardData?.profile?.department || ""}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Attendance</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.attendance?.percentage || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData?.attendance?.daysPresent || 0} days this month
              </p>
              <Link href="/hr/attendance">
                <Button variant="link" className="mt-2 p-0 h-auto">View Details</Button>
              </Link>
              {dashboardData?.attendance?.checkedInToday && (
                <p className="text-xs text-green-600 mt-1">✓ Checked in today</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.leaves?.remaining || 0} days</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData?.leaves?.used || 0} of {dashboardData?.leaves?.total || 20} used
              </p>
              <Link href="/hr/leave">
                <Button variant="link" className="mt-2 p-0 h-auto">Apply Leave</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Available</div>
              <p className="text-xs text-muted-foreground">View payslips</p>
              <Link href="/hr/payroll">
                <Button variant="link" className="mt-2 p-0 h-auto">View Payroll</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData?.performance?.latestRating ? `${dashboardData.performance.latestRating}/5` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">{dashboardData?.performance?.status || "Pending"}</p>
              <Link href="/hr/reviews">
                <Button variant="link" className="mt-2 p-0 h-auto">View Reviews</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/hr/attendance">
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="mr-2 h-4 w-4" />
                  Mark Attendance
                </Button>
              </Link>
              <Link href="/hr/leave">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Request Leave
                </Button>
              </Link>
              <Link href="/hr/payroll">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  View Payslips
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.attendance?.checkedInToday ? (
                  <div className="text-sm">
                    <p className="font-medium">✓ Checked In</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(dashboardData.attendance.checkInTime).toLocaleTimeString()}
                    </p>
                  </div>
                ) : (
                  <div className="text-sm">
                    <p className="font-medium text-orange-600">! Not Checked In</p>
                    <p className="text-muted-foreground text-xs">Please mark your attendance</p>
                  </div>
                )}
                <div className="text-sm">
                  <p className="font-medium">Leave Balance</p>
                  <p className="text-muted-foreground text-xs">
                    {dashboardData?.leaves?.remaining || 0} days remaining
                  </p>
                </div>
                {dashboardData?.performance?.latestReviewDate && (
                  <div className="text-sm">
                    <p className="font-medium">Last Review</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(dashboardData.performance.latestReviewDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Admin/Manager Dashboard - Full business metrics
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your business overview.</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {adminMetrics?.totalRevenue?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {adminMetrics?.salesCount || 0} orders · sum of order totals
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              LKR {adminMetrics?.totalExpenses?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From income statement (period YTD)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {adminMetrics?.inventoryValue?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {adminMetrics?.inventoryCount || 0} SKUs at cost
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminMetrics?.employeeCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total employees
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending POs</CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {adminMetrics?.pendingPOs || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting action
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              LKR {adminMetrics?.payrollSummary?.totalNetSalary?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {adminMetrics?.payrollSummary?.totalEmployees || 0} employees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={adminMetrics?.revenueSeries || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Latest {adminMetrics?.recentOrders?.length || 0} sales orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {adminMetrics?.recentOrders && adminMetrics.recentOrders.length > 0 ? (
                adminMetrics.recentOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {order.id.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{order.id}</p>
                        <p className="text-xs text-muted-foreground">Customer #{order.customerId}</p>
                      </div>
                    </div>
                    <div className="text-sm font-medium">{order.amount}</div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent orders</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Sales</CardTitle>
          <CardDescription>Sales performance for the current week</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={adminMetrics?.weeklySalesSeries || []}>
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Bar
                dataKey="sales"
                fill="hsl(var(--primary))"
                radius={[8, 8, 0, 0]}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
