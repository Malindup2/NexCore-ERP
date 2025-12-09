using InventoryService.Data;
using InventoryService.DTOs;
using InventoryService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shared.Events;
using Shared.Messaging;

namespace InventoryService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly InventoryDbContext _context;
        private readonly IRabbitMQProducer _producer; 

        public ProductsController(InventoryDbContext context, IRabbitMQProducer producer)
        {
            _context = context;
            _producer = producer;
        }

        [HttpPost]
        public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request)
        {
            if (await _context.Products.AnyAsync(p => p.SKU == request.SKU))
            {
                return BadRequest($"Product with SKU '{request.SKU}' already exists.");
            }

            var product = new Product
            {
                Name = request.Name,
                SKU = request.SKU,
                Description = request.Description,
                Price = request.Price,
                CostPrice = request.CostPrice,
                Quantity = request.Quantity,
                CreatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Product added successfully", ProductId = product.Id });
        }

        [HttpGet]
        public async Task<IActionResult> GetAllProducts()
        {
            return Ok(await _context.Products.ToListAsync());
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();
            return Ok(product);
        }

        // Check Stock Availability by SKU
        [HttpGet("check-stock/{sku}")]
        public async Task<IActionResult> CheckStock(string sku)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.SKU == sku);
            if (product == null) 
                return NotFound(new { Available = false, Message = $"Product with SKU '{sku}' not found" });
            
            return Ok(new { 
                Available = product.Quantity > 0, 
                SKU = product.SKU,
                ProductName = product.Name,
                CurrentStock = product.Quantity,
                ReorderLevel = product.ReorderLevel
            });
        }

        //  Adjust Stock & Publish Event
        [HttpPost("{id}/adjust-stock")]
        public async Task<IActionResult> AdjustStock(int id, [FromBody] StockAdjustmentRequest request)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound("Product not found.");

            int oldQty = product.Quantity;
            product.Quantity += request.Adjustment; 
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            //  PUBLISH EVENT
            var stockEvent = new StockUpdatedEvent
            {
                ProductId = product.Id,
                SKU = product.SKU,
                OldQuantity = oldQty,
                NewQuantity = product.Quantity,
                Reason = request.Reason
            };

            _producer.PublishEvent(stockEvent, "inventory.events");

            return Ok(new { Message = "Stock updated", NewQuantity = product.Quantity });
        }
    }
}