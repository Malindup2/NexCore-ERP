"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Star, TrendingUp, TrendingDown, Minus } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5003"

interface PerformanceReview {
  id: number
  reviewerId: number
  period: string
  reviewDate: string
  periodStartDate: string
  periodEndDate: string
  status: string
  qualityOfWorkRating?: number
  productivityRating?: number
  communicationRating?: number
  teamworkRating?: number
  initiativeRating?: number
  attendanceRating?: number
  overallRating?: number
  strengths?: string
  areasForImprovement?: string
  goals?: string
  managerComments?: string
  employeeComments?: string
}

interface PerformanceSummary {
  employeeId: number
  employeeName: string
  totalReviews: number
  averageOverallRating: number
  latestOverallRating: number
  latestReviewDate?: string
  performanceTrend: string
}

export default function PerformanceReviewPage() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([])
  const [summary, setSummary] = useState<PerformanceSummary | null>(null)
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null)

  
  const employeeId = 1

  useEffect(() => {
    fetchReviews()
    fetchSummary()
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/PerformanceReview/employee/${employeeId}`)
      const data = await response.json()
      setReviews(data)
    } catch (error) {
      console.error("Error fetching reviews:", error)
    }
  }

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/PerformanceReview/summary/${employeeId}`)
      const data = await response.json()
      setSummary(data)
    } catch (error) {
      console.error("Error fetching summary:", error)
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "Improving":
        return <TrendingUp className="h-5 w-5 text-green-500" />
      case "Declining":
        return <TrendingDown className="h-5 w-5 text-red-500" />
      case "Stable":
        return <Minus className="h-5 w-5 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Reviews</h1>
        <p className="text-muted-foreground">View your performance reviews and progress</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.totalReviews}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold">{summary.averageOverallRating.toFixed(1)}</div>
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Latest Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold">{summary.latestOverallRating.toFixed(1)}</div>
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Performance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getTrendIcon(summary.performanceTrend)}
                <span className="text-lg font-semibold">{summary.performanceTrend}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Review History</CardTitle>
          <CardDescription>Your performance reviews over time</CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No performance reviews yet
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setSelectedReview(review)}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{review.period} Review</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(review.periodStartDate).toLocaleDateString()} - {new Date(review.periodEndDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(review.status)}
                        {review.overallRating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            <span className="text-xl font-bold">{review.overallRating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {review.status === "Published" && review.overallRating && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Quality of Work</p>
                          {renderStars(review.qualityOfWorkRating)}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Productivity</p>
                          {renderStars(review.productivityRating)}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Communication</p>
                          {renderStars(review.communicationRating)}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Teamwork</p>
                          {renderStars(review.teamworkRating)}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Initiative</p>
                          {renderStars(review.initiativeRating)}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Attendance</p>
                          {renderStars(review.attendanceRating)}
                        </div>
                      </div>
                    )}

                    {review.strengths && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium mb-1">Strengths:</p>
                        <p className="text-sm text-muted-foreground">{review.strengths}</p>
                      </div>
                    )}

                    {review.areasForImprovement && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1">Areas for Improvement:</p>
                        <p className="text-sm text-muted-foreground">{review.areasForImprovement}</p>
                      </div>
                    )}

                    {review.goals && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1">Goals:</p>
                        <p className="text-sm text-muted-foreground">{review.goals}</p>
                      </div>
                    )}

                    {review.managerComments && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1">Manager Comments:</p>
                        <p className="text-sm text-muted-foreground">{review.managerComments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
