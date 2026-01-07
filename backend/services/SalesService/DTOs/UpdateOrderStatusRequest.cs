using SalesService.Models;

namespace SalesService.DTOs
{
    public class UpdateOrderStatusRequest
    {
        public OrderStatus Status { get; set; }
    }
}
