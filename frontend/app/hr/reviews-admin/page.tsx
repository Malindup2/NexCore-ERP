"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Plus, Filter, Calendar as CalendarIcon, Star } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProtectedRoute } from "@/components/protected-route"
import { UserRoles } from "@/lib/auth"
import { apiJson, ApiError } from "@/lib/api"
import { toast } from "sonner"

interface PerformanceReview {
  id: number
  employeeId: number
  employeeName: string
  period: string
  reviewDate: string
  status: string
  overallRating?: number
}

interface Employee {
  id: number
  firstName: string
  lastName: string
}

export default function PerformanceReviewsAdminPage() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  
  const [newReview, setNewReview] = useState({
    employeeId: "",
    reviewerId: "",
    period: "Annual",
    reviewDate: new Date().toISOString().split('T')[0],
    periodStartDate: "",
    periodEndDate: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [reviewsData, employeesData] = await Promise.all([
        apiJson<PerformanceReview[]>("/api/hr/PerformanceReview"),
        apiJson<Employee[]>("/api/hr/employees")
      ])
      setReviews(reviewsData)
      setEmployees(employeesData)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load performance reviews")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReview = async () => {
    try {
      if (!newReview.employeeId || !newReview.reviewerId || !newReview.periodStartDate || !newReview.periodEndDate) {
        toast.error("Please fill all required fields")
        return
      }

      await apiJson("/api/hr/PerformanceReview", {
        method: "POST",
        body: JSON.stringify({
          employeeId: parseInt(newReview.employeeId),
          reviewerId: parseInt(newReview.reviewerId),
          period: newReview.period,
          reviewDate: new Date(newReview.reviewDate).toISOString(),
          periodStartDate: new Date(newReview.periodStartDate).toISOString(),
          periodEndDate: new Date(newReview.periodEndDate).toISOString()
        }),
      })
      
      toast.success("Performance review draft created!")
      setIsAddDialogOpen(false)
      fetchData() // Refresh list
    } catch (error) {
      console.error("Error creating review:", error)
      toast.error(error instanceof ApiError ? error.message : "Failed to create review")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Draft":
        return <Badge variant="secondary">Draft</Badge>
      case "InProgress":
        return <Badge className="bg-blue-500">In Progress</Badge>
      case "Published":
        return <Badge className="bg-green-500">Published</Badge>
      case "Acknowledged":
        return <Badge className="bg-purple-500">Acknowledged</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredReviews = reviews.filter(r => 
    r.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.period?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <ProtectedRoute requiredRoles={[UserRoles.Admin, UserRoles.HRManager]}>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Performance Reviews</h1>
            <p className="text-muted-foreground">Manage and track employee performance cycles</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Initialize Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Start New Performance Review</DialogTitle>
                <DialogDescription>Create a draft review for an employee</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select onValueChange={(val) => setNewReview({...newReview, employeeId: val})}>
                    <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                    <SelectContent>
                      {employees.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.firstName} {e.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reviewer (Manager/HR)</Label>
                  <Select onValueChange={(val) => setNewReview({...newReview, reviewerId: val})}>
                    <SelectTrigger><SelectValue placeholder="Select reviewer" /></SelectTrigger>
                    <SelectContent>
                      {employees.map(e => <SelectItem key={`rev-${e.id}`} value={e.id.toString()}>{e.firstName} {e.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Review Period Type</Label>
                  <Select value={newReview.period} onValueChange={(val) => setNewReview({...newReview, period: val})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Annual">Annual</SelectItem>
                      <SelectItem value="HalfYearly">Mid-Year</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Period Start</Label>
                    <Input type="date" value={newReview.periodStartDate} onChange={e => setNewReview({...newReview, periodStartDate: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Period End</Label>
                    <Input type="date" value={newReview.periodEndDate} onChange={e => setNewReview({...newReview, periodEndDate: e.target.value})} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateReview}>Create Draft</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Review Register</CardTitle>
                <CardDescription>All performance evaluations across the company</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employee or period..."
                    className="pl-8 w-[250px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
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
                    <TableHead>Employee</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Date Logged</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Overall Rating</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No performance reviews found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell className="font-semibold">{review.employeeName}</TableCell>
                        <TableCell>{review.period}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <CalendarIcon className="h-3 w-3" />
                            {new Date(review.reviewDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(review.status)}</TableCell>
                        <TableCell>
                          {review.overallRating ? (
                            <div className="flex items-center gap-1 font-medium text-amber-500">
                              <Star className="h-4 w-4 fill-amber-500" />
                              {review.overallRating.toFixed(1)} / 5.0
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Pending</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Manage</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
