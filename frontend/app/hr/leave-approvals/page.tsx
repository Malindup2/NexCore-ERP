"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { format } from "date-fns";

interface LeaveRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  leaveTypeId: number;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
  status: string;
  approvedBy?: number;
  approvedDate?: string;
  approvalNotes?: string;
  createdAt: string;
}

export default function LeaveApprovalsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("Pending");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "Admin" && userRole !== "Manager") {
      router.push("/");
      return;
    }
    fetchLeaveRequests();
  }, [router]);

  useEffect(() => {
    filterRequests();
  }, [statusFilter, leaveRequests]);

  const fetchLeaveRequests = async () => {
    try {
      const response = await api.get("/hr/Leave/requests");
      setLeaveRequests(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      toast({
        title: "Error",
        description: "Failed to load leave requests",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const filterRequests = () => {
    if (statusFilter === "All") {
      setFilteredRequests(leaveRequests);
    } else {
      setFilteredRequests(
        leaveRequests.filter((req) => req.status === statusFilter)
      );
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    setProcessing(true);
    try {
      const userId = localStorage.getItem("userId");
      await api.post(`/hr/Leave/requests/${selectedRequest.id}/approve`, {
        approvedBy: parseInt(userId || "0"),
        approvalNotes: approvalNotes,
      });

      toast({
        title: "Success",
        description: "Leave request approved successfully",
      });

      setShowApproveDialog(false);
      setApprovalNotes("");
      setSelectedRequest(null);
      fetchLeaveRequests();
    } catch (error: any) {
      console.error("Error approving leave:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to approve leave request",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    setProcessing(true);
    try {
      const userId = localStorage.getItem("userId");
      await api.post(`/hr/Leave/requests/${selectedRequest.id}/reject`, {
        rejectedBy: parseInt(userId || "0"),
        rejectionNotes: approvalNotes,
      });

      toast({
        title: "Success",
        description: "Leave request rejected",
      });

      setShowRejectDialog(false);
      setApprovalNotes("");
      setSelectedRequest(null);
      fetchLeaveRequests();
    } catch (error: any) {
      console.error("Error rejecting leave:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reject leave request",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "Approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "Rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "Cancelled":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Leave Approvals</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Requests</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No {statusFilter !== "All" ? statusFilter.toLowerCase() : ""} leave requests found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.employeeName}</TableCell>
                    <TableCell>{request.leaveTypeName}</TableCell>
                    <TableCell>{format(new Date(request.startDate), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{format(new Date(request.endDate), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{request.numberOfDays}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>{format(new Date(request.createdAt), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {request.status === "Pending" && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowApproveDialog(true);
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRejectDialog(true);
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Employee</Label>
                <p className="font-medium">{selectedRequest.employeeName}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Leave Type</Label>
                <p className="font-medium">{selectedRequest.leaveTypeName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Start Date</Label>
                  <p className="font-medium">{format(new Date(selectedRequest.startDate), "MMM dd, yyyy")}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">End Date</Label>
                  <p className="font-medium">{format(new Date(selectedRequest.endDate), "MMM dd, yyyy")}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Number of Days</Label>
                <p className="font-medium">{selectedRequest.numberOfDays}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Reason</Label>
                <p className="font-medium">{selectedRequest.reason}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>
              {selectedRequest.approvalNotes && (
                <div>
                  <Label className="text-sm text-muted-foreground">
                    {selectedRequest.status === "Approved" ? "Approval Notes" : "Rejection Notes"}
                  </Label>
                  <p className="font-medium">{selectedRequest.approvalNotes}</p>
                </div>
              )}
              {selectedRequest.approvedDate && (
                <div>
                  <Label className="text-sm text-muted-foreground">
                    {selectedRequest.status === "Approved" ? "Approved On" : "Rejected On"}
                  </Label>
                  <p className="font-medium">{format(new Date(selectedRequest.approvedDate), "MMM dd, yyyy")}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Leave Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this leave request for {selectedRequest?.employeeName}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="approvalNotes">Approval Notes (Optional)</Label>
              <Textarea
                id="approvalNotes"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes or comments..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowApproveDialog(false);
              setApprovalNotes("");
            }} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={processing}>
              {processing ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this leave request for {selectedRequest?.employeeName}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionNotes">Rejection Reason</Label>
              <Textarea
                id="rejectionNotes"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Provide a reason for rejection..."
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRejectDialog(false);
              setApprovalNotes("");
            }} disabled={processing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing || !approvalNotes.trim()}>
              {processing ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
