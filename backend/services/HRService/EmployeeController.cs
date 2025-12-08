using HRService.Data;
using HRService.DTOs;
using HRService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shared.Events;     
using Shared.Messaging;   

namespace HRService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeesController : ControllerBase
    {
        private readonly HrDbContext _context;
        private readonly IRabbitMQProducer _messageProducer; 

        
        public EmployeesController(HrDbContext context, IRabbitMQProducer messageProducer)
        {
            _context = context;
            _messageProducer = messageProducer;
        }

        [HttpPost]
        public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeRequest request)
        {
            //  Validation
            if (await _context.Employees.AnyAsync(e => e.Email == request.Email))
            {
                return BadRequest("Employee with this email already exists.");
            }

            // Save to DB
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

            var eventMessage = new EmployeeCreatedEvent
            {
                EmployeeId = employee.Id,
                Email = employee.Email,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                Department = employee.Department,
                JoiningDate = employee.JoiningDate
            };

            _messageProducer.PublishEvent(eventMessage, "employee.events");
            

            return Ok(new { Message = "Employee created & event broadcasted", EmployeeId = employee.Id });
        }

        [HttpGet]
        public async Task<IActionResult> GetAllEmployees()
        {
            return Ok(await _context.Employees.ToListAsync());
        }
    }
}