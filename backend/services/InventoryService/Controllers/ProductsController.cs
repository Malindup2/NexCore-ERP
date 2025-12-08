using InventoryService.Data;
using InventoryService.DTOs;
using InventoryService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventoryService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly InventoryDbContext _context;

        public ProductsController(InventoryDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request)
        {
            // 1. Check if SKU exists
            if (await _context.Products.AnyAsync(p => p.SKU == request.SKU))
            {
                return BadRequest($"Product with SKU '{request.SKU}' already exists.");
            }

            // 2. Save to DB
            var product = new Product
            {
                Name = request.Name,
                SKU = request.SKU,
                Description = request.Description,
                Price = request.Price,
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
    }
}