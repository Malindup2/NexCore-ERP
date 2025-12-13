namespace HRService.DTOs
{
    public class PerformanceReviewDto
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public int ReviewerId { get; set; }
        public string? ReviewerName { get; set; }
        public string Period { get; set; } = string.Empty;
        public DateTime ReviewDate { get; set; }
        public DateTime PeriodStartDate { get; set; }
        public DateTime PeriodEndDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? QualityOfWorkRating { get; set; }
        public int? ProductivityRating { get; set; }
        public int? CommunicationRating { get; set; }
        public int? TeamworkRating { get; set; }
        public int? InitiativeRating { get; set; }
        public int? AttendanceRating { get; set; }
        public decimal? OverallRating { get; set; }
        public string? Strengths { get; set; }
        public string? AreasForImprovement { get; set; }
        public string? Goals { get; set; }
        public string? ManagerComments { get; set; }
        public string? EmployeeComments { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreatePerformanceReviewDto
    {
        public int EmployeeId { get; set; }
        public int ReviewerId { get; set; }
        public string Period { get; set; } = string.Empty;
        public DateTime ReviewDate { get; set; }
        public DateTime PeriodStartDate { get; set; }
        public DateTime PeriodEndDate { get; set; }
    }

    public class UpdatePerformanceReviewDto
    {
        public int Id { get; set; }
        public int? QualityOfWorkRating { get; set; }
        public int? ProductivityRating { get; set; }
        public int? CommunicationRating { get; set; }
        public int? TeamworkRating { get; set; }
        public int? InitiativeRating { get; set; }
        public int? AttendanceRating { get; set; }
        public string? Strengths { get; set; }
        public string? AreasForImprovement { get; set; }
        public string? Goals { get; set; }
        public string? ManagerComments { get; set; }
        public string? EmployeeComments { get; set; }
    }

    public class PublishReviewDto
    {
        public int ReviewId { get; set; }
    }

    public class EmployeePerformanceSummaryDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public int TotalReviews { get; set; }
        public decimal AverageOverallRating { get; set; }
        public decimal LatestOverallRating { get; set; }
        public DateTime? LatestReviewDate { get; set; }
        public string PerformanceTrend { get; set; } = string.Empty;
    }
}
