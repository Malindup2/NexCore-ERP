using System.ComponentModel.DataAnnotations.Schema;

namespace ProcurementService.Models
{
    public enum OrderStatus
    {
        Draft,
        Submitted,
        Received,
        Cancelled
    }

    public class PurchaseOrder
    {
        public int Id { get; set; }

        public int SupplierId { get; set; }

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        public OrderStatus Status { get; set; } = OrderStatus.Draft;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public string ProductSku { get; set; } = string.Empty;
        public int Quantity { get; set; }
    }
}