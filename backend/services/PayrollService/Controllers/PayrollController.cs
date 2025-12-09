using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PayrollService.Data;
using PayrollService.Models;
using System.ComponentModel.DataAnnotations;

namespace PayrollService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PayrollController : ControllerBase
    {
        private readonly PayrollDbContext _context;
        private readonly ILogger<PayrollController> _logger;

        public PayrollController(PayrollDbContext context, ILogger<PayrollController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Get all salary records
        [HttpGet("salaries")]
        public async Task<IActionResult> GetAllSalaries()
        {
            var salaries = await _context.SalaryRecords.ToListAsync();
            return Ok(salaries);
        }

        // Get salary by employee ID
        [HttpGet("salaries/{employeeId}")]
        public async Task<IActionResult> GetEmployeeSalary(int employeeId)
        {
            var salary = await _context.SalaryRecords
                .FirstOrDefaultAsync(s => s.EmployeeId == employeeId);
            
            if (salary == null)
                return NotFound(new { Message = $"No salary record found for Employee ID {employeeId}" });

            return Ok(salary);
        }

        // Update salary structure
        [HttpPut("salaries/{employeeId}")]
        public async Task<IActionResult> UpdateSalary(int employeeId, [FromBody] UpdateSalaryRequest request)
        {
            var salary = await _context.SalaryRecords
                .FirstOrDefaultAsync(s => s.EmployeeId == employeeId);
            
            if (salary == null)
                return NotFound(new { Message = $"No salary record found for Employee ID {employeeId}" });

            // Update salary components
            salary.BasicSalary = request.BasicSalary;
            salary.Allowances = request.Allowances;
            salary.NetSalary = request.BasicSalary + request.Allowances;

            await _context.SaveChangesAsync();

            _logger.LogInformation($"Updated salary for Employee {employeeId}: Basic={salary.BasicSalary:C}, Allowances={salary.Allowances:C}, Net={salary.NetSalary:C}");

            return Ok(new { 
                Message = "Salary updated successfully", 
                EmployeeId = employeeId,
                NetSalary = salary.NetSalary 
            });
        }

        // Process monthly payroll
        [HttpPost("process-payroll")]
        public async Task<IActionResult> ProcessPayroll([FromBody] ProcessPayrollRequest request)
        {
            var year = request.Year ?? DateTime.UtcNow.Year;
            var month = request.Month ?? DateTime.UtcNow.Month;

            // Validate month
            if (month < 1 || month > 12)
            {
                return BadRequest(new { Message = "Invalid month. Must be between 1 and 12" });
            }

            // Get all active salary records
            var salaries = await _context.SalaryRecords.ToListAsync();

            if (!salaries.Any())
            {
                return BadRequest(new { Message = "No salary records found" });
            }

           
            var existingPayroll = await _context.PayrollRuns
                .AnyAsync(p => p.Year == year && p.Month == month);

            if (existingPayroll)
            {
                return BadRequest(new { Message = $"Payroll already processed for {year}-{month:D2}" });
            }

            // Calculate total payroll
            decimal totalPayroll = salaries.Sum(s => s.NetSalary);
            int employeeCount = salaries.Count;

            // Create payroll run record
            var payrollRun = new PayrollRun
            {
                Year = year,
                Month = month,
                EmployeeCount = employeeCount,
                TotalAmount = totalPayroll,
                ProcessedDate = DateTime.UtcNow,
                Status = "Completed"
            };

            _context.PayrollRuns.Add(payrollRun);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Processed payroll for {year}-{month:D2}: {employeeCount} employees, Total: {totalPayroll:C}");

            return Ok(new { 
                Message = "Payroll processed successfully",
                Period = $"{year}-{month:D2}",
                EmployeeCount = employeeCount,
                TotalPayroll = totalPayroll,
                ProcessedDate = payrollRun.ProcessedDate
            });
        }

        // Get payroll history
        [HttpGet("payroll-runs")]
        public async Task<IActionResult> GetPayrollHistory()
        {
            var history = await _context.PayrollRuns
                .OrderByDescending(p => p.Year)
                .ThenByDescending(p => p.Month)
                .ToListAsync();

            return Ok(history);
        }

        // Get specific payroll run
        [HttpGet("payroll-runs/{year}/{month}")]
        public async Task<IActionResult> GetPayrollRun(int year, int month)
        {
            var payrollRun = await _context.PayrollRuns
                .FirstOrDefaultAsync(p => p.Year == year && p.Month == month);

            if (payrollRun == null)
                return NotFound(new { Message = $"No payroll run found for {year}-{month:D2}" });

            return Ok(payrollRun);
        }

        // Calculate payroll summary
        [HttpGet("summary")]
        public async Task<IActionResult> GetPayrollSummary()
        {
            var salaries = await _context.SalaryRecords.ToListAsync();

            var summary = new
            {
                TotalEmployees = salaries.Count,
                TotalBasicSalary = salaries.Sum(s => s.BasicSalary),
                TotalAllowances = salaries.Sum(s => s.Allowances),
                TotalNetSalary = salaries.Sum(s => s.NetSalary),
                AverageSalary = salaries.Any() ? salaries.Average(s => s.NetSalary) : 0,
                DepartmentBreakdown = salaries
                    .GroupBy(s => s.Department)
                    .Select(g => new
                    {
                        Department = g.Key,
                        EmployeeCount = g.Count(),
                        TotalSalary = g.Sum(s => s.NetSalary)
                    })
                    .ToList()
            };

            return Ok(summary);
        }
    }

    // DTOs
    public class UpdateSalaryRequest
    {
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Basic salary must be greater than zero")]
        public decimal BasicSalary { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Allowances cannot be negative")]
        public decimal Allowances { get; set; }
    }

    public class ProcessPayrollRequest
    {
        public int? Year { get; set; }
        public int? Month { get; set; }
    }
}
