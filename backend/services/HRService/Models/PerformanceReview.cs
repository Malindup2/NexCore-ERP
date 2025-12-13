using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRService.Models
{
    public enum ReviewPeriod
    {
        Quarterly,
        HalfYearly,
        Annual
    }

    public enum ReviewStatus
    {
        Draft,
        InProgress,
        Completed,
        Published
    }

    public class PerformanceReview
    {
        public int Id { get; set; }

        [Required]
        public int EmployeeId { get; set; }

        [Required]
        public int ReviewerId { get; set; }

        [Required]
        public ReviewPeriod Period { get; set; }

        [Required]
        public DateTime ReviewDate { get; set; }

        [Required]
        public DateTime PeriodStartDate { get; set; }

        [Required]
        public DateTime PeriodEndDate { get; set; }

        [Required]
        public ReviewStatus Status { get; set; } = ReviewStatus.Draft;

        // Ratings (1-5 scale)
        [Range(1, 5)]
        public int? QualityOfWorkRating { get; set; }

        [Range(1, 5)]
        public int? ProductivityRating { get; set; }

        [Range(1, 5)]
        public int? CommunicationRating { get; set; }

        [Range(1, 5)]
        public int? TeamworkRating { get; set; }

        [Range(1, 5)]
        public int? InitiativeRating { get; set; }

        [Range(1, 5)]
        public int? AttendanceRating { get; set; }

        [Column(TypeName = "decimal(3,2)")]
        public decimal? OverallRating { get; set; }

        public string? Strengths { get; set; }

        public string? AreasForImprovement { get; set; }

        public string? Goals { get; set; }

        public string? ManagerComments { get; set; }

        public string? EmployeeComments { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public Employee? Employee { get; set; }
    }
}
