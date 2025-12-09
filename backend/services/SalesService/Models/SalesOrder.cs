using System.ComponentModel.DataAnnotations.Schema;

namespace SalesService.Models
{
    public enum OrderStatus
    {
        Pending,    
        Confirmed,  
        Shipped,    
        Cancelled   
    }

    public class SalesOrder
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string OrderNumber { get; set; } = Guid.NewGuid().ToString().Substring(0, 8).ToUpper(); 
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public OrderStatus Status { get; set; } = OrderStatus.Pending;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        
        public List<SalesOrderItem> Items { get; set; } = new();
    }
}
namespace SalesService.Models
{
    public class Salesorder
    {
    }
}
