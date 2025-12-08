using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcurementService.Data;
using ProcurementService.DTOs;
using ProcurementService.Models;

namespace ProcurementService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProcurementController : ControllerBase
    {
        private readonly ProcurementDbContext _context;

        public ProcurementController(ProcurementDbContext context)
        {
            _context = context;
        }

        //  Create a Supplier
        [HttpPost("suppliers")]
        public async Task<IActionResult> CreateSupplier([FromBody] CreateSupplierRequest request)
        {
            var supplier = new Supplier
            {
                Name = request.Name,
                Email = request.Email,
                Phone = request.Phone,
                Address = request.Address,
                CreatedAt = DateTime.UtcNow
            };

            _context.Suppliers.Add(supplier);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Supplier created", SupplierId = supplier.Id });
        }

        // Create a Purchase Order
        [HttpPost("orders")]
        public async Task<IActionResult> CreateOrder([FromBody] CreatePurchaseOrderRequest request)
        {
            // Validate Supplier exists
            var supplier = await _context.Suppliers.FindAsync(request.SupplierId);
            if (supplier == null) return BadRequest("Invalid Supplier ID");

            var po = new PurchaseOrder
            {
                SupplierId = request.SupplierId,
                ProductSku = request.ProductSku,
                Quantity = request.Quantity,
                TotalAmount = request.TotalAmount,
                Status = OrderStatus.Draft, 
                OrderDate = DateTime.UtcNow
            };

            _context.PurchaseOrders.Add(po);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Purchase Order created", PO_ID = po.Id, Status = "Draft" });
        }

        // Get All Orders
        [HttpGet("orders")]
        public async Task<IActionResult> GetOrders()
        {
            return Ok(await _context.PurchaseOrders.ToListAsync());
        }
    }
}