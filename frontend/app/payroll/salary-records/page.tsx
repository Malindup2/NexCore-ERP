"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, DollarSign, Users, TrendingUp, Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"

interface SalaryRecord {
  id: number
  employeeId: number
  employeeName: string
  department: string
  basicSalary: number
  allowances: number
  netSalary: number
  createdAt: string
}

export default function SalaryRecordsPage() {
  const router = useRouter()
  const [salaries, setSalaries] = useState<SalaryRecord[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSalary, setEditingSalary] = useState<SalaryRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    basicSalary: 0,
    allowances: 0
  })

  useEffect(() => {
    const userRole = localStorage.getItem("userRole")
    if (userRole !== "Admin" && userRole !== "HRManager") {
      router.push("/")
      return
    }
    fetchSalaries()
  }, [router])

  const fetchSalaries = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payroll/salaries`)
      const data = await response.json()
      setSalaries(data)
    } catch (error) {
      console.error("Error fetching salaries:", error)
      toast.error("Failed to load salary records")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (salary: SalaryRecord) => {
    setEditingSalary(salary)
    setFormData({
      basicSalary: salary.basicSalary,
      allowances: salary.allowances
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSalary) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/payroll/salaries/${editingSalary.employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("Salary updated successfully")
        setIsDialogOpen(false)
        setEditingSalary(null)
        fetchSalaries()
      } else {
        toast.error("Failed to update salary")
      }
    } catch (error) {
      console.error("Error updating salary:", error)
      toast.error("Failed to update salary")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const filteredSalaries = salaries.filter(salary =>
    salary.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    salary.department.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalBasicSalary = salaries.reduce((sum, s) => sum + s.basicSalary, 0)
  const totalAllowances = salaries.reduce((sum, s) => sum + s.allowances, 0)
  const totalNetSalary = salaries.reduce((sum, s) => sum + s.netSalary, 0)
  const avgSalary = salaries.length > 0 ? totalNetSalary / salaries.length : 0

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Salary Records</h1>
          <p className="text-muted-foreground">Manage employee salary structures</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salaries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Basic Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">LKR {totalBasicSalary.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Net Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">LKR {totalNetSalary.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">LKR {avgSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Salary Structure</CardTitle>
              <CardDescription>View and update employee salaries</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Basic Salary</TableHead>
                <TableHead className="text-right">Allowances</TableHead>
                <TableHead className="text-right">Net Salary</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSalaries.map((salary) => (
                <TableRow key={salary.id}>
                  <TableCell className="font-mono">{salary.employeeId}</TableCell>
                  <TableCell className="font-medium">{salary.employeeName}</TableCell>
                  <TableCell>{salary.department}</TableCell>
                  <TableCell className="text-right">LKR {salary.basicSalary.toLocaleString()}</TableCell>
                  <TableCell className="text-right">LKR {salary.allowances.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">
                    LKR {salary.netSalary.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(salary)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Salary</DialogTitle>
            <DialogDescription>
              Update salary for {editingSalary?.employeeName} (ID: {editingSalary?.employeeId})
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="basicSalary">Basic Salary</Label>
                <Input
                  id="basicSalary"
                  type="number"
                  value={formData.basicSalary}
                  onChange={(e) => setFormData({ ...formData, basicSalary: parseFloat(e.target.value) })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allowances">Allowances</Label>
                <Input
                  id="allowances"
                  type="number"
                  value={formData.allowances}
                  onChange={(e) => setFormData({ ...formData, allowances: parseFloat(e.target.value) })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Net Salary:</span>
                  <span className="text-2xl font-bold text-green-500">
                    LKR {(formData.basicSalary + formData.allowances).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Salary</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
