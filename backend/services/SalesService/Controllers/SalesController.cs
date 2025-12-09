using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SalesService.Data;
using SalesService.DTOs;
using SalesService.Models;
using Shared.Events;
using Shared.Messaging;

namespace SalesService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SalesController : ControllerBase
    {
        private readonly SalesDbContext _context;
        private readonly IRabbitMQProducer _producer;

        public SalesController(SalesDbContext context, IRabbitMQProducer producer)
        {
            _context = context;
            _producer = producer;
        }

        //  Create Customer
        [HttpPost("customers")]
        public async Task<IActionResult> CreateCustomer([FromBody] CreateCustomerRequest request)
        {
            var customer = new Customer
            {
                Name = request.Name,
                Email = request.Email,
                Phone = request.Phone,
                Address = request.Address
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Customer created", CustomerId = customer.Id });
        }

        //  Create Sales Order
        [HttpPost("orders")]
        public async Task<IActionResult> CreateOrder([FromBody] CreateSalesOrderRequest request)
        {
            // Validate customer exists
            var customerExists = await _context.Customers.AnyAsync(c => c.Id == request.CustomerId);
            if (!customerExists)
            {
                return BadRequest(new { Message = "Customer not found" });
            }

            // Validate all items have positive quantities and prices
            if (request.Items.Any(i => i.Quantity <= 0 || i.UnitPrice <= 0))
            {
                return BadRequest(new { Message = "All items must have positive quantity and unit price" });
            }

            // Calculate Total
            decimal totalAmount = request.Items.Sum(i => i.Quantity * i.UnitPrice);

            // Validate total amount matches
            decimal calculatedTotal = request.Items.Sum(i => i.Quantity * i.UnitPrice);
            if (Math.Abs(totalAmount - calculatedTotal) > 0.01m)
            {
                return BadRequest(new { Message = "Order total mismatch" });
            }

            // Create Order Entity
            var order = new SalesOrder
            {
                CustomerId = request.CustomerId,
                OrderDate = DateTime.UtcNow,
                Status = OrderStatus.Pending, 
                TotalAmount = totalAmount,
                Items = request.Items.Select(i => new SalesOrderItem
                {
                    ProductSku = i.ProductSku,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice
                }).ToList()
            };

            _context.SalesOrders.Add(order);
            await _context.SaveChangesAsync();

            // Event: "Sales Order Created"
            var salesEvent = new SalesOrderCreatedEvent
            {
                OrderId = order.Id,
                CustomerId = order.CustomerId,
                OrderNumber = order.OrderNumber,
                TotalAmount = order.TotalAmount,
                OrderDate = order.OrderDate,
                Items = order.Items.Select(i => new Shared.Events.SalesOrderItemDto
                {
                    ProductSku = i.ProductSku,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice
                }).ToList()
            };

            _producer.PublishEvent(salesEvent, "sales.events");

            return Ok(new { Message = "Order placed successfully", OrderId = order.Id, OrderNumber = order.OrderNumber });
        }

        // Get Orders
        [HttpGet("orders")]
        public async Task<IActionResult> GetOrders()
        {
            return Ok(await _context.SalesOrders.Include(o => o.Items).ToListAsync());
        }
    }
}