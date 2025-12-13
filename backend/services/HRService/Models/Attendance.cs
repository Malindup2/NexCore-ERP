using System.ComponentModel.DataAnnotations;

namespace HRService.Models
{
    public enum AttendanceStatus
    {
        Present,
        Absent,
        HalfDay,
        Late,
        OnLeave,
        Holiday
    }

    public class Attendance
    {
        public int Id { get; set; }

        [Required]
        public int EmployeeId { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [Required]
        public AttendanceStatus Status { get; set; }

        public DateTime? CheckInTime { get; set; }

        public DateTime? CheckOutTime { get; set; }

        // Working hours calculated
        public double? WorkingHours { get; set; }

        // Overtime hours
        public double? OvertimeHours { get; set; }

        public string? Notes { get; set; }

        public string? Location { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation property
        public Employee? Employee { get; set; }
    }
}
