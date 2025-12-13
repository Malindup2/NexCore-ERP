"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Calendar, Clock, FileText, Award } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Line, LineChart, Area, AreaChart } from "recharts";
import { getUser, UserRoles } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166";

const revenueData = [
  { month: "Jan", revenue: 1485 },
  { month: "Feb", revenue: 1254 },
  { month: "Mar", revenue: 1716 },
  { month: "Apr", revenue: 1518 },
  { month: "May", revenue: 1914 },
  { month: "Jun", revenue: 2046 },
];

const salesData = [
  { name: "Mon", sales: 120 },
  { name: "Tue", sales: 150 },
  { name: "Wed", sales: 180 },
  { name: "Thu", sales: 140 },
  { name: "Fri", sales: 200 },
  { name: "Sat", sales: 170 },
  { name: "Sun", sales: 130 },
];

const recentOrders = [
  { id: "ORD-001", customer: "Nuwan Perera", amount: "LKR 659,670", status: "Completed" },
  { id: "ORD-002", customer: "Chamari Silva", amount: "LKR 12,870", status: "Processing" },
  { id: "ORD-003", customer: "Kasun Fernando", amount: "LKR 98,670", status: "Completed" },
  { id: "ORD-004", customer: "Dilini Rajapakse", amount: "LKR 32,670", status: "Pending" },
];

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getUser()
    setUser(currentUser)
    
    // Fetch dashboard data for employees
    if (currentUser?.role === UserRoles.Employee) {
      fetchEmployeeDashboard(currentUser.id)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchEmployeeDashboard = async (userId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/EmployeeSelfService/dashboard/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error)
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
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">LKR 14,926,523</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+20.1%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2,350</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+180.1%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+5%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+12</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending POs</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-red-500" />
              <span className="text-red-500">+2</span> urgent
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">In 5 Days</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="text-muted-foreground">Est. LKR 41.25M</span>
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
              <AreaChart data={revenueData}>
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
            <CardDescription>You made 265 sales this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {order.customer.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{order.customer}</p>
                      <p className="text-xs text-muted-foreground">{order.id}</p>
                    </div>
                  </div>
                  <div className="text-sm font-medium">{order.amount}</div>
                </div>
              ))}
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
            <BarChart data={salesData}>
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
