"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, DollarSign, Download, FileText } from "lucide-react"
import { getUser, UserRoles } from "@/lib/auth"
import { ProtectedRoute } from "@/components/protected-route"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"

interface PayrollRecord {
  id: number
  month: number
  year: number
  monthYear: string
  baseSalary: number
  allowances: number
  overtime: number
  bonus: number
  deductions: number
  tax: number
  netSalary: number
  status: "Paid" | "Pending" | "Processing"
  paidDate?: string
  notes?: string
}

export default function PayrollPage() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const [selectedMonth, setSelectedMonth] = useState("all")
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    const currentUser = getUser()
    setUser(currentUser)
    
    if (currentUser) {
      fetchPayrollData(currentUser.id)
    }
  }, [])

  const fetchPayrollData = async (userId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/EmployeeSelfService/payroll/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setPayrollRecords(data.records)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error("Error fetching payroll:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payroll data...</p>
        </div>
      </div>
    )
  }

  const filteredRecords = selectedMonth === "all" 
    ? payrollRecords 
    : payrollRecords.filter(record => record.monthYear === selectedMonth)

  const totalPayroll = filteredRecords.reduce((sum, record) => sum + record.netSalary, 0)
  const pendingPayments = filteredRecords.filter(r => r.status === "Pending").length

  // Get unique month-year combinations for the filter
  const uniqueMonths = Array.from(new Set(payrollRecords.map(r => r.monthYear)))

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Payroll</h1>
          <p className="text-muted-foreground">View your salary and payment history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Payslip
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Year to Date</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">LKR {(summary?.yearToDateTotal || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total earnings {new Date().getFullYear()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Payment</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">LKR {(summary?.latestPayment?.netSalary || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{summary?.latestPayment?.monthYear || "No payments yet"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalRecords || 0}</div>
            <p className="text-xs text-muted-foreground">Payroll history</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Your salary payments and payslips</CardDescription>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {uniqueMonths.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month/Year</TableHead>
                <TableHead>Base Salary</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead>Overtime</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.monthYear}</TableCell>
                  <TableCell>LKR {record.baseSalary.toLocaleString()}</TableCell>
                  <TableCell>LKR {record.allowances.toLocaleString()}</TableCell>
                  <TableCell>LKR {record.overtime.toLocaleString()}</TableCell>
                  <TableCell>LKR {record.bonus.toLocaleString()}</TableCell>
                  <TableCell>LKR {record.deductions.toLocaleString()}</TableCell>
                  <TableCell>LKR {record.tax.toLocaleString()}</TableCell>
                  <TableCell className="font-semibold">LKR {record.netSalary.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={record.status === "Paid" ? "default" : "secondary"}>
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{record.paidDate ? new Date(record.paidDate).toLocaleDateString() : "N/A"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
