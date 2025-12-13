using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRService.Models
{
    public enum LeaveRequestStatus
    {
        Pending,
        Approved,
        Rejected,
        Cancelled
    }

    public class LeaveRequest
    {
        public int Id { get; set; }

        [Required]
        public int EmployeeId { get; set; }

        [Required]
        public int LeaveTypeId { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        public int NumberOfDays { get; set; }

        [Required]
        [MaxLength(500)]
        public string Reason { get; set; } = string.Empty;

        [Required]
        public LeaveRequestStatus Status { get; set; } = LeaveRequestStatus.Pending;

        public int? ApprovedBy { get; set; }

        public DateTime? ApprovedDate { get; set; }

        public string? ApprovalNotes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public Employee? Employee { get; set; }
        public LeaveType? LeaveType { get; set; }
    }
}
