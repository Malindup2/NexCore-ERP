"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, Users, TrendingUp, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { toast } from "sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"

interface PayrollSummary {
  totalEmployees: number
  totalBasicSalary: number
  totalAllowances: number
  totalNetSalary: number
  averageSalary: number
  departmentBreakdown: Array<{
    department: string
    employeeCount: number
    totalSalary: number
  }>
}

export default function PayrollReportsPage() {
  const router = useRouter()
  const [summary, setSummary] = useState<PayrollSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userRole = localStorage.getItem("userRole")
    if (userRole !== "Admin" && userRole !== "HRManager") {
      router.push("/")
      return
    }
    fetchPayrollSummary()
  }, [router])

  const fetchPayrollSummary = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payroll/summary`)
      const data = await response.json()
      setSummary(data)
    } catch (error) {
      console.error("Error fetching payroll summary:", error)
      toast.error("Failed to load payroll reports")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Reports</h1>
          <p className="text-muted-foreground">No payroll data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payroll Reports</h1>
        <p className="text-muted-foreground">Overview and analytics of payroll data</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">Active payroll records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Basic Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {summary.totalBasicSalary.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Monthly basic pay</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Net Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              LKR {summary.totalNetSalary.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Including allowances</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {summary.averageSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per employee</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Department Breakdown</CardTitle>
            <CardDescription>Salary distribution by department</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Employees</TableHead>
                  <TableHead className="text-right">Total Salary</TableHead>
                  <TableHead className="text-right">Avg Salary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.departmentBreakdown.map((dept) => (
                  <TableRow key={dept.department}>
                    <TableCell className="font-medium">{dept.department}</TableCell>
                    <TableCell className="text-right">{dept.employeeCount}</TableCell>
                    <TableCell className="text-right">
                      LKR {dept.totalSalary.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      LKR {(dept.totalSalary / dept.employeeCount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Salary Chart</CardTitle>
            <CardDescription>Visual representation of department costs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summary.departmentBreakdown}>
                <XAxis 
                  dataKey="department" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: number) => [`LKR ${value.toLocaleString()}`, 'Total Salary']}
                />
                <Bar
                  dataKey="totalSalary"
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Cost Analysis</CardTitle>
          <CardDescription>Breakdown of salary components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Basic Salary</p>
                <p className="text-xs text-muted-foreground">Base compensation for all employees</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">LKR {summary.totalBasicSalary.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {((summary.totalBasicSalary / summary.totalNetSalary) * 100).toFixed(1)}% of total
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Allowances</p>
                <p className="text-xs text-muted-foreground">Additional benefits and compensations</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">LKR {summary.totalAllowances.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {((summary.totalAllowances / summary.totalNetSalary) * 100).toFixed(1)}% of total
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-lg font-semibold">Total Net Salary</p>
                <p className="text-xs text-muted-foreground">Monthly payroll cost</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-500">
                  LKR {summary.totalNetSalary.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">100% of payroll</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
