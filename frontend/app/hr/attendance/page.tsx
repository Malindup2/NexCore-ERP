"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, XCircle, Calendar } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5003"

interface TodayAttendance {
  checkedIn: boolean
  attendanceId?: number
  checkInTime?: string
  checkOutTime?: string
  workingHours?: number
  status?: string
}

export default function AttendancePage() {
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Mock employee ID - in real app, get from auth context
  const employeeId = 1

  useEffect(() => {
    fetchTodayAttendance()
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchTodayAttendance = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Attendance/today/${employeeId}`)
      const data = await response.json()
      setTodayAttendance(data)
    } catch (error) {
      console.error("Error fetching attendance:", error)
    }
  }

  const handleCheckIn = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/Attendance/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employeeId,
          location: "Office",
          notes: ""
        })
      })

      if (response.ok) {
        await fetchTodayAttendance()
      } else {
        const error = await response.json()
        alert(error.message || "Failed to check in")
      }
    } catch (error) {
      console.error("Check-in error:", error)
      alert("Failed to check in")
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (!todayAttendance?.attendanceId) return

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/Attendance/check-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceId: todayAttendance.attendanceId,
          notes: ""
        })
      })

      if (response.ok) {
        await fetchTodayAttendance()
      } else {
        const error = await response.json()
        alert(error.message || "Failed to check out")
      }
    } catch (error) {
      console.error("Check-out error:", error)
      alert("Failed to check out")
    } finally {
      setLoading(false)
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

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">Track your daily attendance</p>
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
            {todayAttendance?.checkedIn ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(todayAttendance.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Check-in</span>
                  <span className="font-semibold">{formatTime(todayAttendance.checkInTime)}</span>
                </div>
                {todayAttendance.checkOutTime && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Check-out</span>
                      <span className="font-semibold">{formatTime(todayAttendance.checkOutTime)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Working Hours</span>
                      <span className="font-semibold">{todayAttendance.workingHours?.toFixed(2)} hrs</span>
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
            {!todayAttendance?.checkedIn ? (
              <Button 
                onClick={handleCheckIn} 
                disabled={loading}
                size="lg"
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-5 w-5" />
                Check In
              </Button>
            ) : !todayAttendance?.checkOutTime ? (
              <Button 
                onClick={handleCheckOut} 
                disabled={loading}
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
    </div>
  )
}
