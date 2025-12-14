using HRService.Data;
using HRService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HRService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeesController : ControllerBase
    {
        private readonly HrDbContext _context;
        private readonly ILogger<EmployeesController> _logger;

        public EmployeesController(HrDbContext context, ILogger<EmployeesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Employees
        [HttpGet]
        public async Task<IActionResult> GetAllEmployees()
        {
            try
            {
                var employees = await _context.Employees
                    .Where(e => e.IsActive)
                    .OrderBy(e => e.FirstName)
                    .Select(e => new
                    {
                        id = e.Id,
                        firstName = e.FirstName,
                        lastName = e.LastName,
                        email = e.Email,
                        phone = e.Phone,
                        department = e.Department,
                        designation = e.Designation,
                        joiningDate = e.JoiningDate,
                        isActive = e.IsActive
                    })
                    .ToListAsync();

                return Ok(employees);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching employees");
                return StatusCode(500, new { message = "Error fetching employees" });
            }
        }

        // GET: api/Employees/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetEmployee(int id)
        {
            try
            {
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (employee == null)
                {
                    return NotFound(new { message = "Employee not found" });
                }

                return Ok(new
                {
                    id = employee.Id,
                    userId = employee.UserId,
                    firstName = employee.FirstName,
                    lastName = employee.LastName,
                    email = employee.Email,
                    phone = employee.Phone,
                    department = employee.Department,
                    designation = employee.Designation,
                    joiningDate = employee.JoiningDate,
                    isActive = employee.IsActive,
                    createdAt = employee.CreatedAt,
                    updatedAt = employee.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching employee");
                return StatusCode(500, new { message = "Error fetching employee" });
            }
        }

        // POST: api/Employees
        [HttpPost]
        public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeDto dto)
        {
            try
            {
                var employee = new Employee
                {
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    Email = dto.Email,
                    Phone = dto.Phone,
                    Department = dto.Department,
                    Designation = dto.Designation,
                    JoiningDate = dto.JoiningDate ?? DateTime.UtcNow,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Employees.Add(employee);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetEmployee), new { id = employee.Id }, new
                {
                    id = employee.Id,
                    firstName = employee.FirstName,
                    lastName = employee.LastName,
                    email = employee.Email,
                    phone = employee.Phone,
                    department = employee.Department,
                    designation = employee.Designation,
                    joiningDate = employee.JoiningDate,
                    isActive = employee.IsActive
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating employee");
                return StatusCode(500, new { message = "Error creating employee" });
            }
        }

        // PUT: api/Employees/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(int id, [FromBody] UpdateEmployeeDto dto)
        {
            try
            {
                var employee = await _context.Employees.FindAsync(id);

                if (employee == null)
                {
                    return NotFound(new { message = "Employee not found" });
                }

                employee.FirstName = dto.FirstName;
                employee.LastName = dto.LastName;
                employee.Email = dto.Email;
                employee.Phone = dto.Phone;
                employee.Department = dto.Department;
                employee.Designation = dto.Designation;
                employee.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Employee updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating employee");
                return StatusCode(500, new { message = "Error updating employee" });
            }
        }

        // DELETE: api/Employees/{id} (Soft delete)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeactivateEmployee(int id)
        {
            try
            {
                var employee = await _context.Employees.FindAsync(id);

                if (employee == null)
                {
                    return NotFound(new { message = "Employee not found" });
                }

                employee.IsActive = false;
                employee.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Employee deactivated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deactivating employee");
                return StatusCode(500, new { message = "Error deactivating employee" });
            }
        }
    }

    public class CreateEmployeeDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Designation { get; set; } = string.Empty;
        public DateTime? JoiningDate { get; set; }
    }

    public class UpdateEmployeeDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Designation { get; set; } = string.Empty;
    }
}
