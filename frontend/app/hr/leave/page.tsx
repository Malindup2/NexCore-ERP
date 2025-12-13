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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5003"

interface LeaveType {
  id: number
  name: string
  description: string
  defaultDaysPerYear: number
  isPaid: boolean
  requiresApproval: boolean
}

interface LeaveBalance {
  id: number
  leaveTypeId: number
  leaveTypeName: string
  year: number
  totalDays: number
  usedDays: number
  remainingDays: number
}

interface LeaveRequest {
  id: number
  leaveTypeId: number
  leaveTypeName: string
  startDate: string
  endDate: string
  numberOfDays: number
  reason: string
  status: string
  createdAt: string
  approvalNotes?: string
}

export default function LeavePage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newRequest, setNewRequest] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    reason: ""
  })

  // Mock employee ID - in real app, get from auth context
  const employeeId = 1

  useEffect(() => {
    fetchLeaveTypes()
    fetchLeaveBalances()
    fetchLeaveRequests()
  }, [])

  const fetchLeaveTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Leave/types`)
      const data = await response.json()
      setLeaveTypes(data)
    } catch (error) {
      console.error("Error fetching leave types:", error)
    }
  }

  const fetchLeaveBalances = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Leave/balance/${employeeId}`)
      const data = await response.json()
      setLeaveBalances(data)
    } catch (error) {
      console.error("Error fetching leave balances:", error)
    }
  }

  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Leave/requests/employee/${employeeId}`)
      const data = await response.json()
      setLeaveRequests(data)
    } catch (error) {
      console.error("Error fetching leave requests:", error)
    }
  }

  const handleSubmitRequest = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Leave/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          leaveTypeId: parseInt(newRequest.leaveTypeId),
          startDate: newRequest.startDate,
          endDate: newRequest.endDate,
          reason: newRequest.reason
        })
      })

      if (response.ok) {
        setIsDialogOpen(false)
        setNewRequest({ leaveTypeId: "", startDate: "", endDate: "", reason: "" })
        fetchLeaveRequests()
        fetchLeaveBalances()
      } else {
        const error = await response.json()
        alert(error.message || "Failed to submit leave request")
      }
    } catch (error) {
      console.error("Error submitting leave request:", error)
      alert("Failed to submit leave request")
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

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground">Manage your leave requests and balances</p>
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
              <DialogTitle>New Leave Request</DialogTitle>
              <DialogDescription>Submit a leave request for approval</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="leaveType">Leave Type</Label>
                <Select value={newRequest.leaveTypeId} onValueChange={(value) => setNewRequest({...newRequest, leaveTypeId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map(type => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name} ({type.isPaid ? "Paid" : "Unpaid"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input 
                    id="startDate" 
                    type="date" 
                    value={newRequest.startDate}
                    onChange={(e) => setNewRequest({...newRequest, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input 
                    id="endDate" 
                    type="date" 
                    value={newRequest.endDate}
                    onChange={(e) => setNewRequest({...newRequest, endDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea 
                  id="reason" 
                  placeholder="Enter reason for leave..."
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitRequest}>Submit Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leave Balance Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Leave Balance</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leaveBalances.map(balance => (
            <Card key={balance.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{balance.leaveTypeName}</CardTitle>
                <CardDescription>Year {balance.year}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">{balance.totalDays} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Used</span>
                    <span className="font-medium">{balance.usedDays} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-semibold text-primary">{balance.remainingDays} days</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 mt-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all" 
                      style={{ width: `${(balance.usedDays / balance.totalDays) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Leave Requests</CardTitle>
          <CardDescription>View your submitted leave requests</CardDescription>
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
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No leave requests yet
                  </TableCell>
                </TableRow>
              ) : (
                leaveRequests.map(request => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.leaveTypeName}</TableCell>
                    <TableCell>{new Date(request.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(request.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>{request.numberOfDays}</TableCell>
                    <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
