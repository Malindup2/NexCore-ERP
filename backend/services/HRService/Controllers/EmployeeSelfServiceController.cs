using HRService.Data;
using HRService.Models;
using HRService.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HRService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeeSelfServiceController : ControllerBase
    {
        private readonly HrDbContext _context;
        private readonly ILogger<EmployeeSelfServiceController> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public EmployeeSelfServiceController(
            HrDbContext context, 
            ILogger<EmployeeSelfServiceController> logger,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        // GET: api/EmployeeSelfService/profile/{userId}
        [HttpGet("profile/{userId}")]
        public async Task<IActionResult> GetEmployeeProfile(int userId)
        {
            try
            {
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.UserId == userId && e.IsActive);

                if (employee == null)
                {
                    return NotFound(new { message = "Employee profile not found" });
                }

                return Ok(new
                {
                    id = employee.Id,
                    firstName = employee.FirstName,
                    lastName = employee.LastName,
                    email = employee.Email,
                    phone = employee.Phone,
                    department = employee.Department,
                    designation = employee.Designation,
                    joiningDate = employee.JoiningDate
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching employee profile");
                return StatusCode(500, new { message = "Error fetching profile" });
            }
        }

        // GET: api/EmployeeSelfService/attendance/{userId}
        [HttpGet("attendance/{userId}")]
        public async Task<IActionResult> GetMyAttendance(int userId)
        {
            try
            {
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.UserId == userId && e.IsActive);

                if (employee == null)
                {
                    return NotFound(new { message = "Employee not found" });
                }

                var currentMonth = DateTime.UtcNow.Month;
                var currentYear = DateTime.UtcNow.Year;

                var attendanceRecords = await _context.Attendances
                    .Where(a => a.EmployeeId == employee.Id 
                        && a.Date.Month == currentMonth 
                        && a.Date.Year == currentYear)
                    .OrderByDescending(a => a.Date)
                    .Select(a => new
                    {
                        id = a.Id,
                        date = a.Date,
                        checkInTime = a.CheckInTime,
                        checkOutTime = a.CheckOutTime,
                        workingHours = a.WorkingHours,
                        overtimeHours = a.OvertimeHours,
                        status = a.Status.ToString(),
                        location = a.Location
                    })
                    .ToListAsync();

                var totalPresent = attendanceRecords.Count(a => a.status == "Present");
                var totalWorkingHours = attendanceRecords.Sum(a => a.workingHours ?? 0);
                var totalOvertimeHours = attendanceRecords.Sum(a => a.overtimeHours ?? 0);

                return Ok(new
                {
                    records = attendanceRecords,
                    summary = new
                    {
                        totalPresent,
                        totalWorkingHours = Math.Round(totalWorkingHours, 2),
                        totalOvertimeHours = Math.Round(totalOvertimeHours, 2),
                        attendancePercentage = totalPresent > 0 ? Math.Round((double)totalPresent / DateTime.DaysInMonth(currentYear, currentMonth) * 100, 2) : 0
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching attendance");
                return StatusCode(500, new { message = "Error fetching attendance" });
            }
        }

        // GET: api/EmployeeSelfService/leaves/{userId}
        [HttpGet("leaves/{userId}")]
        public async Task<IActionResult> GetMyLeaves(int userId)
        {
            try
            {
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.UserId == userId && e.IsActive);

                if (employee == null)
                {
                    return NotFound(new { message = "Employee not found" });
                }

                var leaveRequests = await _context.LeaveRequests
                    .Include(lr => lr.LeaveType)
                    .Where(lr => lr.EmployeeId == employee.Id)
                    .OrderByDescending(lr => lr.CreatedAt)
                    .Select(lr => new
                    {
                        id = lr.Id,
                        leaveType = lr.LeaveType.Name,
                        startDate = lr.StartDate,
                        endDate = lr.EndDate,
                        numberOfDays = lr.NumberOfDays,
                        reason = lr.Reason,
                        status = lr.Status.ToString(),
                        approvedBy = lr.ApprovedBy,
                        approvedDate = lr.ApprovedDate,
                        approvalNotes = lr.ApprovalNotes
                    })
                    .ToListAsync();

                // Get leave balance
                var currentYear = DateTime.UtcNow.Year;
                var usedLeaves = await _context.LeaveRequests
                    .Where(lr => lr.EmployeeId == employee.Id 
                        && lr.StartDate.Year == currentYear
                        && (lr.Status == LeaveRequestStatus.Approved || lr.Status == LeaveRequestStatus.Pending))
                    .SumAsync(lr => lr.NumberOfDays);

                var totalLeaveEntitlement = 20; // Default 20 days per year
                var remainingLeaves = totalLeaveEntitlement - usedLeaves;

                return Ok(new
                {
                    requests = leaveRequests,
                    balance = new
                    {
                        total = totalLeaveEntitlement,
                        used = usedLeaves,
                        remaining = remainingLeaves
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching leaves");
                return StatusCode(500, new { message = "Error fetching leaves" });
            }
        }

        // GET: api/EmployeeSelfService/leave-types
        [HttpGet("leave-types")]
        public async Task<IActionResult> GetLeaveTypes()
        {
            try
            {
                var leaveTypes = await _context.LeaveTypes
                    .Where(lt => lt.IsActive)
                    .Select(lt => new
                    {
                        id = lt.Id,
                        name = lt.Name,
                        description = lt.Description,
                        defaultDaysPerYear = lt.DefaultDaysPerYear,
                        isPaid = lt.IsPaid
                    })
                    .ToListAsync();

                return Ok(leaveTypes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching leave types");
                return StatusCode(500, new { message = "Error fetching leave types" });
            }
        }

        // POST: api/EmployeeSelfService/leaves/{userId}
        [HttpPost("leaves/{userId}")]
        public async Task<IActionResult> CreateLeaveRequest(int userId, [FromBody] CreateLeaveRequestDto request)
        {
            try
            {
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.UserId == userId && e.IsActive);

                if (employee == null)
                {
                    return NotFound(new { message = "Employee not found" });
                }

                // Calculate number of days
                var numberOfDays = (request.EndDate.Date - request.StartDate.Date).Days + 1;

                var leaveRequest = new LeaveRequest
                {
                    EmployeeId = employee.Id,
                    LeaveTypeId = request.LeaveTypeId,
                    StartDate = request.StartDate.ToUniversalTime(),
                    EndDate = request.EndDate.ToUniversalTime(),
                    NumberOfDays = numberOfDays,
                    Reason = request.Reason,
                    Status = LeaveRequestStatus.Pending,
                    CreatedAt = DateTime.UtcNow
                };

                _context.LeaveRequests.Add(leaveRequest);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Leave request submitted successfully", leaveRequestId = leaveRequest.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating leave request");
                return StatusCode(500, new { message = "Error creating leave request" });
            }
        }


        // GET: api/EmployeeSelfService/reviews/{userId}
        [HttpGet("reviews/{userId}")]
        public async Task<IActionResult> GetMyReviews(int userId)
        {
            try
            {
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.UserId == userId && e.IsActive);

                if (employee == null)
                {
                    return NotFound(new { message = "Employee not found" });
                }

                var reviews = await _context.PerformanceReviews
                    .Where(pr => pr.EmployeeId == employee.Id)
                    .OrderByDescending(pr => pr.ReviewDate)
                    .Select(pr => new
                    {
                        id = pr.Id,
                        reviewDate = pr.ReviewDate,
                        periodStartDate = pr.PeriodStartDate,
                        periodEndDate = pr.PeriodEndDate,
                        overallRating = pr.OverallRating,
                        strengths = pr.Strengths,
                        areasForImprovement = pr.AreasForImprovement,
                        goals = pr.Goals,
                        reviewerId = pr.ReviewerId,
                        status = pr.Status.ToString()
                    })
                    .ToListAsync();

                var latestReview = reviews.FirstOrDefault();
                var averageRating = reviews.Any() && reviews.Any(r => r.overallRating.HasValue) 
                    ? Math.Round(reviews.Where(r => r.overallRating.HasValue).Average(r => r.overallRating.Value), 2) 
                    : 0;

                return Ok(new
                {
                    reviews = reviews,
                    summary = new
                    {
                        totalReviews = reviews.Count,
                        averageRating = averageRating,
                        latestRating = latestReview?.overallRating ?? 0,
                        latestReviewDate = latestReview?.reviewDate
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching reviews");
                return StatusCode(500, new { message = "Error fetching reviews" });
            }
        }

        // GET: api/EmployeeSelfService/dashboard/{userId}
        [HttpGet("dashboard/{userId}")]
        public async Task<IActionResult> GetEmployeeDashboard(int userId)
        {
            try
            {
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.UserId == userId && e.IsActive);

                if (employee == null)
                {
                    return NotFound(new { message = "Employee not found" });
                }

                var currentMonth = DateTime.UtcNow.Month;
                var currentYear = DateTime.UtcNow.Year;

                // Attendance summary
                var attendanceCount = await _context.Attendances
                    .CountAsync(a => a.EmployeeId == employee.Id 
                        && a.Date.Month == currentMonth 
                        && a.Date.Year == currentYear
                        && a.Status == AttendanceStatus.Present);

                var attendancePercentage = Math.Round((double)attendanceCount / DateTime.DaysInMonth(currentYear, currentMonth) * 100, 2);

                // Leave balance
                var usedLeaves = await _context.LeaveRequests
                    .Where(lr => lr.EmployeeId == employee.Id 
                        && lr.StartDate.Year == currentYear
                        && (lr.Status == LeaveRequestStatus.Approved || lr.Status == LeaveRequestStatus.Pending))
                    .SumAsync(lr => lr.NumberOfDays);

                var remainingLeaves = 20 - usedLeaves; // 20 days default

                // Latest review
                var latestReview = await _context.PerformanceReviews
                    .Where(pr => pr.EmployeeId == employee.Id)
                    .OrderByDescending(pr => pr.ReviewDate)
                    .Select(pr => new
                    {
                        rating = pr.OverallRating,
                        date = pr.ReviewDate
                    })
                    .FirstOrDefaultAsync();

                // Check if checked in today
                var today = DateTime.UtcNow.Date;
                var todayAttendance = await _context.Attendances
                    .FirstOrDefaultAsync(a => a.EmployeeId == employee.Id && a.Date.Date == today);

                return Ok(new
                {
                    profile = new
                    {
                        firstName = employee.FirstName,
                        lastName = employee.LastName,
                        department = employee.Department,
                        designation = employee.Designation
                    },
                    attendance = new
                    {
                        percentage = attendancePercentage,
                        daysPresent = attendanceCount,
                        checkedInToday = todayAttendance != null,
                        checkInTime = todayAttendance?.CheckInTime,
                        checkOutTime = todayAttendance?.CheckOutTime,
                        attendanceId = todayAttendance?.Id
                    },
                    leaves = new
                    {
                        remaining = remainingLeaves,
                        used = usedLeaves,
                        total = 20
                    },
                    performance = new
                    {
                        latestRating = latestReview?.rating ?? 0,
                        latestReviewDate = latestReview?.date,
                        status = latestReview != null ? "Reviewed" : "Pending"
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching dashboard");
                return StatusCode(500, new { message = "Error fetching dashboard data" });
            }
        }

        // GET: api/EmployeeSelfService/payroll/{userId}
        [HttpGet("payroll/{userId}")]
        public async Task<IActionResult> GetMyPayroll(int userId)
        {
            try
            {
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.UserId == userId && e.IsActive);

                if (employee == null)
                {
                    return NotFound(new { message = "Employee not found" });
                }

                // Call PayrollService to get payroll history
                var payrollServiceUrl = _configuration["PayrollService:Url"] ?? "http://localhost:5004";
                var httpClient = _httpClientFactory.CreateClient();
                
                var response = await httpClient.GetAsync($"{payrollServiceUrl}/api/Payroll/employee/{employee.Id}/history");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning($"Failed to fetch payroll from PayrollService: {response.StatusCode}");
                    return StatusCode((int)response.StatusCode, new { message = "Error fetching payroll data from PayrollService" });
                }

                var payrollData = await response.Content.ReadFromJsonAsync<PayrollHistoryResponse>();

                return Ok(payrollData);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Error calling PayrollService");
                return StatusCode(503, new { message = "PayrollService is unavailable" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching payroll");
                return StatusCode(500, new { message = "Error fetching payroll data" });
            }
        }
    }

    // DTOs for PayrollService response
    public class PayrollHistoryResponse
    {
        public List<PayrollRecordDto> Records { get; set; } = new();
        public PayrollSummaryDto? Summary { get; set; }
    }

    public class PayrollRecordDto
    {
        public string Id { get; set; } = string.Empty;
        public int EmployeeId { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public string MonthYear { get; set; } = string.Empty;
        public decimal BaseSalary { get; set; }
        public decimal Allowances { get; set; }
        public decimal Overtime { get; set; }
        public decimal Bonus { get; set; }
        public decimal Deductions { get; set; }
        public decimal Tax { get; set; }
        public decimal NetSalary { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? PaidDate { get; set; }
        public string Notes { get; set; } = string.Empty;
    }

    public class PayrollSummaryDto
    {
        public int TotalRecords { get; set; }
        public decimal YearToDateTotal { get; set; }
        public PayrollRecordDto? LatestPayment { get; set; }
    }
}
