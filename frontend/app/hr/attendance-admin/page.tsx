"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Search, Calendar as CalendarIcon, Download, Clock, Plus } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { UserRoles } from "@/lib/auth"
import { apiJson, ApiError } from "@/lib/api"
import { toast } from "sonner"

interface AttendanceRecord {
  id: number
  employeeId: number
  employeeName: string
  date: string
  status: string
  checkInTime?: string
  checkOutTime?: string
  workingHours?: number
  overtimeHours?: number
  notes?: string
  location?: string
}

export default function AttendanceAdminPage() {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false)
  const [isSubmittingManual, setIsSubmittingManual] = useState(false)
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [searchQuery, setSearchQuery] = useState("")
  const [manualForm, setManualForm] = useState({
    employeeId: "",
    date: new Date().toISOString().split('T')[0],
    status: "Present",
    checkInTime: "",
    checkOutTime: "",
    notes: ""
  })

  useEffect(() => {
    fetchAttendances(dateFilter)
  }, [dateFilter])

  const fetchAttendances = async (date: string) => {
    setLoading(true)
    try {
      const data = await apiJson<AttendanceRecord[]>(`/api/hr/Attendance?date=${date}`)
      setAttendances(data)
    } catch (error) {
      console.error("Error fetching attendances:", error)
    } finally {
      setLoading(false)
    }
  }

  const toIsoDateTime = (date: string, time?: string) => {
    if (!time) return null
    return `${date}T${time}:00`
  }

  const handleManualAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmittingManual) return

    const employeeId = parseInt(manualForm.employeeId, 10)
    if (!employeeId || employeeId <= 0) {
      toast.error("Please enter a valid employee ID")
      return
    }

    setIsSubmittingManual(true)
    try {
      await apiJson("/api/hr/Attendance/manual", {
        method: "POST",
        body: JSON.stringify({
          employeeId,
          date: manualForm.date,
          status: manualForm.status,
          checkInTime: toIsoDateTime(manualForm.date, manualForm.checkInTime) ?? undefined,
          checkOutTime: toIsoDateTime(manualForm.date, manualForm.checkOutTime) ?? undefined,
          notes: manualForm.notes || undefined,
        }),
      })

      toast.success("Manual attendance marked successfully")
      setIsManualDialogOpen(false)
      setManualForm({
        employeeId: "",
        date: new Date().toISOString().split('T')[0],
        status: "Present",
        checkInTime: "",
        checkOutTime: "",
        notes: ""
      })
      await fetchAttendances(dateFilter)
    } catch (error) {
      console.error("Error marking manual attendance:", error)
      if (error instanceof ApiError) {
        toast.error(error.message || "Failed to mark attendance")
      } else {
        toast.error("Failed to mark attendance")
      }
    } finally {
      setIsSubmittingManual(false)
    }
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return "--:--"
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Present":
        return <Badge className="bg-green-500">Present</Badge>
      case "Absent":
        return <Badge variant="destructive">Absent</Badge>
      case "Late":
        return <Badge className="bg-yellow-500">Late</Badge>
      case "OnLeave":
        return <Badge className="bg-blue-500">On Leave</Badge>
      case "HalfDay":
        return <Badge className="bg-orange-500">Half Day</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredAttendances = attendances.filter(a => 
    a.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPresent = attendances.filter(a => a.status === 'Present' || a.status === 'Late').length
  const totalAbsent = attendances.filter(a => a.status === 'Absent').length
  const totalOnLeave = attendances.filter(a => a.status === 'OnLeave').length

  return (
    <ProtectedRoute requiredRoles={[UserRoles.Admin, UserRoles.HRManager]}>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Company Attendance</h1>
            <p className="text-muted-foreground">Monitor daily workforce attendance records</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsManualDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Mark Attendance
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Records Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendances.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Present & Late</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPresent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Absent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAbsent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">On Leave</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOnLeave}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Daily Register</CardTitle>
                <CardDescription>Attendance log for all employees</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employee..."
                    className="pl-8 w-[250px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2 border rounded-md p-1 px-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="border-0 focus-visible:ring-0 shadow-none p-0 h-8"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Working Hours</TableHead>
                    <TableHead>Overtime</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No attendance records found for this date
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAttendances.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-semibold">{record.employeeName}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {formatTime(record.checkInTime)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {record.checkOutTime && <Clock className="h-3 w-3 text-muted-foreground" />}
                            {formatTime(record.checkOutTime)}
                          </div>
                        </TableCell>
                        <TableCell>{record.workingHours ? `${record.workingHours.toFixed(1)} hrs` : '--'}</TableCell>
                        <TableCell className={record.overtimeHours ? "text-green-600 font-medium" : ""}>
                          {record.overtimeHours ? `+${record.overtimeHours.toFixed(1)} hrs` : '--'}
                        </TableCell>
                        <TableCell>{record.location || '--'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Mark Manual Attendance</DialogTitle>
              <DialogDescription>Create an attendance entry for an employee</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleManualAttendanceSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                      id="employeeId"
                      type="number"
                      min="1"
                      value={manualForm.employeeId}
                      onChange={(e) => setManualForm({ ...manualForm, employeeId: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="attendanceDate">Date</Label>
                    <Input
                      id="attendanceDate"
                      type="date"
                      value={manualForm.date}
                      onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={manualForm.status}
                    onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="HalfDay">Half Day</option>
                    <option value="Late">Late</option>
                    <option value="OnLeave">On Leave</option>
                    <option value="Holiday">Holiday</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkInTime">Check In Time</Label>
                    <Input
                      id="checkInTime"
                      type="time"
                      value={manualForm.checkInTime}
                      onChange={(e) => setManualForm({ ...manualForm, checkInTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOutTime">Check Out Time</Label>
                    <Input
                      id="checkOutTime"
                      type="time"
                      value={manualForm.checkOutTime}
                      onChange={(e) => setManualForm({ ...manualForm, checkOutTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={manualForm.notes}
                    onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsManualDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingManual}>
                  {isSubmittingManual ? "Saving..." : "Save Attendance"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
