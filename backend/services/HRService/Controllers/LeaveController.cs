using HRService.Data;
using HRService.DTOs;
using HRService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HRService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LeaveController : ControllerBase
    {
        private readonly HrDbContext _context;
        private readonly ILogger<LeaveController> _logger;

        public LeaveController(HrDbContext context, ILogger<LeaveController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Leave/types
        [HttpGet("types")]
        public async Task<IActionResult> GetLeaveTypes()
        {
            try
            {
                var leaveTypes = await _context.LeaveTypes
                    .Where(lt => lt.IsActive)
                    .Select(lt => new LeaveTypeDto
                    {
                        Id = lt.Id,
                        Name = lt.Name,
                        Description = lt.Description,
                        DefaultDaysPerYear = lt.DefaultDaysPerYear,
                        IsPaid = lt.IsPaid,
                        RequiresApproval = lt.RequiresApproval,
                        IsActive = lt.IsActive
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

        // POST: api/Leave/types
        [HttpPost("types")]
        public async Task<IActionResult> CreateLeaveType([FromBody] CreateLeaveTypeRequest request)
        {
            try
            {
                var leaveType = new LeaveType
                {
                    Name = request.Name,
                    Description = request.Description,
                    DefaultDaysPerYear = request.DefaultDaysPerYear,
                    IsPaid = request.IsPaid,
                    RequiresApproval = request.RequiresApproval,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.LeaveTypes.Add(leaveType);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Leave type created successfully", leaveTypeId = leaveType.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating leave type");
                return StatusCode(500, new { message = "Error creating leave type" });
            }
        }

        // POST: api/Leave/request
        [HttpPost("request")]
        public async Task<IActionResult> CreateLeaveRequest([FromBody] CreateLeaveRequestDto request)
        {
            try
            {
                // Calculate number of days
                var numberOfDays = (request.EndDate.Date - request.StartDate.Date).Days + 1;

                var leaveRequest = new LeaveRequest
                {
                    EmployeeId = request.EmployeeId,
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

        // GET: api/Leave/requests/employee/{employeeId}
        [HttpGet("requests/employee/{employeeId}")]
        public async Task<IActionResult> GetEmployeeLeaveRequests(int employeeId)
        {
            try
            {
                var leaveRequests = await _context.LeaveRequests
                    .Include(lr => lr.Employee)
                    .Include(lr => lr.LeaveType)
                    .Where(lr => lr.EmployeeId == employeeId)
                    .OrderByDescending(lr => lr.CreatedAt)
                    .Select(lr => new LeaveRequestDto
                    {
                        Id = lr.Id,
                        EmployeeId = lr.EmployeeId,
                        EmployeeName = $"{lr.Employee!.FirstName} {lr.Employee.LastName}",
                        LeaveTypeId = lr.LeaveTypeId,
                        LeaveTypeName = lr.LeaveType!.Name,
                        StartDate = lr.StartDate,
                        EndDate = lr.EndDate,
                        NumberOfDays = lr.NumberOfDays,
                        Reason = lr.Reason,
                        Status = lr.Status.ToString(),
                        ApprovedBy = lr.ApprovedBy,
                        ApprovedDate = lr.ApprovedDate,
                        ApprovalNotes = lr.ApprovalNotes,
                        CreatedAt = lr.CreatedAt
                    })
                    .ToListAsync();

                return Ok(leaveRequests);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching leave requests");
                return StatusCode(500, new { message = "Error fetching leave requests" });
            }
        }

        // GET: api/Leave/requests/pending
        [HttpGet("requests/pending")]
        public async Task<IActionResult> GetPendingLeaveRequests()
        {
            try
            {
                var leaveRequests = await _context.LeaveRequests
                    .Include(lr => lr.Employee)
                    .Include(lr => lr.LeaveType)
                    .Where(lr => lr.Status == LeaveRequestStatus.Pending)
                    .OrderBy(lr => lr.CreatedAt)
                    .Select(lr => new LeaveRequestDto
                    {
                        Id = lr.Id,
                        EmployeeId = lr.EmployeeId,
                        EmployeeName = $"{lr.Employee!.FirstName} {lr.Employee.LastName}",
                        LeaveTypeId = lr.LeaveTypeId,
                        LeaveTypeName = lr.LeaveType!.Name,
                        StartDate = lr.StartDate,
                        EndDate = lr.EndDate,
                        NumberOfDays = lr.NumberOfDays,
                        Reason = lr.Reason,
                        Status = lr.Status.ToString(),
                        CreatedAt = lr.CreatedAt
                    })
                    .ToListAsync();

                return Ok(leaveRequests);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching pending leave requests");
                return StatusCode(500, new { message = "Error fetching requests" });
            }
        }

        // POST: api/Leave/requests/{id}/approve
        [HttpPost("requests/{id}/approve")]
        public async Task<IActionResult> ApproveLeaveRequest(int id, [FromBody] ApproveLeaveRequestDto request)
        {
            try
            {
                var leaveRequest = await _context.LeaveRequests.FindAsync(id);

                if (leaveRequest == null)
                {
                    return NotFound(new { message = "Leave request not found" });
                }

                if (leaveRequest.Status != LeaveRequestStatus.Pending)
                {
                    return BadRequest(new { message = "Leave request is not pending" });
                }

                leaveRequest.Status = LeaveRequestStatus.Approved;
                leaveRequest.ApprovedBy = request.ApprovedBy;
                leaveRequest.ApprovedDate = DateTime.UtcNow;
                leaveRequest.ApprovalNotes = request.ApprovalNotes;
                leaveRequest.UpdatedAt = DateTime.UtcNow;

                // Update leave balance
                var currentYear = DateTime.UtcNow.Year;
                var leaveBalance = await _context.LeaveBalances
                    .FirstOrDefaultAsync(lb => lb.EmployeeId == leaveRequest.EmployeeId 
                                            && lb.LeaveTypeId == leaveRequest.LeaveTypeId 
                                            && lb.Year == currentYear);

                if (leaveBalance != null)
                {
                    leaveBalance.UsedDays += leaveRequest.NumberOfDays;
                    leaveBalance.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    // Create leave balance if it doesn't exist
                    var leaveType = await _context.LeaveTypes.FindAsync(leaveRequest.LeaveTypeId);
                    leaveBalance = new LeaveBalance
                    {
                        EmployeeId = leaveRequest.EmployeeId,
                        LeaveTypeId = leaveRequest.LeaveTypeId,
                        Year = currentYear,
                        TotalDays = leaveType!.DefaultDaysPerYear,
                        UsedDays = leaveRequest.NumberOfDays,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.LeaveBalances.Add(leaveBalance);
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Leave request approved successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving leave request");
                return StatusCode(500, new { message = "Error approving request" });
            }
        }

        // POST: api/Leave/requests/{id}/reject
        [HttpPost("requests/{id}/reject")]
        public async Task<IActionResult> RejectLeaveRequest(int id, [FromBody] RejectLeaveRequestDto request)
        {
            try
            {
                var leaveRequest = await _context.LeaveRequests.FindAsync(id);

                if (leaveRequest == null)
                {
                    return NotFound(new { message = "Leave request not found" });
                }

                if (leaveRequest.Status != LeaveRequestStatus.Pending)
                {
                    return BadRequest(new { message = "Leave request is not pending" });
                }

                leaveRequest.Status = LeaveRequestStatus.Rejected;
                leaveRequest.ApprovedBy = request.RejectedBy;
                leaveRequest.ApprovedDate = DateTime.UtcNow;
                leaveRequest.ApprovalNotes = request.RejectionNotes;
                leaveRequest.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Leave request rejected" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting leave request");
                return StatusCode(500, new { message = "Error rejecting request" });
            }
        }

        // GET: api/Leave/balance/{employeeId}
        [HttpGet("balance/{employeeId}")]
        public async Task<IActionResult> GetLeaveBalance(int employeeId, [FromQuery] int? year)
        {
            try
            {
                var targetYear = year ?? DateTime.UtcNow.Year;

                var leaveBalances = await _context.LeaveBalances
                    .Include(lb => lb.Employee)
                    .Include(lb => lb.LeaveType)
                    .Where(lb => lb.EmployeeId == employeeId && lb.Year == targetYear)
                    .Select(lb => new LeaveBalanceDto
                    {
                        Id = lb.Id,
                        EmployeeId = lb.EmployeeId,
                        EmployeeName = $"{lb.Employee!.FirstName} {lb.Employee.LastName}",
                        LeaveTypeId = lb.LeaveTypeId,
                        LeaveTypeName = lb.LeaveType!.Name,
                        Year = lb.Year,
                        TotalDays = lb.TotalDays,
                        UsedDays = lb.UsedDays,
                        RemainingDays = lb.RemainingDays
                    })
                    .ToListAsync();

                // If no balance exists, create default balances
                if (!leaveBalances.Any())
                {
                    var leaveTypes = await _context.LeaveTypes.Where(lt => lt.IsActive).ToListAsync();
                    foreach (var leaveType in leaveTypes)
                    {
                        var balance = new LeaveBalance
                        {
                            EmployeeId = employeeId,
                            LeaveTypeId = leaveType.Id,
                            Year = targetYear,
                            TotalDays = leaveType.DefaultDaysPerYear,
                            UsedDays = 0,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.LeaveBalances.Add(balance);
                    }
                    await _context.SaveChangesAsync();

                    // Re-fetch the balances
                    leaveBalances = await _context.LeaveBalances
                        .Include(lb => lb.Employee)
                        .Include(lb => lb.LeaveType)
                        .Where(lb => lb.EmployeeId == employeeId && lb.Year == targetYear)
                        .Select(lb => new LeaveBalanceDto
                        {
                            Id = lb.Id,
                            EmployeeId = lb.EmployeeId,
                            EmployeeName = $"{lb.Employee!.FirstName} {lb.Employee.LastName}",
                            LeaveTypeId = lb.LeaveTypeId,
                            LeaveTypeName = lb.LeaveType!.Name,
                            Year = lb.Year,
                            TotalDays = lb.TotalDays,
                            UsedDays = lb.UsedDays,
                            RemainingDays = lb.RemainingDays
                        })
                        .ToListAsync();
                }

                return Ok(leaveBalances);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching leave balance");
                return StatusCode(500, new { message = "Error fetching balance" });
            }
        }

        // GET: api/Leave/requests
        [HttpGet("requests")]
        public async Task<IActionResult> GetAllLeaveRequests()
        {
            try
            {
                var leaveRequests = await _context.LeaveRequests
                    .Include(lr => lr.Employee)
                    .Include(lr => lr.LeaveType)
                    .OrderByDescending(lr => lr.CreatedAt)
                    .Select(lr => new LeaveRequestDto
                    {
                        Id = lr.Id,
                        EmployeeId = lr.EmployeeId,
                        EmployeeName = $"{lr.Employee!.FirstName} {lr.Employee.LastName}",
                        LeaveTypeId = lr.LeaveTypeId,
                        LeaveTypeName = lr.LeaveType!.Name,
                        StartDate = lr.StartDate,
                        EndDate = lr.EndDate,
                        NumberOfDays = lr.NumberOfDays,
                        Reason = lr.Reason,
                        Status = lr.Status.ToString(),
                        ApprovedBy = lr.ApprovedBy,
                        ApprovedDate = lr.ApprovedDate,
                        ApprovalNotes = lr.ApprovalNotes,
                        CreatedAt = lr.CreatedAt
                    })
                    .ToListAsync();

                return Ok(leaveRequests);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching leave requests");
                return StatusCode(500, new { message = "Error fetching requests" });
            }
        }
    }
}
