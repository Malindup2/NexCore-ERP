using System.ComponentModel.DataAnnotations;

namespace ProcurementService.DTOs
{
    public class CreateSupplierRequest
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
    }
}