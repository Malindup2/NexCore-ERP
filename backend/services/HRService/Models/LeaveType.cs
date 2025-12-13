using System.ComponentModel.DataAnnotations;

namespace HRService.Models
{
    public class LeaveType
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        public int DefaultDaysPerYear { get; set; }

        public bool IsPaid { get; set; } = true;

        public bool RequiresApproval { get; set; } = true;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();
    }
}
