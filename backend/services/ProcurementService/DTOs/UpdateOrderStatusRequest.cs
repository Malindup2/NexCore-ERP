using ProcurementService.Models;

namespace ProcurementService.DTOs
{
    public class UpdateOrderStatusRequest
    {
        public OrderStatus Status { get; set; }
    }
}
