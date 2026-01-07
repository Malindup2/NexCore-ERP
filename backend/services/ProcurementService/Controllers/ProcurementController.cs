using InventoryService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcurementService.Data;
using ProcurementService.DTOs;
using ProcurementService.Models;
using Shared.Events;
using Shared.Messaging;

namespace ProcurementService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProcurementController : ControllerBase
    {
        private readonly IRabbitMQProducer _producer;
        private readonly ProcurementDbContext _context;

        public ProcurementController(ProcurementDbContext context, IRabbitMQProducer producer)
        {
            _context = context;
            _producer = producer;
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

            // Validate positive quantity and amount
            if (request.Quantity <= 0)
            {
                return BadRequest(new { Message = "Quantity must be greater than zero" });
            }

            if (request.TotalAmount <= 0)
            {
                return BadRequest(new { Message = "Total amount must be greater than zero" });
            }

            // Validate unit price is reasonable
            decimal unitPrice = request.TotalAmount / request.Quantity;
            if (unitPrice <= 0)
            {
                return BadRequest(new { Message = "Invalid unit price calculation" });
            }

            // Validate SKU format
            if (string.IsNullOrWhiteSpace(request.ProductSku))
            {
                return BadRequest(new { Message = "Product SKU is required" });
            }

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

            return Ok(new { 
                Message = "Purchase Order created", 
                PO_ID = po.Id, 
                Status = "Draft",
                UnitPrice = unitPrice,
                TotalAmount = request.TotalAmount
            });
        }



        [HttpPost("orders/{id}/receive")]
        public async Task<IActionResult> ReceiveGoods(int id)
        {
            //Find the Order
            var order = await _context.PurchaseOrders.FindAsync(id);
            if (order == null) return NotFound("Order not found");

            if (order.Status == OrderStatus.Received)
                return BadRequest("Order already received.");

            // Update Status and received date
            order.Status = OrderStatus.Received;
            var receivedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Publish Event to RabbitMQ with actual amount
            var eventMessage = new GoodsReceivedEvent
            {
                PurchaseOrderId = order.Id,
                ProductSku = order.ProductSku,
                QuantityReceived = order.Quantity,
                TotalAmount = order.TotalAmount,
                ReceivedDate = receivedDate
            };

            _producer.PublishEvent(eventMessage, "procurement.events");

            return Ok(new { Message = "Goods received. Inventory update triggered.", Status = "Received" });
        }

        // Get All Orders
        [HttpGet("orders")]
        public async Task<IActionResult> GetOrders()
        {
            var orders = await _context.PurchaseOrders
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
            return Ok(orders);
        }

        // GET: Get Suppliers
        [HttpGet("suppliers")]
        public async Task<IActionResult> GetSuppliers()
        {
            var suppliers = await _context.Suppliers.ToListAsync();
            return Ok(suppliers);
        }

        // GET: Get Supplier by ID
        [HttpGet("suppliers/{id}")]
        public async Task<IActionResult> GetSupplier(int id)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null) return NotFound("Supplier not found");
            return Ok(supplier);
        }

        // GET: Get Order by ID
        [HttpGet("orders/{id}")]
        public async Task<IActionResult> GetOrder(int id)
        {
            var order = await _context.PurchaseOrders
                .FirstOrDefaultAsync(o => o.Id == id);
            
            if (order == null) return NotFound("Order not found");
            return Ok(order);
        }

        // PUT: Update Supplier
        [HttpPut("suppliers/{id}")]
        public async Task<IActionResult> UpdateSupplier(int id, [FromBody] CreateSupplierRequest request)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null) return NotFound("Supplier not found");

            supplier.Name = request.Name;
            supplier.Email = request.Email;
            supplier.Phone = request.Phone;
            supplier.Address = request.Address;

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Supplier updated successfully", Supplier = supplier });
        }

        // DELETE: Delete Supplier
        [HttpDelete("suppliers/{id}")]
        public async Task<IActionResult> DeleteSupplier(int id)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null) return NotFound("Supplier not found");

            // Check if supplier has orders
            var hasOrders = await _context.PurchaseOrders.AnyAsync(o => o.SupplierId == id);
            if (hasOrders)
            {
                return BadRequest(new { Message = "Cannot delete supplier with existing orders" });
            }

            _context.Suppliers.Remove(supplier);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Supplier deleted successfully" });
        }

        // PUT: Update Order Status
        [HttpPut("orders/{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusRequest request)
        {
            var order = await _context.PurchaseOrders.FindAsync(id);
            if (order == null) return NotFound("Order not found");

            order.Status = request.Status;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Order status updated", Order = order });
        }
    }
}