"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, DollarSign, Download, FileText } from "lucide-react"

interface PayrollRecord {
  id: number
  employeeName: string
  month: string
  baseSalary: number
  deductions: number
  netSalary: number
  status: "Paid" | "Pending" | "Processing"
}

const mockPayroll: PayrollRecord[] = [
  { id: 1, employeeName: "Nuwan Perera", month: "December 2025", baseSalary: 150000, deductions: 15000, netSalary: 135000, status: "Pending" },
  { id: 2, employeeName: "Chamari Silva", month: "December 2025", baseSalary: 180000, deductions: 18000, netSalary: 162000, status: "Pending" },
  { id: 3, employeeName: "Kasun Fernando", month: "December 2025", baseSalary: 120000, deductions: 12000, netSalary: 108000, status: "Pending" },
  { id: 4, employeeName: "Nuwan Perera", month: "November 2025", baseSalary: 150000, deductions: 15000, netSalary: 135000, status: "Paid" },
  { id: 5, employeeName: "Chamari Silva", month: "November 2025", baseSalary: 180000, deductions: 18000, netSalary: 162000, status: "Paid" },
]

export default function PayrollPage() {
  const [payrollRecords] = useState<PayrollRecord[]>(mockPayroll)
  const [selectedMonth, setSelectedMonth] = useState("all")

  const filteredRecords = selectedMonth === "all" 
    ? payrollRecords 
    : payrollRecords.filter(record => record.month === selectedMonth)

  const totalPayroll = filteredRecords.reduce((sum, record) => sum + record.netSalary, 0)
  const pendingPayments = filteredRecords.filter(r => r.status === "Pending").length

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
          <p className="text-muted-foreground">Manage employee salaries and payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Generate Payslips
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">LKR {totalPayroll.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">For selected period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRecords.filter(r => r.status === "Paid").length}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payroll Records</CardTitle>
              <CardDescription>View and manage employee payroll</CardDescription>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                <SelectItem value="December 2025">December 2025</SelectItem>
                <SelectItem value="November 2025">November 2025</SelectItem>
                <SelectItem value="October 2025">October 2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Base Salary</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.employeeName}</TableCell>
                  <TableCell>{record.month}</TableCell>
                  <TableCell className="text-right">LKR {record.baseSalary.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-red-500">-LKR {record.deductions.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold">LKR {record.netSalary.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        record.status === "Paid" ? "success" : 
                        record.status === "Processing" ? "warning" : 
                        "secondary"
                      }
                    >
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
