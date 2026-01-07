"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Star, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { getUser } from "@/lib/auth"
import { useRouter } from "next/navigation"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"

interface PerformanceReview {
  id: number
  reviewDate: string
  periodStartDate: string
  periodEndDate: string
  overallRating?: number
  strengths?: string
  areasForImprovement?: string
  goals?: string
  reviewerId?: number
  status: string
}

interface ReviewSummary {
  totalReviews: number
  averageRating: number
  latestRating: number
  latestReviewDate?: string
}

export default function PerformanceReviewPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [reviews, setReviews] = useState<PerformanceReview[]>([])
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getUser()
    if (!currentUser) {
      router.push("/auth/login")
      return
    }
    setUser(currentUser)
    fetchReviewData(currentUser.id)
  }, [])

  const fetchReviewData = async (userId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/EmployeeSelfService/reviews/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
        setSummary(data.summary || null)
      }
    } catch (error) {
      console.error("Error fetching review data:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-muted-foreground">Not rated</span>
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
        <span className="ml-2 font-semibold">{rating}/5</span>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Draft":
        return <Badge variant="secondary">Draft</Badge>
      case "InProgress":
        return <Badge variant="default">In Progress</Badge>
      case "Completed":
        return <Badge className="bg-blue-500">Completed</Badge>
      case "Published":
        return <Badge className="bg-green-500">Published</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading review data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Reviews</h1>
        <p className="text-muted-foreground">View your performance reviews</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalReviews || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.averageRating?.toFixed(1) || "N/A"}</div>
            <p className="text-xs text-muted-foreground">Out of 5</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latest Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.latestRating || "N/A"}/5</div>
            <p className="text-xs text-muted-foreground">
              {summary?.latestReviewDate ? new Date(summary.latestReviewDate).toLocaleDateString() : "No reviews yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Review History</CardTitle>
          <CardDescription>Your performance review history</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Review Date</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Overall Rating</TableHead>
                <TableHead>Strengths</TableHead>
                <TableHead>Areas for Improvement</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>{new Date(review.reviewDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {new Date(review.periodStartDate).toLocaleDateString()} - {new Date(review.periodEndDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{renderStars(review.overallRating)}</TableCell>
                    <TableCell className="max-w-xs truncate">{review.strengths || "N/A"}</TableCell>
                    <TableCell className="max-w-xs truncate">{review.areasForImprovement || "N/A"}</TableCell>
                    <TableCell>{getStatusBadge(review.status)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No performance reviews found
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
