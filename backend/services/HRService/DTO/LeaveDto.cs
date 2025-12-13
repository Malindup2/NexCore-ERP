namespace HRService.DTOs
{
    public class LeaveTypeDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DefaultDaysPerYear { get; set; }
        public bool IsPaid { get; set; }
        public bool RequiresApproval { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateLeaveTypeRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DefaultDaysPerYear { get; set; }
        public bool IsPaid { get; set; } = true;
        public bool RequiresApproval { get; set; } = true;
    }

    public class LeaveRequestDto
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public int LeaveTypeId { get; set; }
        public string? LeaveTypeName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int NumberOfDays { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int? ApprovedBy { get; set; }
        public DateTime? ApprovedDate { get; set; }
        public string? ApprovalNotes { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateLeaveRequestDto
    {
        public int EmployeeId { get; set; }
        public int LeaveTypeId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    public class ApproveLeaveRequestDto
    {
        public int LeaveRequestId { get; set; }
        public int ApprovedBy { get; set; }
        public string? ApprovalNotes { get; set; }
    }

    public class RejectLeaveRequestDto
    {
        public int LeaveRequestId { get; set; }
        public int RejectedBy { get; set; }
        public string? RejectionNotes { get; set; }
    }

    public class LeaveBalanceDto
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public int LeaveTypeId { get; set; }
        public string? LeaveTypeName { get; set; }
        public int Year { get; set; }
        public int TotalDays { get; set; }
        public int UsedDays { get; set; }
        public int RemainingDays { get; set; }
    }
}
