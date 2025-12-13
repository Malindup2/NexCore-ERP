namespace HRService.DTOs
{
    public class CheckInRequest
    {
        public int EmployeeId { get; set; }
        public string? Location { get; set; }
        public string? Notes { get; set; }
    }

    public class CheckOutRequest
    {
        public int AttendanceId { get; set; }
        public string? Notes { get; set; }
    }

    public class AttendanceDto
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public DateTime Date { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }
        public double? WorkingHours { get; set; }
        public double? OvertimeHours { get; set; }
        public string? Notes { get; set; }
        public string? Location { get; set; }
    }

    public class AttendanceReportRequest
    {
        public int? EmployeeId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }

    public class AttendanceReportDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public int TotalDays { get; set; }
        public int PresentDays { get; set; }
        public int AbsentDays { get; set; }
        public int HalfDays { get; set; }
        public int LateDays { get; set; }
        public int LeaveDays { get; set; }
        public double TotalWorkingHours { get; set; }
        public double TotalOvertimeHours { get; set; }
        public decimal AttendancePercentage { get; set; }
    }

    public class ManualAttendanceRequest
    {
        public int EmployeeId { get; set; }
        public DateTime Date { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }
        public string? Notes { get; set; }
    }
}
