"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, XCircle, Calendar } from "lucide-react"
import { getUser } from "@/lib/auth"
import { useRouter } from "next/navigation"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"

interface AttendanceRecord {
  id: number
  date: string
  checkInTime?: string
  checkOutTime?: string
  workingHours?: number
  overtimeHours?: number
  status: string
  location?: string
}

interface AttendanceData {
  records: AttendanceRecord[]
  summary: {
    totalPresent: number
    totalWorkingHours: number
    totalOvertimeHours: number
    attendancePercentage: number
  }
}

export default function AttendancePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null)
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const currentUser = getUser()
    if (!currentUser) {
      router.push("/auth/login")
      return
    }
    setUser(currentUser)
    fetchAttendanceData(currentUser.id)
    
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const currentUser = getUser()
    if (!currentUser) {
      router.push("/auth/login")
      return
    }
    setUser(currentUser)
    fetchAttendanceData(currentUser.id)
    
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchAttendanceData = async (userId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/EmployeeSelfService/attendance/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setAttendanceData(data)
        
        // Find today's record
        const today = new Date().toISOString().split('T')[0]
        const todayRec = data.records?.find((r: AttendanceRecord) => 
          new Date(r.date).toISOString().split('T')[0] === today
        )
        setTodayRecord(todayRec || null)
      }
    } catch (error) {
      console.error("Error fetching attendance:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!user) return
    
    setActionLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/Attendance/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: user.id,
          location: "Office",
          notes: ""
        })
      })

      if (response.ok) {
        await fetchAttendanceData(user.id)
      } else {
        const error = await response.json()
        alert(error.message || "Failed to check in")
      }
    } catch (error) {
      console.error("Check-in error:", error)
      alert("Failed to check in")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (!todayRecord?.id || !user) return

    setActionLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/Attendance/check-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceId: todayRecord.id,
          notes: ""
        })
      })

      if (response.ok) {
        await fetchAttendanceData(user.id)
      } else {
        const error = await response.json()
        alert(error.message || "Failed to check out")
      }
    } catch (error) {
      console.error("Check-out error:", error)
      alert("Failed to check out")
    } finally {
      setActionLoading(false)
    }
  }

  const formatTime = (dateString?: string) => {
    if (!dateString) return "--:--"
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "Present":
        return <Badge className="bg-green-500">Present</Badge>
      case "Absent":
        return <Badge variant="destructive">Absent</Badge>
      case "Late":
        return <Badge className="bg-yellow-500">Late</Badge>
      case "OnLeave":
        return <Badge className="bg-blue-500">On Leave</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading attendance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-muted-foreground">Track your daily attendance</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceData?.summary?.attendancePercentage || 0}%</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Days Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceData?.summary?.totalPresent || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Working Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceData?.summary?.totalWorkingHours?.toFixed(1) || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overtime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceData?.summary?.totalOvertimeHours?.toFixed(1) || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Time Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Current Time
            </CardTitle>
            <CardDescription>
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
              })}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Status
            </CardTitle>
            <CardDescription>Your attendance for today</CardDescription>
          </CardHeader>
          <CardContent>
            {todayRecord ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(todayRecord.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Check-in</span>
                  <span className="font-semibold">{formatTime(todayRecord.checkInTime)}</span>
                </div>
                {todayRecord.checkOutTime && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Check-out</span>
                      <span className="font-semibold">{formatTime(todayRecord.checkOutTime)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Working Hours</span>
                      <span className="font-semibold">{todayRecord.workingHours?.toFixed(2)} hrs</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Not checked in yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Check-in/Check-out Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Check in or check out for the day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {!todayRecord ? (
              <Button 
                onClick={handleCheckIn} 
                disabled={actionLoading}
                size="lg"
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-5 w-5" />
                Check In
              </Button>
            ) : !todayRecord.checkOutTime ? (
              <Button 
                onClick={handleCheckOut} 
                disabled={actionLoading}
                variant="destructive"
                size="lg"
                className="flex items-center gap-2"
              >
                <XCircle className="h-5 w-5" />
                Check Out
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Completed for today</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>Your attendance records for this month</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Working Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceData?.records && attendanceData.records.length > 0 ? (
                attendanceData.records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell>{formatTime(record.checkInTime)}</TableCell>
                    <TableCell>{formatTime(record.checkOutTime)}</TableCell>
                    <TableCell>{record.workingHours?.toFixed(2) || '--'} hrs</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No attendance records found for this month
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
