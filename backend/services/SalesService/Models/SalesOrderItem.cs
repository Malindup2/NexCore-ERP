using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace SalesService.Models
{
    public class SalesOrderItem
    {
        public int Id { get; set; }
        public int SalesOrderId { get; set; }

        public string ProductSku { get; set; } = string.Empty;
        public int Quantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        
        [JsonIgnore]
        public SalesOrder? SalesOrder { get; set; }
    }
}