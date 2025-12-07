using HRService.Data;
using HRService.DTOs;
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

        public EmployeesController(HrDbContext context)
        {
            _context = context;
        }

        // POST: api/Employees
        [HttpPost]
        public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeRequest request)
        {
            // Check if email already exists
            if (await _context.Employees.AnyAsync(e => e.Email == request.Email))
            {
                return BadRequest("Employee with this email already exists.");
            }

           
            var employee = new Employee
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                Phone = request.Phone,
                Department = request.Department,
                Designation = request.Designation,
                JoiningDate = request.JoiningDate.ToUniversalTime(), 
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            
            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Employee created successfully", EmployeeId = employee.Id });
        }

        // GET: api/Employees
        [HttpGet]
        public async Task<IActionResult> GetAllEmployees()
        {
            var employees = await _context.Employees.ToListAsync();
            return Ok(employees);
        }
    }
}