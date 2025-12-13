using HRService.Data;
using HRService.DTOs;
using HRService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HRService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AttendanceController : ControllerBase
    {
        private readonly HrDbContext _context;
        private readonly ILogger<AttendanceController> _logger;

        public AttendanceController(HrDbContext context, ILogger<AttendanceController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // POST: api/Attendance/check-in
        [HttpPost("check-in")]
        public async Task<IActionResult> CheckIn([FromBody] CheckInRequest request)
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                
                // Check if already checked in today
                var existingAttendance = await _context.Attendances
                    .FirstOrDefaultAsync(a => a.EmployeeId == request.EmployeeId && a.Date.Date == today);

                if (existingAttendance != null)
                {
                    return BadRequest(new { message = "Already checked in today" });
                }

                var attendance = new Attendance
                {
                    EmployeeId = request.EmployeeId,
                    Date = today,
                    CheckInTime = DateTime.UtcNow,
                    Status = AttendanceStatus.Present,
                    Location = request.Location,
                    Notes = request.Notes,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Attendances.Add(attendance);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Checked in successfully", attendanceId = attendance.Id, checkInTime = attendance.CheckInTime });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during check-in");
                return StatusCode(500, new { message = "Error during check-in" });
            }
        }

        // POST: api/Attendance/check-out
        [HttpPost("check-out")]
        public async Task<IActionResult> CheckOut([FromBody] CheckOutRequest request)
        {
            try
            {
                var attendance = await _context.Attendances.FindAsync(request.AttendanceId);

                if (attendance == null)
                {
                    return NotFound(new { message = "Attendance record not found" });
                }

                if (attendance.CheckOutTime != null)
                {
                    return BadRequest(new { message = "Already checked out" });
                }

                attendance.CheckOutTime = DateTime.UtcNow;
                attendance.UpdatedAt = DateTime.UtcNow;
                
                if (!string.IsNullOrEmpty(request.Notes))
                {
                    attendance.Notes = attendance.Notes + " | " + request.Notes;
                }

                // Calculate working hours
                if (attendance.CheckInTime.HasValue)
                {
                    var workingHours = (attendance.CheckOutTime.Value - attendance.CheckInTime.Value).TotalHours;
                    attendance.WorkingHours = Math.Round(workingHours, 2);

                    // Calculate overtime (assuming 8 hours is standard)
                    if (workingHours > 8)
                    {
                        attendance.OvertimeHours = Math.Round(workingHours - 8, 2);
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new { 
                    message = "Checked out successfully", 
                    checkOutTime = attendance.CheckOutTime,
                    workingHours = attendance.WorkingHours,
                    overtimeHours = attendance.OvertimeHours
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during check-out");
                return StatusCode(500, new { message = "Error during check-out" });
            }
        }

        // GET: api/Attendance/employee/{employeeId}
        [HttpGet("employee/{employeeId}")]
        public async Task<IActionResult> GetEmployeeAttendance(int employeeId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var query = _context.Attendances
                    .Include(a => a.Employee)
                    .Where(a => a.EmployeeId == employeeId);

                if (startDate.HasValue)
                {
                    query = query.Where(a => a.Date >= startDate.Value.Date);
                }

                if (endDate.HasValue)
                {
                    query = query.Where(a => a.Date <= endDate.Value.Date);
                }

                var attendances = await query
                    .OrderByDescending(a => a.Date)
                    .Select(a => new AttendanceDto
                    {
                        Id = a.Id,
                        EmployeeId = a.EmployeeId,
                        EmployeeName = $"{a.Employee!.FirstName} {a.Employee.LastName}",
                        Date = a.Date,
                        Status = a.Status.ToString(),
                        CheckInTime = a.CheckInTime,
                        CheckOutTime = a.CheckOutTime,
                        WorkingHours = a.WorkingHours,
                        OvertimeHours = a.OvertimeHours,
                        Notes = a.Notes,
                        Location = a.Location
                    })
                    .ToListAsync();

                return Ok(attendances);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching attendance");
                return StatusCode(500, new { message = "Error fetching attendance" });
            }
        }

        // GET: api/Attendance/today/{employeeId}
        [HttpGet("today/{employeeId}")]
        public async Task<IActionResult> GetTodayAttendance(int employeeId)
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                var attendance = await _context.Attendances
                    .FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.Date.Date == today);

                if (attendance == null)
                {
                    return Ok(new { checkedIn = false });
                }

                return Ok(new
                {
                    checkedIn = true,
                    attendanceId = attendance.Id,
                    checkInTime = attendance.CheckInTime,
                    checkOutTime = attendance.CheckOutTime,
                    workingHours = attendance.WorkingHours,
                    status = attendance.Status.ToString()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching today's attendance");
                return StatusCode(500, new { message = "Error fetching attendance" });
            }
        }

        // POST: api/Attendance/manual
        [HttpPost("manual")]
        public async Task<IActionResult> CreateManualAttendance([FromBody] ManualAttendanceRequest request)
        {
            try
            {
                var existingAttendance = await _context.Attendances
                    .FirstOrDefaultAsync(a => a.EmployeeId == request.EmployeeId && a.Date.Date == request.Date.Date);

                if (existingAttendance != null)
                {
                    return BadRequest(new { message = "Attendance already exists for this date" });
                }

                var attendance = new Attendance
                {
                    EmployeeId = request.EmployeeId,
                    Date = request.Date.ToUniversalTime(),
                    Status = Enum.Parse<AttendanceStatus>(request.Status),
                    CheckInTime = request.CheckInTime?.ToUniversalTime(),
                    CheckOutTime = request.CheckOutTime?.ToUniversalTime(),
                    Notes = request.Notes,
                    CreatedAt = DateTime.UtcNow
                };

                // Calculate working hours if both times provided
                if (attendance.CheckInTime.HasValue && attendance.CheckOutTime.HasValue)
                {
                    var workingHours = (attendance.CheckOutTime.Value - attendance.CheckInTime.Value).TotalHours;
                    attendance.WorkingHours = Math.Round(workingHours, 2);

                    if (workingHours > 8)
                    {
                        attendance.OvertimeHours = Math.Round(workingHours - 8, 2);
                    }
                }

                _context.Attendances.Add(attendance);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Manual attendance created successfully", attendanceId = attendance.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating manual attendance");
                return StatusCode(500, new { message = "Error creating attendance" });
            }
        }

        // POST: api/Attendance/report
        [HttpPost("report")]
        public async Task<IActionResult> GetAttendanceReport([FromBody] AttendanceReportRequest request)
        {
            try
            {
                var query = _context.Attendances
                    .Include(a => a.Employee)
                    .Where(a => a.Date >= request.StartDate.Date && a.Date <= request.EndDate.Date);

                if (request.EmployeeId.HasValue)
                {
                    query = query.Where(a => a.EmployeeId == request.EmployeeId.Value);
                }

                var attendances = await query.ToListAsync();

                var report = attendances
                    .Where(a => a.Employee != null)
                    .GroupBy(a => a.EmployeeId)
                    .Select(g => new AttendanceReportDto
                    {
                        EmployeeId = g.Key,
                        EmployeeName = $"{g.First().Employee.FirstName} {g.First().Employee.LastName}",
                        TotalDays = g.Count(),
                        PresentDays = g.Count(a => a.Status == AttendanceStatus.Present),
                        AbsentDays = g.Count(a => a.Status == AttendanceStatus.Absent),
                        HalfDays = g.Count(a => a.Status == AttendanceStatus.HalfDay),
                        LateDays = g.Count(a => a.Status == AttendanceStatus.Late),
                        LeaveDays = g.Count(a => a.Status == AttendanceStatus.OnLeave),
                        TotalWorkingHours = g.Sum(a => a.WorkingHours ?? 0),
                        TotalOvertimeHours = g.Sum(a => a.OvertimeHours ?? 0),
                        AttendancePercentage = g.Count() > 0 
                            ? Math.Round((decimal)g.Count(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late) / g.Count() * 100, 2)
                            : 0
                    })
                    .ToList();

                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating attendance report");
                return StatusCode(500, new { message = "Error generating report" });
            }
        }

        // GET: api/Attendance
        [HttpGet]
        public async Task<IActionResult> GetAllAttendance([FromQuery] DateTime? date)
        {
            try
            {
                var targetDate = date?.Date ?? DateTime.UtcNow.Date;

                var attendances = await _context.Attendances
                    .Include(a => a.Employee)
                    .Where(a => a.Date.Date == targetDate)
                    .Select(a => new AttendanceDto
                    {
                        Id = a.Id,
                        EmployeeId = a.EmployeeId,
                        EmployeeName = $"{a.Employee!.FirstName} {a.Employee.LastName}",
                        Date = a.Date,
                        Status = a.Status.ToString(),
                        CheckInTime = a.CheckInTime,
                        CheckOutTime = a.CheckOutTime,
                        WorkingHours = a.WorkingHours,
                        OvertimeHours = a.OvertimeHours,
                        Notes = a.Notes,
                        Location = a.Location
                    })
                    .OrderBy(a => a.EmployeeName)
                    .ToListAsync();

                return Ok(attendances);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching attendances");
                return StatusCode(500, new { message = "Error fetching attendances" });
            }
        }
    }
}
