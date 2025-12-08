using System.ComponentModel.DataAnnotations;

namespace InventoryService.DTOs
{
    public class CreateProductRequest
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string SKU { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than 0")]
        public decimal Price { get; set; }

        public int Quantity { get; set; }
    }
}