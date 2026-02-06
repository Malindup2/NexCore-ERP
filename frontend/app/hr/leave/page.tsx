"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Calendar, CheckCircle, XCircle, Clock } from "lucide-react"
import { getUser } from "@/lib/auth"
import { useRouter } from "next/navigation"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"

interface LeaveRequest {
  id: number
  leaveType: string
  startDate: string
  endDate: string
  numberOfDays: number
  reason: string
  status: string
  approvedBy?: string
  approvedDate?: string
  approvalNotes?: string
}

interface LeaveBalance {
  total: number
  used: number
  remaining: number
}

interface LeaveType {
  id: number
  name: string
  description?: string
  defaultDaysPerYear: number
  isPaid: boolean
}

export default function LeavePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null)
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newRequest, setNewRequest] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    reason: ""
  })

  useEffect(() => {
    const currentUser = getUser()
    if (!currentUser) {
      router.push("/auth/login")
      return
    }
    setUser(currentUser)
    fetchLeaveData(currentUser.id)
    fetchLeaveTypes()
  }, [])

  const fetchLeaveData = async (userId: number) => {
    try {
      console.log("Fetching leave data for userId:", userId)
      console.log("URL:", `${API_BASE_URL}/api/EmployeeSelfService/leaves/${userId}`)
      
      const response = await fetch(`${API_BASE_URL}/api/EmployeeSelfService/leaves/${userId}`)
      console.log("Response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("Leave data received:", data)
        setLeaveRequests(data.requests || [])
        setLeaveBalance(data.balance || null)
      } else {
        const errorText = await response.text()
        console.error("Error response:", errorText)
      }
    } catch (error) {
      console.error("Error fetching leave data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaveTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/EmployeeSelfService/leave-types`)
      if (response.ok) {
        const data = await response.json()
        setLeaveTypes(data)
      }
    } catch (error) {
      console.error("Error fetching leave types:", error)
    }
  }

  const handleSubmitRequest = async () => {
    if (!user || !newRequest.leaveTypeId || !newRequest.startDate || !newRequest.endDate || !newRequest.reason) {
      alert("Please fill in all fields")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/EmployeeSelfService/leaves/${user.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leaveTypeId: parseInt(newRequest.leaveTypeId),
          startDate: newRequest.startDate,
          endDate: newRequest.endDate,
          reason: newRequest.reason,
        }),
      })

      if (response.ok) {
        alert("Leave request submitted successfully!")
        setIsDialogOpen(false)
        setNewRequest({ leaveTypeId: "", startDate: "", endDate: "", reason: "" })
        fetchLeaveData(user.id) // Refresh the list
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || "Failed to submit leave request"}`)
      }
    } catch (error) {
      console.error("Error submitting leave request:", error)
      alert("Failed to submit leave request")
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>
      case "Approved":
        return <Badge className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>
      case "Rejected":
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading leave data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Leave</h1>
          <p className="text-muted-foreground">Manage your leave requests and balance</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Request Leave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Leave</DialogTitle>
              <DialogDescription>Submit a new leave request</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="leaveType">Leave Type</Label>
                <Select value={newRequest.leaveTypeId} onValueChange={(value) => setNewRequest({ ...newRequest, leaveTypeId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name} ({type.isPaid ? "Paid" : "Unpaid"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newRequest.startDate}
                  onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newRequest.endDate}
                  onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Reason for leave"
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmitRequest} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leave Balance */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveBalance?.total || 0} days</div>
            <p className="text-xs text-muted-foreground">Annual entitlement</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Used Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveBalance?.used || 0} days</div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Remaining Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveBalance?.remaining || 0} days</div>
            <p className="text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Leave Requests</CardTitle>
          <CardDescription>Your leave request history</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.length > 0 ? (
                leaveRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.leaveType}</TableCell>
                    <TableCell>{new Date(request.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(request.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>{request.numberOfDays}</TableCell>
                    <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No leave requests found
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
