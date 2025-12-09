using System.ComponentModel.DataAnnotations;

namespace AccountingService.Models
{
    public class Account
    {
        public int Id { get; set; }

        [Required]
        public string AccountCode { get; set; } = string.Empty;

        [Required]
        public string Name { get; set; } = string.Empty; 

        public string Type { get; set; } = string.Empty; 

        public decimal Balance { get; set; } 
    }
}