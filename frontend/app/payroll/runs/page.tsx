"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, DollarSign, Users, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"

interface PayrollRun {
  id: number
  year: number
  month: number
  employeeCount: number
  totalAmount: number
  processedDate: string
  status: string
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export default function PayrollRunsPage() {
  const router = useRouter()
  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  })

  useEffect(() => {
    const userRole = localStorage.getItem("userRole")
    if (userRole !== "Admin" && userRole !== "HRManager") {
      router.push("/")
      return
    }
    fetchPayrollRuns()
  }, [router])

  const fetchPayrollRuns = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payroll/payroll-runs`)
      const data = await response.json()
      setRuns(data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching payroll runs:", error)
      setLoading(false)
    }
  }

  const handleProcessPayroll = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/payroll/process-payroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Payroll processed successfully!\n${result.employeeCount} employees\nTotal: LKR ${result.totalPayroll.toLocaleString()}`)
        setIsDialogOpen(false)
        fetchPayrollRuns()
      } else {
        const error = await response.json()
        alert(error.message || "Failed to process payroll")
      }
    } catch (error) {
      console.error("Error processing payroll:", error)
      alert("Failed to process payroll")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const totalProcessed = runs.reduce((sum, r) => sum + r.totalAmount, 0)
  const totalEmployees = runs.length > 0 ? runs[0].employeeCount : 0
  const latestRun = runs[0]

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Runs</h1>
          <p className="text-muted-foreground">Process and track monthly payroll</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Process Payroll
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              LKR {totalProcessed.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Run</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {latestRun ? (
              <div>
                <div className="text-2xl font-bold">
                  {MONTHS[latestRun.month - 1]} {latestRun.year}
                </div>
                <p className="text-xs text-muted-foreground">
                  LKR {latestRun.totalAmount.toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="text-2xl font-bold">No runs yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll History</CardTitle>
          <CardDescription>All processed payroll runs</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Employees</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead>Processed Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">
                    {MONTHS[run.month - 1]} {run.year}
                  </TableCell>
                  <TableCell>{run.year}</TableCell>
                  <TableCell>{MONTHS[run.month - 1]}</TableCell>
                  <TableCell className="text-right">{run.employeeCount}</TableCell>
                  <TableCell className="text-right font-medium">
                    LKR {run.totalAmount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {new Date(run.processedDate).toLocaleDateString()} {" "}
                    {new Date(run.processedDate).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={run.status === "Completed" ? "default" : "secondary"}>
                      {run.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payroll</DialogTitle>
            <DialogDescription>
              Select the period to process payroll for all employees
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProcessPayroll}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Select
                  value={formData.year.toString()}
                  onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="month">Month</Label>
                <Select
                  value={formData.month.toString()}
                  onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  This will process payroll for:
                </p>
                <p className="text-lg font-semibold">
                  {MONTHS[formData.month - 1]} {formData.year}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? "Processing..." : "Process Payroll"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
