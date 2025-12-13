using System.ComponentModel.DataAnnotations;

namespace HRService.Models
{
    public class LeaveBalance
    {
        public int Id { get; set; }

        [Required]
        public int EmployeeId { get; set; }

        [Required]
        public int LeaveTypeId { get; set; }

        [Required]
        public int Year { get; set; }

        [Required]
        public int TotalDays { get; set; }

        [Required]
        public int UsedDays { get; set; }

        public int RemainingDays => TotalDays - UsedDays;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public Employee? Employee { get; set; }
        public LeaveType? LeaveType { get; set; }
    }
}
